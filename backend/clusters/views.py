
from django.contrib.gis.geos import Point
from django.contrib.gis.measure import D
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from restaurants.models import Restaurant
from .models import Cluster
from .serializers import (
    ClusterSerializer,
    ClusterListSerializer,
    ClusterAnalyzeRequestSerializer,
)
from .engine import run_clustering
from core.throttles import AnalyzeRateThrottle


class ClusterListView(generics.ListAPIView):
    serializer_class = ClusterListSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Cluster.objects.filter(created_by=self.request.user)


class ClusterDetailView(generics.RetrieveAPIView):
    serializer_class = ClusterSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Cluster.objects.filter(created_by=self.request.user).prefetch_related("restaurants")


class ClusterAnalyzeView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [AnalyzeRateThrottle]

    def post(self, request):
        serializer = ClusterAnalyzeRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        lat = data["latitude"]
        lng = data["longitude"]
        radius = data["radius"]
        cuisine = data.get("cuisine", "").strip().lower()

        search_point = Point(lng, lat, srid=4326)
        restaurants = Restaurant.objects.filter(
            location__dwithin=(search_point, D(m=radius))
        )

        if cuisine:
            restaurants = restaurants.filter(inferred_cuisine__icontains=cuisine)

        if restaurants.count() == 0:
            return Response(
                {"success": False, "message": "No restaurants found in the specified area."},
                status=status.HTTP_404_NOT_FOUND,
            )

        cluster_results = run_clustering(
            restaurant_queryset=restaurants,
            cuisine_filter=cuisine,
            min_cluster_size=data.get("min_samples", 3),
            min_samples=data.get("min_samples", 3),
            max_competition=data.get("max_competition"),
            competition_radius_km=data.get("competition_radius_km", 0.5),
        )

        if not cluster_results:
            return Response({
                "success": True,
                "message": "No clusters found. Try adjusting parameters.",
                "data": [],
            })

        saved_clusters = []
        for cr in cluster_results:
            centroid = Point(cr["centroid_lon"], cr["centroid_lat"], srid=4326)

            cluster_obj = Cluster.objects.create(
                created_by=request.user if request.user.is_authenticated else None,
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
                search_latitude=lat,
                search_longitude=lng,
                search_radius=radius,
            )

            cluster_obj.restaurants.set(cr["restaurant_ids"])
            saved_clusters.append(cluster_obj)

        try:
            from integrations.tasks import reverse_geocode_clusters_task
            cluster_ids = [c.id for c in saved_clusters]
            reverse_geocode_clusters_task.delay(cluster_ids)
        except Exception:
            pass

        response_data = ClusterListSerializer(saved_clusters, many=True).data

        return Response({
            "success": True,
            "message": f"Found {len(saved_clusters)} clusters.",
            "data": response_data,
        })
