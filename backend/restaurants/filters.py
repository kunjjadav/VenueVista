
import django_filters
from .models import Restaurant


class RestaurantFilter(django_filters.FilterSet):
    cuisine = django_filters.CharFilter(
        field_name="inferred_cuisine",
        lookup_expr="iexact",
        label="Cuisine type",
    )
    min_rating = django_filters.NumberFilter(
        field_name="rating",
        lookup_expr="gte",
        label="Minimum rating",
    )
    max_rating = django_filters.NumberFilter(
        field_name="rating",
        lookup_expr="lte",
        label="Maximum rating",
    )
    max_price = django_filters.NumberFilter(
        field_name="price_level",
        lookup_expr="lte",
        label="Maximum price level (0-4)",
    )
    min_reviews = django_filters.NumberFilter(
        field_name="user_ratings_total",
        lookup_expr="gte",
        label="Minimum review count",
    )
    name = django_filters.CharFilter(
        field_name="name",
        lookup_expr="icontains",
        label="Restaurant name search",
    )

    class Meta:
        model = Restaurant
        fields = ["cuisine", "min_rating", "max_rating", "max_price", "min_reviews", "name"]
