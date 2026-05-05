from datetime import timedelta

from django.contrib.auth import get_user_model
from django.db.models import Avg, Count, Q
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .admin_serializers import (
    AdminUserSerializer,
    AdminUserUpdateSerializer,
    AdminRestaurantSerializer,
    AdminClusterSerializer,
    AdminTaskSerializer,
)
from .models import UserProfile
from restaurants.models import Restaurant, TaskStatus
from clusters.models import Cluster
from bookmarks.models import Bookmark, SearchHistory

User = get_user_model()


class IsAdminUser(permissions.BasePermission):
    """Only staff users can access admin endpoints."""
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.is_staff


class AdminStatsView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        now = timezone.now()
        week_ago = now - timedelta(days=7)

        total_users = User.objects.count()
        new_users_week = User.objects.filter(date_joined__gte=week_ago).count()
        staff_users = User.objects.filter(is_staff=True).count()

        total_restaurants = Restaurant.objects.count()
        csv_restaurants = Restaurant.objects.filter(is_from_csv=True).count()
        api_restaurants = total_restaurants - csv_restaurants

        total_clusters = Cluster.objects.count()
        cluster_agg = Cluster.objects.aggregate(avg_viability=Avg("viability_score"))

        total_tasks = TaskStatus.objects.count()
        task_states = TaskStatus.objects.values("state").annotate(count=Count("id"))
        task_state_map = {row["state"]: row["count"] for row in task_states}

        total_bookmarks = Bookmark.objects.count()
        total_searches = SearchHistory.objects.count()

        return Response({
            "success": True,
            "data": {
                "users": {
                    "total": total_users,
                    "new_this_week": new_users_week,
                    "staff": staff_users,
                },
                "restaurants": {
                    "total": total_restaurants,
                    "from_csv": csv_restaurants,
                    "from_api": api_restaurants,
                },
                "clusters": {
                    "total": total_clusters,
                    "avg_viability": round(cluster_agg["avg_viability"] or 0, 1),
                },
                "tasks": {
                    "total": total_tasks,
                    "completed": task_state_map.get("COMPLETED", 0),
                    "in_progress": task_state_map.get("IN_PROGRESS", 0),
                    "failed": task_state_map.get("FAILED", 0),
                    "pending": task_state_map.get("PENDING", 0),
                },
                "bookmarks": total_bookmarks,
                "searches": total_searches,
            },
        })


class AdminUserListView(generics.ListAPIView):
    permission_classes = [IsAdminUser]
    serializer_class = AdminUserSerializer

    def get_queryset(self):
        qs = User.objects.select_related("profile").all()
        search = self.request.query_params.get("search", "").strip()
        if search:
            qs = qs.filter(Q(email__icontains=search) | Q(username__icontains=search))
        return qs


class AdminUserDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAdminUser]
    queryset = User.objects.select_related("profile").all()

    def get_serializer_class(self):
        if self.request.method in ("PATCH", "PUT"):
            return AdminUserUpdateSerializer
        return AdminUserSerializer

    def destroy(self, request, *args, **kwargs):
        user = self.get_object()
        if user.id == request.user.id:
            return Response(
                {"success": False, "error": "Cannot delete your own account."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        user.is_active = False
        user.save(update_fields=["is_active"])
        return Response({"success": True, "message": "User deactivated."})


class AdminRestaurantListView(generics.ListAPIView):
    permission_classes = [IsAdminUser]
    serializer_class = AdminRestaurantSerializer
    search_fields = ["name", "address", "inferred_cuisine"]
    ordering_fields = ["rating", "user_ratings_total", "price_level", "name", "fetched_at"]

    def get_queryset(self):
        qs = Restaurant.objects.all()
        search = self.request.query_params.get("search", "").strip()
        if search:
            qs = qs.filter(
                Q(name__icontains=search) |
                Q(address__icontains=search) |
                Q(inferred_cuisine__icontains=search)
            )
        return qs


class AdminRestaurantDeleteView(generics.DestroyAPIView):
    permission_classes = [IsAdminUser]
    queryset = Restaurant.objects.all()

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        name = instance.name
        instance.delete()
        return Response({"success": True, "message": f"Restaurant '{name}' deleted."})


class AdminClusterListView(generics.ListAPIView):
    permission_classes = [IsAdminUser]
    serializer_class = AdminClusterSerializer
    ordering_fields = ["viability_score", "restaurant_count", "created_at"]

    def get_queryset(self):
        return Cluster.objects.select_related("created_by").all()


class AdminTaskListView(generics.ListAPIView):
    permission_classes = [IsAdminUser]
    serializer_class = AdminTaskSerializer
    ordering_fields = ["created_at", "state", "progress_percent"]

    def get_queryset(self):
        qs = TaskStatus.objects.select_related("created_by").all()
        state_filter = self.request.query_params.get("state", "").strip().upper()
        if state_filter:
            qs = qs.filter(state=state_filter)
        return qs
