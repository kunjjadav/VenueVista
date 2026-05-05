
from rest_framework import serializers
from .models import Cluster
from restaurants.serializers import RestaurantListSerializer


class ClusterSerializer(serializers.ModelSerializer):
    centroid_latitude = serializers.FloatField(read_only=True)
    centroid_longitude = serializers.FloatField(read_only=True)
    restaurants = RestaurantListSerializer(many=True, read_only=True)

    class Meta:
        model = Cluster
        fields = (
            "id", "centroid_latitude", "centroid_longitude", "polygon", "address",
            "viability_score", "restaurant_count", "avg_rating",
            "avg_price_level", "total_reviews", "avg_nearby_competition",
            "epsilon_used", "min_samples_used", "cuisine_filter",
            "restaurants", "created_at",
        )


class ClusterListSerializer(serializers.ModelSerializer):
    centroid_latitude = serializers.FloatField(read_only=True)
    centroid_longitude = serializers.FloatField(read_only=True)

    class Meta:
        model = Cluster
        fields = (
            "id", "centroid_latitude", "centroid_longitude", "polygon", "address",
            "viability_score", "restaurant_count", "avg_rating",
            "total_reviews", "cuisine_filter", "created_at",
        )


class ClusterAnalyzeRequestSerializer(serializers.Serializer):
    latitude = serializers.FloatField(required=True, min_value=-90, max_value=90)
    longitude = serializers.FloatField(required=True, min_value=-180, max_value=180)
    radius = serializers.IntegerField(required=False, default=5000, min_value=500, max_value=50000)
    cuisine = serializers.CharField(max_length=200, required=False, allow_blank=True, default="")
    min_samples = serializers.IntegerField(required=False, default=2, min_value=2)
    max_competition = serializers.IntegerField(required=False, default=None, allow_null=True)
    competition_radius_km = serializers.FloatField(required=False, default=0.5)
