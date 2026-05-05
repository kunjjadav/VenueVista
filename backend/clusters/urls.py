
from django.urls import path
from .views import ClusterListView, ClusterDetailView, ClusterAnalyzeView

urlpatterns = [
    path("", ClusterListView.as_view(), name="cluster-list"),
    path("analyze/", ClusterAnalyzeView.as_view(), name="cluster-analyze"),
    path("<int:pk>/", ClusterDetailView.as_view(), name="cluster-detail"),
]
