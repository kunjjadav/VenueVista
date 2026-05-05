from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db import connection


class SLOHealthView(APIView):
    permission_classes = []

    def get(self, request):
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
            db_ok = True
        except Exception:
            db_ok = False

        is_healthy = db_ok

        return Response(
            {
                "status": "healthy" if is_healthy else "unhealthy",
                "checks": {
                    "database": "up" if db_ok else "down",
                },
            },
            status=status.HTTP_200_OK if is_healthy else status.HTTP_503_SERVICE_UNAVAILABLE,
        )
