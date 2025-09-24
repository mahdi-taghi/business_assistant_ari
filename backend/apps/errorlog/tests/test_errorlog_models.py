import pytest
from django.core.exceptions import ValidationError
from apps.errorlog.models import ErrorLog

pytestmark = pytest.mark.django_db

# ---------- ErrorLog model tests ----------

def test_errorlog_create_basic():
    error = ErrorLog.objects.create(
        level="ERROR",
        message="Test error message",
        request_path="/api/test",
        method="GET"
    )
    assert error.level == "ERROR"
    assert error.message == "Test error message"
    assert error.created_at is not None
    assert str(error) == f"ERROR - {error.created_at}: Test error message"

def test_errorlog_level_choices():
    error = ErrorLog.objects.create(
        level="DEBUG",
        message="Debug message"
    )
    assert error.level in dict(ErrorLog.LEVEL_CHOICES)
    
    with pytest.raises(ValidationError):
        error.level = "INVALID"
        error.full_clean()

def test_errorlog_ordering():
    ErrorLog.objects.create(level="ERROR", message="First error")
    ErrorLog.objects.create(level="ERROR", message="Second error")
    errors = ErrorLog.objects.all()
    assert errors[0].message == "Second error"
    assert errors[1].message == "First error"

def test_errorlog_json_field_default():
    error1 = ErrorLog.objects.create(
        level="INFO",
        message="Test JSON default"
    )
    error2 = ErrorLog.objects.create(
        level="INFO",
        message="Test JSON custom",
        extra_data={"key": "value"}
    )
    
    assert error1.extra_data == {}
    assert error2.extra_data == {"key": "value"}
    assert error1.extra_data is not error2.extra_data

def test_errorlog_str_truncation():
    long_message = "x" * 200
    error = ErrorLog.objects.create(
        level="WARNING",
        message=long_message
    )
    assert len(str(error).split(": ")[1]) == 100

def test_errorlog_nullable_fields():
    error = ErrorLog.objects.create(
        level="ERROR",
        message="Test nullable"
    )
    assert error.traceback is None
    assert error.request_path is None
    assert error.method is None
    assert error.user is None
    assert error.ip_address is None
    assert error.logger_name is None
    assert error.function_name is None
    assert error.line_number is None

def test_errorlog_user_relation(django_user_model):
    user = django_user_model.objects.create_user(
        email="error@test.com",
        password="testpass123"
    )
    error = ErrorLog.objects.create(
        level="ERROR",
        message="Test user relation",
        user=user
    )
    assert error.user == user
    
    user.delete()
    error.refresh_from_db()
    assert error.user is None

def test_errorlog_indexes():
    indexes = [list(index.fields) for index in ErrorLog._meta.indexes]
    assert ['-created_at'] in indexes
    assert ['level'] in indexes
    assert ['user'] in indexes