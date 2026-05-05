
import logging
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

logger = logging.getLogger(__name__)


class GeocodeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        query = request.query_params.get("q", "").strip()
        if not query:
            return Response(
                {"success": False, "error": "Query parameter 'q' is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if len(query) < 2:
            return Response(
                {"success": False, "error": "Query must be at least 2 characters."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        result = self._geocode_nominatim(query)

        if not result:
            result = self._geocode_google(query)

        if result:
            return Response({
                "success": True,
                "results": [result],
            })

        return Response(
            {"success": False, "error": f"Could not geocode '{query}'."},
            status=status.HTTP_404_NOT_FOUND,
        )

    def _geocode_nominatim(self, query):
        try:
            from geopy.geocoders import Nominatim
            geolocator = Nominatim(user_agent="venuevista-platform")
            location = geolocator.geocode(query, exactly_one=True, timeout=10)
            if location:
                return {
                    "name": location.address,
                    "latitude": round(location.latitude, 6),
                    "longitude": round(location.longitude, 6),
                }
        except Exception as e:
            logger.warning(f"Nominatim geocoding failed for '{query}': {e}")
        return None

    def _geocode_google(self, query):
        from django.conf import settings
        api_key = getattr(settings, "GOOGLE_MAPS_API_KEY", "")
        if not api_key or api_key.startswith("your-"):
            return None

        try:
            from integrations.google_geocoding import forward_geocode
            result = forward_geocode(query)
            if result:
                return {
                    "name": query,
                    "latitude": round(result["latitude"], 6),
                    "longitude": round(result["longitude"], 6),
                }
        except Exception as e:
            logger.warning(f"Google geocoding failed for '{query}': {e}")
        return None
