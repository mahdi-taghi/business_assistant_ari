import pytest
from django.test import RequestFactory
from apps.errorlog.middleware import RequestLogMiddleware, get_current_request

pytestmark = pytest.mark.django_db

def test_middleware_stores_request(rf):
    captured = []
    def dummy_get_response(request):
        captured.append(get_current_request())
        return "response"
    middleware = RequestLogMiddleware(dummy_get_response)
    request = rf.get('/test-path/')
    response = middleware(request)
    assert captured[0] == request
    assert get_current_request() is None
    assert response == "response"

def test_middleware_cleans_request(rf):
    def dummy_get_response(request):
        return "response"
    middleware = RequestLogMiddleware(dummy_get_response)
    request = rf.get('/test-path/')
    middleware(request)
    assert get_current_request() is None

def test_middleware_logs_exception(rf, django_user_model):
    from apps.errorlog.models import ErrorLog
    user = django_user_model.objects.create_user(
        email='test@example.com',
        password='testpass123'
    )
    request = rf.get('/test-path/')
    request.user = user

    def failing_get_response(request):
        raise ValueError("Test error")
    middleware = RequestLogMiddleware(failing_get_response)
    with pytest.raises(ValueError):
        middleware(request)
    error_log = ErrorLog.objects.first()
    assert error_log is not None
    assert error_log.level == "ERROR"
    assert error_log.message == "Test error"
    assert error_log.request_path == "/test-path/"
    assert error_log.method == "GET"
    assert error_log.user == user