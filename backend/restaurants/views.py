
from datetime import timedelta

from django.conf import settings
from django.contrib.gis.geos import Point
from django.contrib.gis.measure import D
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Restaurant, CuisineType, SearchArea, TaskStatus
from .serializers import (
    RestaurantSerializer,
    RestaurantListSerializer,
    RestaurantSearchRequestSerializer,
    CuisineTypeSerializer,
)
from .filters import RestaurantFilter
from core.throttles import SearchRateThrottle


class RestaurantListView(generics.ListAPIView):
    queryset = Restaurant.objects.all()
    serializer_class = RestaurantListSerializer
    filterset_class = RestaurantFilter
    search_fields = ["name", "address", "inferred_cuisine"]
    ordering_fields = ["rating", "user_ratings_total", "price_level", "name"]


class RestaurantDetailView(generics.RetrieveAPIView):
    queryset = Restaurant.objects.all()
    serializer_class = RestaurantSerializer


class CuisineTypeListView(generics.ListAPIView):
    queryset = CuisineType.objects.all()
    serializer_class = CuisineTypeSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None


class RestaurantSearchView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [SearchRateThrottle]

    def post(self, request):
        serializer = RestaurantSearchRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        lat = data["latitude"]
        lng = data["longitude"]
        radius = data["radius"]
        cuisine = data.get("cuisine", "").strip().lower()
        query = data.get("query", "").strip()

        search_point = Point(lng, lat, srid=4326)
        cache_ttl = timedelta(days=settings.SEARCH_CACHE_TTL_DAYS)

        from integrations.google_geocoding import reverse_geocode_detailed
        geocoded_data = reverse_geocode_detailed(lat, lng)
        provided_city_name = request.data.get('city_name')
        city_name = provided_city_name or geocoded_data.get('city')
        admin_level_1 = geocoded_data.get('state')
        country = geocoded_data.get('country')

        fresh_cache = None
        task_id = None

        if city_name:
            city_level_areas = SearchArea.objects.filter(
                city_name__iexact=city_name,
                cuisine_filter__iexact=cuisine,
                last_fetched__gte=timezone.now() - cache_ttl
            )
            for area in city_level_areas:
                if area.radius_meters >= radius:
                    fresh_cache = area
                    break

        if not fresh_cache:
            existing_areas = SearchArea.objects.filter(
                center__dwithin=(search_point, D(m=radius)),
                radius_meters__gte=radius,
                last_fetched__gte=timezone.now() - cache_ttl
            )
            if cuisine:
                existing_areas = existing_areas.filter(cuisine_filter__iexact=cuisine)
            fresh_cache = existing_areas.first()

        cache_status = "hit" if fresh_cache else "miss"

        if not fresh_cache:
            try:
                profile = getattr(request.user, "profile", None)
                if profile and profile.api_calls_used >= getattr(settings, "DAILY_API_CALL_LIMIT", 100):
                    return Response({
                        "success": False,
                        "error": {
                            "code": 429,
                            "detail": "Daily API limit exceeded. Please try again tomorrow.",
                        }
                    }, status=status.HTTP_429_TOO_MANY_REQUESTS)

                from integrations.tasks import fetch_places_task
                result = fetch_places_task.delay(
                    query=query or cuisine,
                    latitude=lat,
                    longitude=lng,
                    radius=radius,
                    cuisine=cuisine,
                    user_id=request.user.id,
                    city_name=city_name,
                    admin_level_1=admin_level_1,
                    country=country
                )
                task_id = result.id
            except Exception:
                pass

        restaurants = Restaurant.objects.filter(
            location__dwithin=(search_point, D(m=radius))
        )

        if cuisine:
            restaurants = restaurants.filter(inferred_cuisine__icontains=cuisine)

        max_competition = data.get("max_competition")
        min_rating = data.get("min_rating")
        max_price_level = data.get("max_price_level")

        if min_rating is not None:
            restaurants = restaurants.filter(rating__gte=min_rating)
        if max_price_level is not None:
            restaurants = restaurants.filter(price_level__lte=max_price_level)

        results = RestaurantListSerializer(restaurants, many=True).data

        try:
            from bookmarks.models import SearchHistory
            SearchHistory.objects.create(
                user=request.user,
                query=query or cuisine,
                latitude=lat,
                longitude=lng,
                results_count=len(results),
                filters_applied={
                    "cuisine": cuisine,
                    "radius": radius,
                    "min_rating": min_rating,
                    "max_price_level": max_price_level,
                    "max_competition": max_competition,
                },
            )
        except Exception:
            pass

        return Response({
            "success": True,
            "cache_status": cache_status,
            "task_id": task_id,
            "count": len(results),
            "data": results,
        })


