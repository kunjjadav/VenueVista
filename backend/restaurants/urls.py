
from django.urls import path
from .views import (
    RestaurantListView,
    RestaurantDetailView,
    RestaurantSearchView,
    CuisineTypeListView,
    DiscoverView,
)

urlpatterns = [
    path("", RestaurantListView.as_view(), name="restaurant-list"),
    path("search/", RestaurantSearchView.as_view(), name="restaurant-search"),
    path("discover/", DiscoverView.as_view(), name="restaurant-discover"),
    path("cuisines/", CuisineTypeListView.as_view(), name="cuisine-list"),
    path("<int:pk>/", RestaurantDetailView.as_view(), name="restaurant-detail"),
]
