import pytest
from django.core.cache import cache

@pytest.fixture(autouse=True)
def clear_cache_before_each_test():
    cache.clear()

@pytest.fixture
def sample_email_context():
    return {
        "name": "Test User",
        "items": [1, 2, 3],
        "nested": {"key": "value"}
    }

@pytest.fixture
def sample_email_data():
    return {
        "subject": "Test Subject",
        "to_email": "test@example.com",
        "from_email": "from@example.com",
        "content": "Test content",
        "template_name": "test_template",
    }