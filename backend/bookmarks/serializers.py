
from rest_framework import serializers
from .models import Bookmark, SearchHistory
from clusters.serializers import ClusterListSerializer


class BookmarkSerializer(serializers.ModelSerializer):
    cluster_detail = ClusterListSerializer(source="cluster", read_only=True)

    class Meta:
        model = Bookmark
        fields = ("id", "cluster", "cluster_detail", "notes", "created_at")
        read_only_fields = ("id", "created_at")

    def validate_cluster(self, value):
        user = self.context["request"].user
        if Bookmark.objects.filter(user=user, cluster=value).exists():
            raise serializers.ValidationError("You have already bookmarked this cluster.")
        return value


class SearchHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = SearchHistory
        fields = ("id", "query", "latitude", "longitude", "filters_applied", "results_count", "searched_at")
        read_only_fields = fields
