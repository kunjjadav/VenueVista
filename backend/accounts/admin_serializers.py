from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import UserProfile
from restaurants.models import Restaurant, TaskStatus
from clusters.models import Cluster

User = get_user_model()


class AdminUserProfileInlineSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ("company_name", "bio", "api_calls_used")
        read_only_fields = ("api_calls_used",)


class AdminUserSerializer(serializers.ModelSerializer):
    profile = AdminUserProfileInlineSerializer(read_only=True)

    class Meta:
        model = User
        fields = (
            "id", "email", "username", "is_staff", "is_active",
            "date_joined", "last_login", "profile",
        )
        read_only_fields = ("id", "email", "username", "date_joined", "last_login", "profile")


class AdminUserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("is_staff", "is_active")


class AdminRestaurantSerializer(serializers.ModelSerializer):
    latitude = serializers.FloatField(read_only=True)
    longitude = serializers.FloatField(read_only=True)

    class Meta:
        model = Restaurant
        fields = (
            "id", "name", "google_place_id", "address",
            "rating", "user_ratings_total", "price_level",
            "inferred_cuisine", "is_from_csv", "fetched_at",
            "latitude", "longitude",
        )


class AdminClusterSerializer(serializers.ModelSerializer):
    centroid_latitude = serializers.FloatField(read_only=True)
    centroid_longitude = serializers.FloatField(read_only=True)
    created_by_email = serializers.CharField(
        source="created_by.email", read_only=True, default=""
    )

    class Meta:
        model = Cluster
        fields = (
            "id", "viability_score", "restaurant_count",
            "avg_rating", "avg_price_level", "total_reviews",
            "avg_nearby_competition", "cuisine_filter",
            "centroid_latitude", "centroid_longitude",
            "created_by_email", "created_at",
        )


class AdminTaskSerializer(serializers.ModelSerializer):
    created_by_email = serializers.CharField(
        source="created_by.email", read_only=True, default=""
    )

    class Meta:
        model = TaskStatus
        fields = (
            "id", "task_id", "task_type", "state",
            "progress_percent", "progress_message",
            "grid_points_total", "grid_points_processed",
            "grid_points_cached", "restaurants_fetched",
            "restaurants_new", "error_message",
            "created_by_email", "created_at", "updated_at",
        )
