
from django.contrib.gis.db import models as gis_models
from django.db import models


class CuisineType(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=100, unique=True)

    class Meta:
        ordering = ["name"]
        verbose_name = "cuisine type"

    def __str__(self):
        return self.name


class Restaurant(models.Model):
    PRICE_LEVELS = [
        (0, "Free"),
        (1, "$"),
        (2, "$$"),
        (3, "$$$"),
        (4, "$$$$"),
    ]

    google_place_id = models.CharField(
        max_length=255, unique=True, db_index=True,
        blank=True, default="",

    )
    name = models.CharField(max_length=500, db_index=True)
    location = gis_models.PointField(
        geography=True, srid=4326,
    )
    address = models.TextField(blank=True, default="")
    rating = models.FloatField(null=True, blank=True)
    user_ratings_total = models.PositiveIntegerField(default=0)
    price_level = models.IntegerField(
        null=True, blank=True, choices=PRICE_LEVELS,
    )
    cuisines = models.ManyToManyField(
        CuisineType, blank=True, related_name="restaurants",
    )
    inferred_cuisine = models.CharField(
        max_length=200, blank=True, default="",

    )
    fetched_at = models.DateTimeField(auto_now=True)
    is_from_csv = models.BooleanField(
        default=False,

    )

    class Meta:
        ordering = ["-user_ratings_total"]
        indexes = [
            models.Index(fields=["rating"]),
            models.Index(fields=["price_level"]),
            models.Index(fields=["inferred_cuisine"]),
        ]
        verbose_name = "restaurant"

    def __str__(self):
        return f"{self.name} ({self.rating or 'N/A'}★)"

    @property
    def latitude(self):
        return self.location.y if self.location else None

    @property
    def longitude(self):
        return self.location.x if self.location else None


class SearchArea(models.Model):
    center = gis_models.PointField(geography=True, srid=4326)
    radius_meters = models.PositiveIntegerField()
    query_text = models.CharField(max_length=500, blank=True, default="")
    cuisine_filter = models.CharField(max_length=200, blank=True, default="")
    last_fetched = models.DateTimeField(auto_now=True)
    result_count = models.PositiveIntegerField(default=0)
    city_name = models.CharField(max_length=100, null=True, blank=True, db_index=True)
    admin_level_1 = models.CharField(max_length=100, null=True, blank=True, db_index=True)
    country = models.CharField(max_length=100, null=True, blank=True)

    class Meta:
        verbose_name = "search area"
        ordering = ["-last_fetched"]

    def __str__(self):
        return f"Search: '{self.query_text}' ({self.result_count} results)"


class TaskStatus(models.Model):
    STATE_CHOICES = [
        ("PENDING", "Pending"),
        ("IN_PROGRESS", "In Progress"),
        ("COMPLETED", "Completed"),
        ("FAILED", "Failed"),
    ]

    task_id = models.CharField(max_length=255, unique=True, db_index=True)
    task_type = models.CharField(max_length=50, default="discover")
    state = models.CharField(max_length=20, choices=STATE_CHOICES, default="PENDING")
    progress_percent = models.IntegerField(default=0)
    progress_message = models.CharField(max_length=500, blank=True, default="")

    grid_points_total = models.IntegerField(default=0)
    grid_points_processed = models.IntegerField(default=0)
    grid_points_cached = models.IntegerField(default=0)
    restaurants_fetched = models.IntegerField(default=0)
    restaurants_new = models.IntegerField(default=0)

    result_data = models.JSONField(null=True, blank=True)
    error_message = models.TextField(blank=True, default="")

    created_by = models.ForeignKey(
        "accounts.CustomUser", on_delete=models.CASCADE,
        related_name="task_statuses", null=True, blank=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "task status"
        verbose_name_plural = "task statuses"

    def __str__(self):
        return f"Task {self.task_id} [{self.state}] — {self.progress_percent}%"
