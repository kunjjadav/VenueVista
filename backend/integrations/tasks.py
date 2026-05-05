import logging
import time
from celery import shared_task
from django.contrib.gis.geos import Point
from django.contrib.gis.measure import D

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3, default_retry_delay=30)
def fetch_places_task(self, query, latitude, longitude, radius, cuisine="", user_id=None, city_name=None, admin_level_1=None, country=None):
    from restaurants.models import Restaurant, SearchArea, CuisineType
    from integrations.google_places import search_text, search_nearby

    try:
        logger.info(f"[fetch_places_task] Starting: query='{query}', lat={latitude}, lng={longitude}")

        places = []

        if query:
            places = search_text(
                query=f"{query} restaurant",
                location_bias={"latitude": latitude, "longitude": longitude, "radius": radius},
                max_results=20,
            )

        if len(places) < 10:
            included_types = ["restaurant"]
            nearby = search_nearby(
                latitude=latitude,
                longitude=longitude,
                radius=radius,
                included_types=included_types,
                max_results=20,
            )

            existing_ids = {p["google_place_id"] for p in places}
            for p in nearby:
                if p["google_place_id"] not in existing_ids:
                    places.append(p)

        logger.info(f"[fetch_places_task] Fetched {len(places)} places from Google API")

        if user_id:
            from accounts.models import UserProfile
            try:
                profile = UserProfile.objects.get(user_id=user_id)
                api_queries = 1 if query else 0
                if len(places) < 10:
                    api_queries += 1
                
                profile.api_calls_used += api_queries
                profile.save(update_fields=["api_calls_used"])
            except UserProfile.DoesNotExist:
                pass

        created_count = 0
        updated_count = 0

        for place in places:
            if not place.get("latitude") or not place.get("longitude"):
                continue

            point = Point(place["longitude"], place["latitude"], srid=4326)

            inferred_cuisine = cuisine or _infer_cuisine_from_types(place.get("types", []))

            obj, created = Restaurant.objects.update_or_create(
                google_place_id=place["google_place_id"],
                defaults={
                    "name": place["name"],
                    "location": point,
                    "address": place["address"],
                    "rating": place["rating"],
                    "user_ratings_total": place["user_ratings_total"],
                    "price_level": place["price_level"],
                    "inferred_cuisine": inferred_cuisine,
                    "is_from_csv": False,
                },
            )

            if created:
                created_count += 1
            else:
                updated_count += 1

        search_point = Point(longitude, latitude, srid=4326)
        existing_area = SearchArea.objects.filter(
            center__dwithin=(search_point, D(m=100)),
            radius_meters=radius,
            cuisine_filter=cuisine,
        ).first()

        if existing_area:
            existing_area.query_text = query
            existing_area.result_count = len(places)
            existing_area.save(update_fields=["query_text", "result_count"])
        else:
            SearchArea.objects.create(
                center=search_point,
                radius_meters=radius,
                cuisine_filter=cuisine,
                query_text=query,
                result_count=len(places),
                city_name=city_name,
                admin_level_1=admin_level_1,
                country=country,
            )

        logger.info(
            f"[fetch_places_task] Complete: {created_count} created, "
            f"{updated_count} updated, SearchArea cached."
        )

        return {
            "status": "success",
            "created": created_count,
            "updated": updated_count,
            "total_fetched": len(places),
        }

    except Exception as exc:
        logger.error(f"[fetch_places_task] Error: {exc}")
        raise self.retry(exc=exc)


@shared_task(bind=True, max_retries=2)
def reverse_geocode_clusters_task(self, cluster_ids):
    from clusters.models import Cluster
    from integrations.google_geocoding import reverse_geocode

    try:
        clusters = Cluster.objects.filter(id__in=cluster_ids, address="")
        geocoded_count = 0

        for cluster in clusters:
            if cluster.centroid:
                lat = cluster.centroid.y
                lng = cluster.centroid.x

                address = reverse_geocode(lat, lng)
                if address and address != "Address not found":
                    cluster.address = address
                    cluster.save(update_fields=["address"])
                    geocoded_count += 1
                    logger.info(f"[reverse_geocode] Cluster #{cluster.id} → {address[:60]}")

                time.sleep(1)  # stay within rate limits

        return {"status": "success", "geocoded_count": geocoded_count}

    except Exception as exc:
        logger.error(f"[reverse_geocode_clusters_task] Error: {exc}")
        raise self.retry(exc=exc)