class DiscoverView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [SearchRateThrottle]

    def post(self, request):
        from .serializers import DiscoverRequestSerializer
        import math
        import uuid

        serializer = DiscoverRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        lat = data["latitude"]
        lng = data["longitude"]
        radius = data["radius"]
        cuisine = data.get("cuisine", "").strip().lower()
        min_cluster_size = data.get("min_cluster_size", 2)
        max_competition = data.get("max_competition")
        competition_radius_km = data.get("competition_radius_km", 0.5)

        grid_step = settings.DISCOVER_GRID_STEP_M
        max_grid_points = settings.DISCOVER_MAX_GRID_POINTS

        grid_points = self._generate_grid_points(lat, lng, radius, grid_step)

        if len(grid_points) > max_grid_points:
            return Response(
                {
                    "success": False,
                    "error": f"The selected area requires {len(grid_points)} grid points, "
                             f"exceeding the safety cap of {max_grid_points}. "
                             f"Please choose a smaller radius.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        task_id = str(uuid.uuid4())
        TaskStatus.objects.create(
            task_id=task_id,
            task_type="discover",
            state="PENDING",
            grid_points_total=len(grid_points),
            progress_message="Task queued. Starting discovery...",
            created_by=request.user,
        )

        try:
            from integrations.tasks import discover_task
            discover_task.delay(
                task_id=task_id,
                grid_points=grid_points,
                center_lat=lat,
                center_lng=lng,
                radius=radius,
                cuisine=cuisine,
                min_cluster_size=min_cluster_size,
                max_competition=max_competition,
                competition_radius_km=competition_radius_km,
                user_id=request.user.id,
            )
        except Exception as e:
            TaskStatus.objects.filter(task_id=task_id).update(
                state="FAILED",
                error_message=f"Task queue unavailable: {str(e)}. "
                              f"Please ensure Celery is running.",
            )
            return Response(
                {"success": False, "error": "Task queue unavailable.", "task_id": task_id},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        return Response(
            {"success": True, "task_id": task_id, "grid_points": len(grid_points)},
            status=status.HTTP_202_ACCEPTED,
        )

    @staticmethod
    def _generate_grid_points(center_lat, center_lng, radius_m, step_m):
        import math

        meters_per_deg_lat = 111_320.0
        meters_per_deg_lng = 111_320.0 * math.cos(math.radians(center_lat))

        if meters_per_deg_lng <= 0:
            meters_per_deg_lng = 1.0

        step_lat = step_m / meters_per_deg_lat
        step_lng = step_m / meters_per_deg_lng

        n_steps = int(math.ceil(radius_m / step_m))

        points = []
        for i in range(-n_steps, n_steps + 1):
            for j in range(-n_steps, n_steps + 1):
                offset_lat = i * step_lat
                offset_lng = j * step_lng

                dist_m = math.sqrt(
                    (offset_lat * meters_per_deg_lat) ** 2 +
                    (offset_lng * meters_per_deg_lng) ** 2
                )
                if dist_m <= radius_m:
                    points.append([
                        round(center_lat + offset_lat, 6),
                        round(center_lng + offset_lng, 6),
                    ])

        return points

