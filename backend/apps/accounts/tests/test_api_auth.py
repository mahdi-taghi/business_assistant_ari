import pytest
from django.utils import timezone
from datetime import timedelta
from django.contrib.auth import get_user_model

LOGIN_URL   = "/api/auth/login/"
ME_URL      = "/api/auth/me/"
REFRESH_URL = "/api/auth/refresh/"
REGISTER_URL= "/api/auth/register/"

def _login(api_client, email, password, ip="203.0.113.10", ua="pytest-UA/1.0"):
    return api_client.post(
        LOGIN_URL,
        {"email": email, "password": password},
        format="json",
        HTTP_X_FORWARDED_FOR=ip,
        HTTP_USER_AGENT=ua,
    )

def _auth_headers(access):
    return {"HTTP_AUTHORIZATION": f"Bearer {access}"}

@pytest.mark.django_db
def test_register_and_login_and_me(api_client, password):
    r = api_client.post(
        REGISTER_URL,
        {
            "email": "newuser@example.com",
            "first_name": "New",
            "last_name": "User",
            "password": password,
        },
        format="json",
    )
    assert r.status_code in (200, 201)

    r = _login(api_client, "newuser@example.com", password)
    assert r.status_code == 200
    assert "access" in r.data and "refresh" in r.data
    access = r.data["access"]

    r = api_client.get(ME_URL, **_auth_headers(access))
    assert r.status_code == 200
    assert r.data["email"] == "newuser@example.com"
    assert "security" in r.data
    assert isinstance(r.data["roles"], dict)
    assert isinstance(r.data["roles"].get("list"), list)


@pytest.mark.django_db
def test_invalid_refresh_token_returns_401(api_client, user, password):
    # First login to get tokens
    r = _login(api_client, user.email, password)
    assert r.status_code == 200
    
    # Try to refresh with invalid token
    r = api_client.post(REFRESH_URL, {"refresh": "invalid-token"}, format="json")
    assert r.status_code == 401

@pytest.mark.django_db 
def test_me_endpoint_requires_auth(api_client):
    r = api_client.get(ME_URL)
    assert r.status_code == 401

@pytest.mark.django_db
def test_me_endpoint_returns_user_data(api_client, user, password):
    # Login first
    r = _login(api_client, user.email, password)
    access = r.data["access"]
    
    # Get user data
    r = api_client.get(ME_URL, **_auth_headers(access))
    assert r.status_code == 200
    assert r.data["email"] == user.email
    assert r.data["first_name"] == user.first_name
    assert r.data["last_name"] == user.last_name

@pytest.mark.django_db
def test_register_with_duplicate_email_fails(api_client, user, password):
    r = api_client.post(
        REGISTER_URL,
        {
            "email": user.email,  # Use existing user's email
            "first_name": "Another",
            "last_name": "User",
            "password": "NewPass123!",
        },
        format="json",
    )
    assert r.status_code == 400
    assert "email" in r.data  # Should contain email error

@pytest.mark.django_db
def test_register_validates_password_strength(api_client):
    # Serializer has min_length=8
    weak_passwords = ["short", "1234567"]
    for i, password in enumerate(weak_passwords):
        r = api_client.post(
            REGISTER_URL,
            {
                "email": f"weakpass_{i}@example.com",
                "first_name": "Test",
                "last_name": "User",
                "password": password,
            },
            format="json",
        )
        assert r.status_code == 400
        assert "password" in r.data


@pytest.mark.django_db
def test_register_with_strong_password_succeeds(api_client):
    strong_password = "StrongP@ss123!"
    r = api_client.post(
        REGISTER_URL,
        {
            "email": "strong@example.com",
            "first_name": "Strong",
            "last_name": "Password",
            "password": strong_password,
        },
        format="json",
    )
    assert r.status_code == 201


@pytest.mark.django_db
def test_login_with_valid_credentials_provides_tokens(api_client, user, password):
    r = _login(api_client, user.email, password)
    assert r.status_code == 200
    assert "access" in r.data
    assert "refresh" in r.data
    assert isinstance(r.data["access"], str)
    assert isinstance(r.data["refresh"], str)


@pytest.mark.django_db
def test_refresh_token_provides_new_access_token(api_client, user, password):
    # First login to get tokens
    r = _login(api_client, user.email, password)
    refresh_token = r.data["refresh"]

    # Use refresh token to get new access token
    r = api_client.post(REFRESH_URL, {"refresh": refresh_token}, format="json")
    assert r.status_code == 200
    assert "access" in r.data
    assert isinstance(r.data["access"], str)


@pytest.mark.django_db
def test_me_endpoint_rejects_invalid_token(api_client, user, password):
    r = _login(api_client, user.email, password)
    access = r.data["access"]

    # Mock an invalid token
    invalid_token = access[:-10] + "0" * 10  # Modify token to make it invalid
    r = api_client.get(ME_URL, **_auth_headers(invalid_token))
    assert r.status_code == 401


@pytest.mark.django_db
def test_register_validates_required_fields(api_client):
    # Test missing required fields
    r = api_client.post(
        REGISTER_URL,
        {
            "email": "test@example.com",
            # Missing first_name
            "last_name": "User",
            "password": "ValidP@ss123",
        },
        format="json",
    )
    assert r.status_code == 400
    assert "first_name" in r.data


@pytest.mark.django_db
def test_register_validates_email_format(api_client):
    invalid_emails = ["invalid", "user@", "@domain.com", "user@.com"]

    for email in invalid_emails:
        r = api_client.post(
            REGISTER_URL,
            {
                "email": email,
                "first_name": "Test",
                "last_name": "User",
                "password": "ValidP@ss123",
            },
            format="json",
        )
        assert r.status_code == 400
        assert "email" in r.data
