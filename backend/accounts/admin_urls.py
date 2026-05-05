from django.urls import path

from .admin_views import (
    AdminStatsView,
    AdminUserListView,
    AdminUserDetailView,
    AdminRestaurantListView,
    AdminRestaurantDeleteView,
    AdminClusterListView,
    AdminTaskListView,
)

urlpatterns = [
    path("stats/", AdminStatsView.as_view(), name="admin-stats"),
    path("users/", AdminUserListView.as_view(), name="admin-user-list"),
    path("users/<int:pk>/", AdminUserDetailView.as_view(), name="admin-user-detail"),
    path("restaurants/", AdminRestaurantListView.as_view(), name="admin-restaurant-list"),
    path("restaurants/<int:pk>/", AdminRestaurantDeleteView.as_view(), name="admin-restaurant-delete"),
    path("clusters/", AdminClusterListView.as_view(), name="admin-cluster-list"),
    path("tasks/", AdminTaskListView.as_view(), name="admin-task-list"),
]
