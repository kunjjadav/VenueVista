
from django.conf import settings
from django.db import models


class Bookmark(models.Model):

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="bookmarks",
    )
    cluster = models.ForeignKey(
        "clusters.Cluster",
        on_delete=models.CASCADE,
        related_name="bookmarks",
    )
    notes = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "cluster")
        ordering = ["-created_at"]
        verbose_name = "bookmark"

    def __str__(self):
        return f"Bookmark: {self.user.email} → Cluster #{self.cluster_id}"


class SearchHistory(models.Model):

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="search_history",
    )
    query = models.CharField(max_length=500)
    latitude = models.FloatField()
    longitude = models.FloatField()
    filters_applied = models.JSONField(default=dict, blank=True)
    results_count = models.PositiveIntegerField(default=0)
    searched_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-searched_at"]
        verbose_name = "search history"
        verbose_name_plural = "search histories"

    def __str__(self):
        return f"{self.user.email}: '{self.query}' at {self.searched_at:%Y-%m-%d %H:%M}"