def _infer_cuisine_from_types(google_types):
    cuisine_map = {
        "indian_restaurant": "indian",
        "chinese_restaurant": "chinese",
        "italian_restaurant": "italian",
        "japanese_restaurant": "japanese",
        "mexican_restaurant": "mexican",
        "thai_restaurant": "thai",
        "korean_restaurant": "korean",
        "french_restaurant": "french",
        "pizza_restaurant": "pizza",
        "seafood_restaurant": "seafood",
        "steak_house": "steakhouse",
        "sushi_restaurant": "sushi",
        "hamburger_restaurant": "burger",
        "cafe": "cafe",
        "bakery": "bakery",
    }

    for gtype in google_types:
        if gtype in cuisine_map:
            return cuisine_map[gtype]

    return "restaurant"



@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def discover_task(
    self,
    task_id,
    grid_points,
    center_lat,
    center_lng,
    radius,
    cuisine="",
    min_cluster_size=2,
    max_competition=None,
    competition_radius_km=0.5,
    user_id=None,
):

    from restaurants.models import Restaurant, SearchArea, TaskStatus
    from restaurants.serializers import RestaurantListSerializer
    from clusters.serializers import ClusterListSerializer
    from clusters.engine import run_clustering
    from clusters.models import Cluster
    from integrations.google_places import search_nearby, search_text
    from django.contrib.gis.geos import Point
    from django.contrib.gis.measure import D
    from django.conf import settings
    from django.utils import timezone
    from datetime import timedelta

    try:
        task_status = TaskStatus.objects.get(task_id=task_id)
        task_status.state = "IN_PROGRESS"
        task_status.progress_message = "Checking smart cache..."
        task_status.save(update_fields=["state", "progress_message", "updated_at"])

        cache_ttl = timedelta(days=settings.SEARCH_CACHE_TTL_DAYS)
        cache_radius_m = settings.SMART_CACHE_RADIUS_M
        api_delay = settings.DISCOVER_API_DELAY_S
        api_key = getattr(settings, "GOOGLE_PLACES_API_KEY", "")
        has_api_key = bool(api_key) and not api_key.startswith("your-")

        total_points = len(grid_points)
        cached_count = 0
        fetched_count = 0
        new_restaurants = 0
        updated_restaurants = 0
        all_place_ids = set()  # For deduplication across grid points

        for idx, (pt_lat, pt_lng) in enumerate(grid_points):
            point = Point(pt_lng, pt_lat, srid=4326)

            cached_area = SearchArea.objects.filter(
                center__dwithin=(point, D(m=cache_radius_m)),
                radius_meters__gte=1500,  # Google search radius
                last_fetched__gte=timezone.now() - cache_ttl,
            ).first()

            if cached_area:
                cached_count += 1
            elif has_api_key:
                places = search_nearby(
                    latitude=pt_lat,
                    longitude=pt_lng,
                    radius=2000,
                    included_types=["restaurant"],
                    max_results=20,
                )

                if cuisine:
                    text_places = search_text(
                        query=f"{cuisine} restaurant",
                        location_bias={
                            "latitude": pt_lat,
                            "longitude": pt_lng,
                            "radius": 2000,
                        },
                        max_results=20,
                    )
                    existing_ids = {p["google_place_id"] for p in places}
                    for tp in text_places:
                        if tp["google_place_id"] not in existing_ids:
                            places.append(tp)

                for place in places:
                    if not place.get("latitude") or not place.get("longitude"):
                        continue
                    if place["google_place_id"] in all_place_ids:
                        continue  # Already processed in this batch

                    all_place_ids.add(place["google_place_id"])
                    place_point = Point(place["longitude"], place["latitude"], srid=4326)
                    inferred = cuisine or _infer_cuisine_from_types(place.get("types", []))

                    obj, created = Restaurant.objects.update_or_create(
                        google_place_id=place["google_place_id"],
                        defaults={
                            "name": place["name"],
                            "location": place_point,
                            "address": place["address"],
                            "rating": place["rating"],
                            "user_ratings_total": place["user_ratings_total"],
                            "price_level": place["price_level"],
                            "inferred_cuisine": inferred,
                            "is_from_csv": False,
                        },
                    )
                    if created:
                        new_restaurants += 1
                    else:
                        updated_restaurants += 1

                SearchArea.objects.update_or_create(
                    center__dwithin=(point, D(m=50)),
                    radius_meters=2000,
                    defaults={
                        "center": point,
                        "radius_meters": 2000,
                        "cuisine_filter": cuisine,
                        "query_text": cuisine or "restaurant",
                        "result_count": len(places),
                    },
                )

                fetched_count += 1
                time.sleep(api_delay)  # Google rate limiting

            processed = idx + 1
            percent = int((processed / total_points) * 80)  # Reserve 20% for clustering
            task_status.grid_points_processed = processed
            task_status.grid_points_cached = cached_count
            task_status.restaurants_fetched = fetched_count
            task_status.restaurants_new = new_restaurants
            task_status.progress_percent = percent
            task_status.progress_message = (
                f"Processing grid point {processed}/{total_points}... "
                f"({cached_count} cached, {new_restaurants} new restaurants)"
            )
            task_status.save(update_fields=[
                "grid_points_processed", "grid_points_cached",
                "restaurants_fetched", "restaurants_new",
                "progress_percent", "progress_message", "updated_at",
            ])

        task_status.progress_percent = 82
        task_status.progress_message = "Querying local database..."
        task_status.save(update_fields=["progress_percent", "progress_message", "updated_at"])

        search_point = Point(center_lng, center_lat, srid=4326)
        restaurants_qs = Restaurant.objects.filter(
            location__dwithin=(search_point, D(m=radius))
        )
        if cuisine:
            restaurants_qs = restaurants_qs.filter(inferred_cuisine__icontains=cuisine)

        total_in_area = restaurants_qs.count()

        task_status.progress_percent = 88
        task_status.progress_message = f"Running clustering on {total_in_area} restaurants..."
        task_status.save(update_fields=["progress_percent", "progress_message", "updated_at"])

        cluster_results = run_clustering(
            restaurant_queryset=restaurants_qs,
            cuisine_filter=cuisine,
            min_cluster_size=min_cluster_size,
            max_competition=max_competition,
            competition_radius_km=competition_radius_km,
        )

        task_status.progress_percent = 92
        task_status.progress_message = f"Saving {len(cluster_results)} clusters..."
        task_status.save(update_fields=["progress_percent", "progress_message", "updated_at"])

        user_obj = None
        if user_id:
            from accounts.models import CustomUser
            try:
                user_obj = CustomUser.objects.get(id=user_id)
            except CustomUser.DoesNotExist:
                pass

        saved_clusters = []
        for cr in cluster_results:
            centroid = Point(cr["centroid_lon"], cr["centroid_lat"], srid=4326)
            cluster_obj = Cluster.objects.create(
                created_by=user_obj,
                centroid=centroid,
                polygon=cr.get("polygon"),
                viability_score=cr["viability_score"],
                restaurant_count=cr["restaurant_count"],
                avg_rating=cr["avg_rating"],
                avg_price_level=cr["avg_price_level"],
                total_reviews=cr["total_reviews"],
                avg_nearby_competition=cr["avg_nearby_competition"],
                epsilon_used=cr["epsilon_used"],
                min_samples_used=cr["min_samples_used"],
                cuisine_filter=cuisine,
                search_latitude=center_lat,
                search_longitude=center_lng,
                search_radius=radius,
            )
            cluster_obj.restaurants.set(cr["restaurant_ids"])
            saved_clusters.append(cluster_obj)

        try:
            cluster_ids = [c.id for c in saved_clusters]
            reverse_geocode_clusters_task.delay(cluster_ids)
        except Exception:
            pass

        task_status.progress_percent = 96
        task_status.progress_message = "Preparing results..."
        task_status.save(update_fields=["progress_percent", "progress_message", "updated_at"])

        restaurants_data = RestaurantListSerializer(restaurants_qs[:500], many=True).data
        clusters_data = ClusterListSerializer(saved_clusters, many=True).data

        task_status.state = "COMPLETED"
        task_status.progress_percent = 100
        task_status.progress_message = (
            f"Discovery complete! {total_in_area} restaurants, "
            f"{len(saved_clusters)} clusters found."
        )
        task_status.result_data = {
            "restaurants": restaurants_data,
            "clusters": clusters_data,
            "fetch_stats": {
                "grid_points_total": total_points,
                "grid_points_cached": cached_count,
                "grid_points_fetched": fetched_count,
                "restaurants_new": new_restaurants,
                "restaurants_updated": updated_restaurants,
                "total_in_area": total_in_area,
            },
        }
        task_status.save()

        logger.info(
            f"[discover_task] Complete: {task_id} — "
            f"{total_in_area} restaurants, {len(saved_clusters)} clusters, "
            f"{cached_count}/{total_points} cached"
        )

        return {"status": "success", "task_id": task_id}

    except Exception as exc:
        logger.error(f"[discover_task] Error: {exc}", exc_info=True)

        try:
            TaskStatus.objects.filter(task_id=task_id).update(
                state="FAILED",
                progress_message="An error occurred during discovery.",
                error_message=str(exc)[:2000],
            )
        except Exception:
            pass

        raise self.retry(exc=exc)

