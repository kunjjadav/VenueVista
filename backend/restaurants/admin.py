
from django.contrib import admin
from django.contrib.gis.admin import GISModelAdmin
from .models import Restaurant, CuisineType, SearchArea


@admin.register(Restaurant)
class RestaurantAdmin(GISModelAdmin):
    list_display = ("name", "rating", "user_ratings_total", "price_level", "inferred_cuisine", "fetched_at")
    list_filter = ("price_level", "inferred_cuisine", "is_from_csv")
    search_fields = ("name", "address", "google_place_id")
    readonly_fields = ("fetched_at",)


@admin.register(CuisineType)
class CuisineTypeAdmin(admin.ModelAdmin):
    list_display = ("name", "slug")
    prepopulated_fields = {"slug": ("name",)}


@admin.register(SearchArea)
class SearchAreaAdmin(GISModelAdmin):
    list_display = ("query_text", "cuisine_filter", "radius_meters", "result_count", "last_fetched")
    list_filter = ("cuisine_filter",)
    readonly_fields = ("last_fetched",)
