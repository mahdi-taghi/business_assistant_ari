import pytest
from django.utils import timezone
from django.core.exceptions import ValidationError
from apps.emails.models import EmailLog

pytestmark = pytest.mark.django_db

def test_email_log_creation():
    email = EmailLog.objects.create(
        subject="Test Subject",
        to_email="test@example.com",
        from_email="from@example.com",
        content="Test content",
        template_name="test_template.html",
        context={"name": "Test"}
    )
    
    assert email.status == 'pending'
    assert email.error_message is None
    assert email.sent_at is None
    assert email.created_at is not None

def test_email_log_str_representation():
    email = EmailLog.objects.create(
        subject="Test Subject",
        to_email="test@example.com", 
        from_email="from@example.com",
        content="Test content"
    )
    
    assert str(email) == "Test Subject - test@example.com (pending)"

def test_email_log_status_choices():
    email = EmailLog.objects.create(
        subject="Test Subject",
        to_email="test@example.com",
        from_email="from@example.com", 
        content="Test content"
    )

    # Test valid status choices
    email.status = 'sent'
    email.save()
    email.refresh_from_db()
    assert email.status == 'sent'

    email.status = 'failed'
    email.save()
    email.refresh_from_db() 
    assert email.status == 'failed'

    # Test invalid status
    with pytest.raises(ValidationError):
        email.status = 'invalid'
        email.full_clean()

def test_email_log_ordering():
    # Create emails with different timestamps
    email1 = EmailLog.objects.create(
        subject="First Email",
        to_email="test1@example.com",
        from_email="from@example.com",
        content="Test content 1",
        created_at=timezone.now()
    )
    
    email2 = EmailLog.objects.create(
        subject="Second Email", 
        to_email="test2@example.com",
        from_email="from@example.com",
        content="Test content 2",
        created_at=timezone.now()
    )

    # Verify ordering is by -created_at
    emails = EmailLog.objects.all()
    assert emails[0] == email2  
    assert emails[1] == email1

def test_email_log_context_json_field():
    context_data = {
        "name": "Test User",
        "items": [1, 2, 3],
        "nested": {"key": "value"}
    }
    
    email = EmailLog.objects.create(
        subject="Test Subject",
        to_email="test@example.com",
        from_email="from@example.com",
        content="Test content",
        context=context_data
    )
    
    email.refresh_from_db()
    assert email.context == context_data
    assert isinstance(email.context, dict)
    assert email.context["name"] == "Test User"
    assert email.context["items"] == [1, 2, 3]
    assert email.context["nested"]["key"] == "value"