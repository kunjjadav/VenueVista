import time
import logging
from django.utils.deprecation import MiddlewareMixin

logger = logging.getLogger("venuevista.performance")

class PerformanceMonitoringMiddleware(MiddlewareMixin):
    def process_request(self, request):
        request.start_time = time.time()

    def process_response(self, request, response):
        if hasattr(request, "start_time"):
            duration = time.time() - request.start_time
            duration_ms = int(duration * 1000)
            
            logger.info(
                f"[perf] {request.method} {request.path} {response.status_code} {duration_ms}ms"
            )

            response["X-Response-Time-ms"] = str(duration_ms)
            
        return response
