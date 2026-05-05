
from django.contrib import admin
from django.contrib.gis.admin import GISModelAdmin
from .models import Cluster


@admin.register(Cluster)
class ClusterAdmin(GISModelAdmin):
    list_display = (
        "id", "viability_score", "restaurant_count", "avg_rating",
        "total_reviews", "cuisine_filter", "epsilon_used", "created_at",
    )
    list_filter = ("cuisine_filter", "created_at")
    search_fields = ("address",)
    readonly_fields = ("created_at",)
