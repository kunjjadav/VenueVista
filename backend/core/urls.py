
from django.urls import path
from .views.health import SLOHealthView

urlpatterns = [
    path("", SLOHealthView.as_view(), name="slo_health_check"),
]
