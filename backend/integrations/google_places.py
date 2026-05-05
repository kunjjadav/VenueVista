
import logging
import time
import requests
from django.conf import settings

logger = logging.getLogger(__name__)

PLACES_API_BASE = "https://places.googleapis.com/v1"

FIELD_MASK = ",".join([
    "places.id",
    "places.displayName",
    "places.formattedAddress",
    "places.location",
    "places.rating",
    "places.userRatingCount",
    "places.priceLevel",
    "places.types",
])


def _get_headers():
    return {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": settings.GOOGLE_PLACES_API_KEY,
        "X-Goog-FieldMask": FIELD_MASK,
    }


def _parse_place(place_data):
    location = place_data.get("location", {})
    display_name = place_data.get("displayName", {})

    price_map = {
        "PRICE_LEVEL_FREE": 0,
        "PRICE_LEVEL_INEXPENSIVE": 1,
        "PRICE_LEVEL_MODERATE": 2,
        "PRICE_LEVEL_EXPENSIVE": 3,
        "PRICE_LEVEL_VERY_EXPENSIVE": 4,
    }

    return {
        "google_place_id": place_data.get("id", ""),
        "name": display_name.get("text", "Unknown"),
        "latitude": location.get("latitude"),
        "longitude": location.get("longitude"),
        "address": place_data.get("formattedAddress", ""),
        "rating": place_data.get("rating"),
        "user_ratings_total": place_data.get("userRatingCount", 0),
        "price_level": price_map.get(place_data.get("priceLevel"), None),
        "types": place_data.get("types", []),
    }


def search_text(query, location_bias=None, max_results=20):
    api_key = settings.GOOGLE_PLACES_API_KEY
    if not api_key or api_key.startswith("your-"):
        logger.warning("Google Places API key not configured. Skipping text search.")
        return []

    url = f"{PLACES_API_BASE}/places:searchText"

    body = {
        "textQuery": query,
        "maxResultCount": min(max_results, 20),
    }

    if location_bias:
        body["locationBias"] = {
            "circle": {
                "center": {
                    "latitude": location_bias["latitude"],
                    "longitude": location_bias["longitude"],
                },
                "radius": location_bias.get("radius", 5000),
            }
        }

    try:
        response = requests.post(url, json=body, headers=_get_headers(), timeout=15)
        response.raise_for_status()
        data = response.json()

        places = data.get("places", [])
        return [_parse_place(p) for p in places]

    except requests.exceptions.RequestException as e:
        logger.error(f"Google Places Text Search failed: {e}")
        return []


def search_nearby(latitude, longitude, radius=2000, included_types=None, max_results=20):
    api_key = settings.GOOGLE_PLACES_API_KEY
    if not api_key or api_key.startswith("your-"):
        logger.warning("Google Places API key not configured. Skipping nearby search.")
        return []

    url = f"{PLACES_API_BASE}/places:searchNearby"

    body = {
        "maxResultCount": min(max_results, 20),
        "locationRestriction": {
            "circle": {
                "center": {
                    "latitude": latitude,
                    "longitude": longitude,
                },
                "radius": float(radius),
            }
        },
    }

    if included_types:
        body["includedTypes"] = included_types

    try:
        response = requests.post(url, json=body, headers=_get_headers(), timeout=15)
        response.raise_for_status()
        data = response.json()

        places = data.get("places", [])
        return [_parse_place(p) for p in places]

    except requests.exceptions.RequestException as e:
        logger.error(f"Google Places Nearby Search failed: {e}")
        return []
