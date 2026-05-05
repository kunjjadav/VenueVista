
from rest_framework import serializers
from .models import Restaurant, CuisineType, SearchArea, TaskStatus


class CuisineTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = CuisineType
        fields = ("id", "name", "slug")


class RestaurantSerializer(serializers.ModelSerializer):
    latitude = serializers.FloatField(read_only=True)
    longitude = serializers.FloatField(read_only=True)
    cuisines = CuisineTypeSerializer(many=True, read_only=True)

    class Meta:
        model = Restaurant
        fields = (
            "id", "name", "google_place_id", "latitude", "longitude",
            "address", "rating", "user_ratings_total", "price_level",
            "cuisines", "inferred_cuisine", "fetched_at",
        )


class RestaurantListSerializer(serializers.ModelSerializer):
    latitude = serializers.FloatField(read_only=True)
    longitude = serializers.FloatField(read_only=True)

    class Meta:
        model = Restaurant
        fields = (
            "id", "name", "latitude", "longitude",
            "rating", "user_ratings_total", "price_level",
            "inferred_cuisine",
        )


class RestaurantSearchRequestSerializer(serializers.Serializer):
    query = serializers.CharField(max_length=500, required=False, allow_blank=True, default="")
    cuisine = serializers.CharField(max_length=200, required=False, allow_blank=True, default="")
    latitude = serializers.FloatField(required=True, min_value=-90, max_value=90)
    longitude = serializers.FloatField(required=True, min_value=-180, max_value=180)
    radius = serializers.IntegerField(required=False, default=2000, min_value=100, max_value=50000)
    max_competition = serializers.IntegerField(required=False, default=None, allow_null=True)
    min_rating = serializers.FloatField(required=False, default=None, allow_null=True)
    max_price_level = serializers.IntegerField(required=False, default=None, allow_null=True)


class SearchAreaSerializer(serializers.ModelSerializer):
    class Meta:
        model = SearchArea
        fields = ("id", "query_text", "cuisine_filter", "radius_meters", "last_fetched", "result_count")


class DiscoverRequestSerializer(serializers.Serializer):
    latitude = serializers.FloatField(required=True, min_value=-90, max_value=90)
    longitude = serializers.FloatField(required=True, min_value=-180, max_value=180)
    radius = serializers.IntegerField(
        required=False, default=3000,
        min_value=500, max_value=10000,
    )
    cuisine = serializers.CharField(
        max_length=200, required=False, allow_blank=True, default="",
    )
    min_cluster_size = serializers.IntegerField(
        required=False, default=2, min_value=2, max_value=50,
    )
    max_competition = serializers.IntegerField(
        required=False, default=None, allow_null=True,
    )
    competition_radius_km = serializers.FloatField(
        required=False, default=0.5, min_value=0.1, max_value=5.0,
    )


class TaskStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = TaskStatus
        fields = (
            "task_id", "task_type", "state",
            "progress_percent", "progress_message",
            "grid_points_total", "grid_points_processed", "grid_points_cached",
            "restaurants_fetched", "restaurants_new",
            "result_data", "error_message",
            "created_at", "updated_at",
        )
        read_only_fields = fields
