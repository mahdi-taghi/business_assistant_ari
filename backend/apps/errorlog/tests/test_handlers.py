import pytest
import logging
from django.test import RequestFactory
from django.contrib.auth import get_user_model
from apps.errorlog.handlers import DatabaseLogHandler
from apps.errorlog.models import ErrorLog
from apps.errorlog.middleware import _thread_locals

pytestmark = pytest.mark.django_db

@pytest.fixture
def handler():
    return DatabaseLogHandler()

@pytest.fixture
def logger(handler):
    logger = logging.getLogger('test_logger')
    logger.handlers = []
    logger.addHandler(handler)
    logger.setLevel(logging.ERROR)
    return logger

@pytest.fixture
def rf():
    return RequestFactory()

def test_handler_creates_log_entry(handler, logger):
    logger.error("Test error message")
    
    error_log = ErrorLog.objects.first()
    assert error_log is not None
    assert error_log.level == "ERROR"
    assert error_log.message == "Test error message"
    assert error_log.logger_name == "test_logger"

def test_handler_captures_exception(handler, logger):
    try:
        raise ValueError("Test exception")
    except ValueError:
        logger.exception("An error occurred")
    
    error_log = ErrorLog.objects.first()
    assert error_log is not None
    assert error_log.level == "ERROR"
    assert "Test exception" in error_log.traceback
    assert "ValueError" in error_log.traceback

def test_handler_with_request_context(handler, logger, rf, django_user_model):
    user = django_user_model.objects.create_user(
        email='test@example.com',
        password='testpass123'
    )
    request = rf.get('/test-path/')
    request.user = user
    
    setattr(_thread_locals, 'request', request)
    try:
        logger.error("Test error with request")
        error_log = ErrorLog.objects.first()
        assert error_log is not None
        assert error_log.user == user
        assert error_log.request_path == "/test-path/"
        assert error_log.method == "GET"
    finally:
        if hasattr(_thread_locals, 'request'):
            delattr(_thread_locals, 'request')

def test_handler_extra_data(handler, logger):
    adapter = logging.LoggerAdapter(logger, {'custom_field': 'custom_value'})
    adapter.error("Test error with extra")
    
    error_log = ErrorLog.objects.first()
    assert error_log is not None
    assert error_log.extra_data.get('custom_field') == 'custom_value'

def test_handler_fallback_on_error(handler, logger, monkeypatch, capsys):
    from apps.errorlog.models import ErrorLog
    def raise_error(*args, **kwargs):
        raise Exception("Simulated DB error")
    monkeypatch.setattr(ErrorLog.objects, 'create', raise_error)
    
    logger.error("Test error")
    
    captured = capsys.readouterr()
    assert "Error in DatabaseLogHandler" in captured.err