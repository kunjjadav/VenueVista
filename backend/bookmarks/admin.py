
from django.contrib import admin
from .models import Bookmark, SearchHistory


@admin.register(Bookmark)
class BookmarkAdmin(admin.ModelAdmin):
    list_display = ("user", "cluster", "created_at")
    list_filter = ("created_at",)
    search_fields = ("user__email", "notes")


@admin.register(SearchHistory)
class SearchHistoryAdmin(admin.ModelAdmin):
    list_display = ("user", "query", "latitude", "longitude", "results_count", "searched_at")
    list_filter = ("searched_at",)
    search_fields = ("user__email", "query")
    readonly_fields = ("searched_at",)
