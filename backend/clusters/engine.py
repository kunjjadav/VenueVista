import logging
import numpy as np

logger = logging.getLogger(__name__)

def calculate_viability_score(cluster_restaurants_data):
    if not cluster_restaurants_data:
        return 0

    total_reviews = sum(r.get("user_ratings_total", 0) for r in cluster_restaurants_data)
    restaurant_count = len(cluster_restaurants_data)
    avg_rating = np.mean([r.get("rating", 3.0) or 3.0 for r in cluster_restaurants_data])

    foot_traffic_raw = np.log1p(total_reviews)
    foot_traffic_score = min(foot_traffic_raw / np.log1p(50000), 1.0) * 100

    competition_raw = restaurant_count
    competition_penalty = min(competition_raw / 50, 1.0) * 100

    rating_bonus = (avg_rating / 5.0) * 15

    score = (foot_traffic_score * 0.6) - (competition_penalty * 0.4) + rating_bonus
    score = max(0, min(100, score))

    return round(score, 2)


def run_clustering(
    restaurant_queryset,
    cuisine_filter=None,
    min_cluster_size=2,
    min_samples=2,
    max_competition=None,
    competition_radius_km=0.5,
    max_cluster_radius_km=2.0,
    max_cluster_count=150,
):

    restaurants_data = []
    for r in restaurant_queryset:
        if r.location:
            restaurants_data.append({
                "id": r.id,
                "latitude": r.location.y,
                "longitude": r.location.x,
                "rating": r.rating,
                "user_ratings_total": r.user_ratings_total,
                "price_level": r.price_level,
                "name": r.name,
            })

    if len(restaurants_data) < min_cluster_size:
        return []

    lats = [r["latitude"] for r in restaurants_data]
    lons = [r["longitude"] for r in restaurants_data]

    if not lats or not lons:
        return []

    min_lat, max_lat = min(lats), max(lats)
    min_lon, max_lon = min(lons), max(lons)
    mean_lat = np.mean(lats)

    step_lat = competition_radius_km / 111.0
    step_lon = competition_radius_km / (111.0 * np.cos(np.deg2rad(mean_lat)))

    if step_lat <= 0 or step_lon <= 0:
        return []


    from collections import defaultdict
    grid = defaultdict(list)

    for r in restaurants_data:
        i = int((r["latitude"] - min_lat) / step_lat)
        j = int((r["longitude"] - min_lon) / step_lon)
        grid[(i, j)].append(r)

    cluster_results = []
    
    for (i, j), cell_restaurants in grid.items():
        if len(cell_restaurants) < min_cluster_size:
            continue

        if max_competition is not None and len(cell_restaurants) > max_competition:
            continue

        cell_min_lat = min_lat + i * step_lat
        cell_max_lat = min_lat + (i + 1) * step_lat
        cell_min_lon = min_lon + j * step_lon
        cell_max_lon = min_lon + (j + 1) * step_lon

        centroid_lat = (cell_min_lat + cell_max_lat) / 2.0
        centroid_lon = (cell_min_lon + cell_max_lon) / 2.0

        polygon = {
            "type": "Polygon",
            "coordinates": [[
                [cell_min_lon, cell_min_lat],
                [cell_max_lon, cell_min_lat],
                [cell_max_lon, cell_max_lat],
                [cell_min_lon, cell_max_lat],
                [cell_min_lon, cell_min_lat],
            ]]
        }

        ratings = [r["rating"] for r in cell_restaurants if r["rating"] is not None]
        prices = [r["price_level"] for r in cell_restaurants if r["price_level"] is not None]
        total_reviews = sum(r["user_ratings_total"] for r in cell_restaurants)
        viability = calculate_viability_score(cell_restaurants)

        cluster_results.append({
            "centroid_lat": round(centroid_lat, 6),
            "centroid_lon": round(centroid_lon, 6),
            "polygon": polygon,
            "restaurant_ids": [r["id"] for r in cell_restaurants],
            "restaurant_count": len(cell_restaurants),
            "avg_rating": round(np.mean(ratings), 2) if ratings else None,
            "avg_price_level": round(np.mean(prices), 2) if prices else None,
            "total_reviews": total_reviews,
            "avg_nearby_competition": len(cell_restaurants),
            "viability_score": viability,
            "epsilon_used": competition_radius_km,
            "min_samples_used": min_cluster_size,
        })

    cluster_results.sort(key=lambda c: c["viability_score"], reverse=True)

    logger.info(f"Grid clustering done: {len(cluster_results)} zones.")

    return cluster_results
