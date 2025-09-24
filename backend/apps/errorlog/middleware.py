from threading import local
from typing import Any

_thread_locals = local()

class RequestLogMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
        self._thread_locals = _thread_locals  # Add this line

    def __call__(self, request):
        # Store request in thread local storage
        setattr(self._thread_locals, 'request', request)
        
        try:
            response = self.get_response(request)
            return response
        except Exception as e:
            self._log_exception(request, e)
            raise
        finally:
            # Clean up thread local storage
            if hasattr(self._thread_locals, 'request'):
                delattr(self._thread_locals, 'request')

    def _log_exception(self, request: Any, exception: Exception) -> None:
        from apps.errorlog.models import ErrorLog
        import traceback
        
        ErrorLog.objects.create(
            level="ERROR",
            message=str(exception),
            traceback='\n'.join(traceback.format_exc()),
            request_path=request.path,
            method=request.method,
            ip_address=request.META.get('REMOTE_ADDR'),
            user=request.user if hasattr(request, 'user') and request.user.is_authenticated else None
        )

def get_current_request():
    """Get the current request from thread local storage"""
    return getattr(_thread_locals, 'request', None)