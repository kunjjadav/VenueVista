
from django.contrib import admin
from django.urls import path, include

from core.views.geocode import GeocodeView
from core.views.task_status import TaskStatusView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/", include("accounts.urls")),
    path("api/restaurants/", include("restaurants.urls")),
    path("api/clusters/", include("clusters.urls")),
    path("api/bookmarks/", include("bookmarks.urls")),
    path("api/geocode/", GeocodeView.as_view(), name="geocode"),
    path("api/tasks/<str:task_id>/status/", TaskStatusView.as_view(), name="task-status"),
    path("metrics/", include("django_prometheus.urls")),
    path("api/health/", include("core.urls")),
    path("api/admin/", include("accounts.admin_urls")),
]
