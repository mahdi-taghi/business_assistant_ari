import logging
import traceback
from .middleware import get_current_request
import sys

class DatabaseLogHandler(logging.Handler):
    def emit(self, record):
        try:
            from apps.errorlog.models import ErrorLog

            request = get_current_request()
            
            user = None
            request_path = None
            method = None
            ip_address = None

            if request:
                user = request.user if hasattr(request, 'user') and request.user.is_authenticated else None
                request_path = request.path
                method = request.method
                ip_address = request.META.get('REMOTE_ADDR')
            
            if record.exc_info:
                exc_type, exc_value, exc_tb = record.exc_info
                tb = ''.join(traceback.format_exception(exc_type, exc_value, exc_tb))
            else:
                tb = record.exc_text if hasattr(record, 'exc_text') else None

            standard_attrs = {
                'name', 'msg', 'args', 'levelname', 'levelno', 'pathname', 'filename', 'module', 
                'exc_info', 'exc_text', 'stack_info', 'lineno', 'funcName', 'created', 'msecs', 
                'relativeCreated', 'thread', 'threadName', 'processName', 'process'
            }
            extra_data = {k: v for k, v in record.__dict__.items() if k not in standard_attrs}
            
            extra_data.update({
                'module': record.module,
                'process_name': record.processName,
                'thread_name': record.threadName,
                'args': getattr(record, 'args', None),
            })

            ErrorLog.objects.create(
                level=record.levelname,
                message=record.getMessage(),
                traceback=tb,
                request_path=request_path,
                method=method,
                user=user,
                ip_address=ip_address,
                logger_name=record.name,
                function_name=record.funcName,
                line_number=record.lineno,
                extra_data=extra_data
            )
        except Exception as e:
            print(f"Error in DatabaseLogHandler: {str(e)}", file=sys.stderr)