
from django.contrib.gis.db import models as gis_models
from django.db import models


class Cluster(models.Model):
    created_by = models.ForeignKey(
        "accounts.CustomUser", on_delete=models.CASCADE, related_name="clusters", null=True, blank=True
    )

    centroid = gis_models.PointField(
        geography=True, srid=4326,
    )
    polygon = models.JSONField(
        null=True, blank=True,
    )
    address = models.TextField(
        blank=True, default="",
    )
    viability_score = models.FloatField(
        default=0,
    )
    restaurant_count = models.PositiveIntegerField(default=0)
    avg_rating = models.FloatField(null=True, blank=True)
    avg_price_level = models.FloatField(null=True, blank=True)
    total_reviews = models.PositiveIntegerField(default=0)
    avg_nearby_competition = models.FloatField(
        default=0,
    )

    epsilon_used = models.FloatField(
    )
    min_samples_used = models.PositiveIntegerField(
    )

    cuisine_filter = models.CharField(max_length=200, blank=True, default="")
    search_latitude = models.FloatField(null=True, blank=True)
    search_longitude = models.FloatField(null=True, blank=True)
    search_radius = models.PositiveIntegerField(null=True, blank=True)

    restaurants = models.ManyToManyField(
        "restaurants.Restaurant", blank=True, related_name="clusters",
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-viability_score"]
        verbose_name = "cluster"

    def __str__(self):
        return f"Cluster #{self.id} — Score: {self.viability_score:.1f} ({self.restaurant_count} restaurants)"

    @property
    def centroid_latitude(self):
        return self.centroid.y if self.centroid else None

    @property
    def centroid_longitude(self):
        return self.centroid.x if self.centroid else None
