import pytest
from django.contrib.auth import get_user_model
from django.core.cache import cache

@pytest.fixture(autouse=True)
def disable_throttling(settings):
    rf = settings.REST_FRAMEWORK.copy()
    rf["DEFAULT_THROTTLE_CLASSES"] = []
    rf["DEFAULT_THROTTLE_RATES"] = {}
    settings.REST_FRAMEWORK = rf

@pytest.fixture(autouse=True)
def clear_cache_before_each_test():
    cache.clear()

@pytest.fixture(autouse=True)
def disable_login_view_throttle():
    from apps.accounts.views import LoginView, RegisterView, RefreshView
    LoginView.throttle_classes = []
    RegisterView.throttle_classes = []
    RefreshView.throttle_classes = []
    yield

@pytest.fixture
def api_client():
    from rest_framework.test import APIClient
    return APIClient()

@pytest.fixture
def password():
    return "Pa$$w0rd!!"

@pytest.fixture
def user(db, password):
    User = get_user_model()
    u = User.objects.create_user(
        email="user1@example.com",
        first_name="User",
        last_name="One",
        password=password
    )
    assert hasattr(u, "security")
    return u
