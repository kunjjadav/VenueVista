
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from restaurants.models import TaskStatus


class TaskStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, task_id):
        try:
            task_status = TaskStatus.objects.get(
                task_id=task_id,
                created_by=request.user,
            )
        except TaskStatus.DoesNotExist:
            return Response(
                {"success": False, "error": "Task not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        data = {
            "task_id": task_status.task_id,
            "state": task_status.state,
            "progress_percent": task_status.progress_percent,
            "progress_message": task_status.progress_message,
            "grid_points_total": task_status.grid_points_total,
            "grid_points_processed": task_status.grid_points_processed,
            "grid_points_cached": task_status.grid_points_cached,
            "restaurants_fetched": task_status.restaurants_fetched,
            "restaurants_new": task_status.restaurants_new,
            "error_message": task_status.error_message,
            "result_data": task_status.result_data,
        }

        return Response({"success": True, **data})
