
import logging
import requests
from django.conf import settings

logger = logging.getLogger(__name__)

GEOCODING_API_URL = "https://maps.googleapis.com/maps/api/geocode/json"


def reverse_geocode(latitude, longitude):
    api_key = settings.GOOGLE_MAPS_API_KEY
    if api_key:
        try:
            response = requests.get(
                GEOCODING_API_URL,
                params={
                    "latlng": f"{latitude},{longitude}",
                    "key": api_key,
                    "result_type": "street_address|route|locality",
                },
                timeout=10,
            )
            response.raise_for_status()
            data = response.json()

            if data.get("status") == "OK" and data.get("results"):
                return data["results"][0]["formatted_address"]

        except requests.exceptions.RequestException as e:
            logger.warning(f"Google reverse geocoding failed: {e}")

    try:
        from geopy.geocoders import Nominatim
        geolocator = Nominatim(user_agent="venuevista-platform")
        location = geolocator.reverse((latitude, longitude), exactly_one=True, timeout=10)
        if location:
            return location.address
    except Exception as e:
        logger.warning(f"Nominatim reverse geocoding failed: {e}")

    return "Address not found"


def forward_geocode(address):
    api_key = settings.GOOGLE_MAPS_API_KEY
    if api_key:
        try:
            response = requests.get(
                GEOCODING_API_URL,
                params={"address": address, "key": api_key},
                timeout=10,
            )
            response.raise_for_status()
            data = response.json()

            if data.get("status") == "OK" and data.get("results"):
                loc = data["results"][0]["geometry"]["location"]
                return {"latitude": loc["lat"], "longitude": loc["lng"]}

        except requests.exceptions.RequestException as e:
            logger.warning(f"Google forward geocoding failed: {e}")

    try:
        from geopy.geocoders import Nominatim
        geolocator = Nominatim(user_agent="venuevista-platform")
        location = geolocator.geocode(address, timeout=10)
        if location:
            return {"latitude": location.latitude, "longitude": location.longitude}
    except Exception as e:
        logger.warning(f"Nominatim forward geocoding failed: {e}")

    return None


def reverse_geocode_detailed(latitude, longitude):
    result = {"city": None, "state": None, "country": None}

    api_key = settings.GOOGLE_MAPS_API_KEY
    if api_key:
        try:
            response = requests.get(
                GEOCODING_API_URL,
                params={
                    "latlng": f"{latitude},{longitude}",
                    "key": api_key,
                },
                timeout=10,
            )
            response.raise_for_status()
            data = response.json()

            if data.get("status") == "OK" and data.get("results"):
                for component in data["results"][0].get("address_components", []):
                    types = component.get("types", [])
                    if "locality" in types:
                        result["city"] = component.get("long_name")
                    elif "administrative_area_level_1" in types:
                        result["state"] = component.get("long_name")
                    elif "country" in types:
                        result["country"] = component.get("long_name")
                return result
        except requests.exceptions.RequestException as e:
            logger.warning(f"Google reverse geocoding detailed failed: {e}")

    try:
        from geopy.geocoders import Nominatim
        geolocator = Nominatim(user_agent="venuevista-platform")
        location = geolocator.reverse((latitude, longitude), exactly_one=True, timeout=10)
        if location and location.raw.get("address"):
            addr = location.raw["address"]
            result["city"] = addr.get("city") or addr.get("town") or addr.get("village")
            result["state"] = addr.get("state")
            result["country"] = addr.get("country")
            return result
    except Exception as e:
        logger.warning(f"Nominatim reverse geocoding detailed failed: {e}")

    return result
