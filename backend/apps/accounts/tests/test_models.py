import json
from datetime import timedelta
from unittest import mock

import pytest
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction
from django.utils import timezone

from apps.accounts.models import UserSecurity, UserRole, PasswordResetToken, EmailVerificationToken

pytestmark = pytest.mark.django_db

# ---------- Helpers / Factories ----------

def make_user(**kwargs):
    """
    Factory کوچک برای ساخت یوزر با مدیر سفارشی.
    UserManager باید UserSecurity را خودکار بسازد.
    """
    User = get_user_model()
    defaults = dict(
        email="user@example.com",
        password="TestPass123!",
        first_name="Amir",
        last_name="Rahimi",
    )
    defaults.update(kwargs)
    return User.objects.create_user(
        email=defaults["email"],
        password=defaults["password"],
        first_name=defaults["first_name"],
        last_name=defaults["last_name"],
    )

def make_device(fingerprint="fp-123", name="Chrome on Linux"):
    return {"fingerprint": fingerprint, "name": name}


# ---------- UserManager / User model ----------

def test_create_user_creates_security_row_and_hashes_password():
    user = make_user()
    assert user.check_password("TestPass123!") is True
    sec = UserSecurity.objects.get(user=user)
    assert sec.failed_login_attempts == 0
    assert sec.is_locked is False

def test_create_superuser_flags_set_true():
    User = get_user_model()
    admin = User.objects.create_superuser(
        email="admin@example.com",
        password="AdminPass123!",
        first_name="Admin",
        last_name="User",
    )
    assert admin.is_staff is True
    assert admin.is_superuser is True

def test_email_unique_index_and_str_fullname_get_display_name():
    user = make_user(email="unique@example.com", first_name="A", last_name="B")
    assert str(user) == "unique@example.com"
    assert user.full_name == "A B"
    assert user.get_display_name() == "A B"

def test_phone_regex_accepts_valid_iranian_mobile():
    user = make_user(email="p1@example.com")
    user.phone_number = "09123456789"
    user.full_clean()

def test_phone_regex_rejects_invalid_mobile():
    user = make_user(email="p2@example.com")
    user.phone_number = "02112345678"
    with pytest.raises(ValidationError):
        user.full_clean()

def test_email_normalization_in_manager():
    user = make_user(email="USER@Example.COM")
    assert user.email == "USER@example.com"


# ---------- UserSecurity behaviors ----------

def test_increment_failed_login_and_lock_after_5_attempts():
    user = make_user(email="lock@example.com")
    sec = user.security

    for _ in range(4):
        sec.increment_failed_login()
    sec.refresh_from_db()
    assert sec.failed_login_attempts == 4
    assert sec.is_locked is False
    assert sec.locked_until is None

    fixed_now = timezone.now()
    with mock.patch("django.utils.timezone.now", return_value=fixed_now):
        sec.increment_failed_login()

    sec.refresh_from_db()
    assert sec.failed_login_attempts == 5
    assert sec.is_locked is True
    assert sec.locked_until is not None
    assert (sec.locked_until - fixed_now).total_seconds() >= 30 * 60 - 0.5

def test_is_account_locked_auto_unlocks_after_locked_until_passed():
    user = make_user(email="auto@example.com")
    sec = user.security
    sec.is_locked = True
    sec.failed_login_attempts = 5
    sec.locked_until = timezone.now() - timedelta(seconds=1)
    sec.save()

    assert sec.is_account_locked() is False
    sec.refresh_from_db()
    assert sec.is_locked is False
    assert sec.failed_login_attempts == 0
    assert sec.locked_until is None

def test_reset_failed_login_clears_all_fields():
    user = make_user(email="reset@example.com")
    sec = user.security
    sec.increment_failed_login()
    sec.increment_failed_login()
    sec.is_locked = True
    sec.locked_until = timezone.now() + timedelta(minutes=1)
    sec.save()

    sec.reset_failed_login()
    sec.refresh_from_db()
    assert sec.failed_login_attempts == 0
    assert sec.last_failed_login is None
    assert sec.is_locked is False
    assert sec.locked_until is None

def test_known_devices_added_once_and_kept_as_list():
    user = make_user(email="dev@example.com")
    sec = user.security

    d = make_device(fingerprint="fp-xyz", name="Firefox")
    sec.add_known_device(d)
    sec.refresh_from_db()
    assert isinstance(sec.known_devices, list)
    assert len(sec.known_devices) == 1

    sec.add_known_device({"fingerprint": "fp-xyz", "name": "Firefox"})
    sec.refresh_from_db()
    assert len(sec.known_devices) == 1

def test_jsonfield_default_list_is_not_shared_between_rows():
    u1 = make_user(email="a1@example.com")
    u2 = make_user(email="a2@example.com")
    s1, s2 = u1.security, u2.security

    s1.add_known_device(make_device("fp-1"))
    s1.refresh_from_db()
    s2.refresh_from_db()
    assert len(s1.known_devices) == 1
    assert len(s2.known_devices) == 0

# ---------- Password Reset and Email Verification Tokens ----------

def test_password_reset_token_validity():
    user = make_user(email="reset@example.com")
    token = PasswordResetToken.objects.create(
        user=user,
        token="abc123",
        expires_at=timezone.now() + timedelta(hours=24)
    )
    assert token.is_valid() is True
    
    token.used = True
    token.save()
    assert token.is_valid() is False
    
    token.used = False
    token.expires_at = timezone.now() - timedelta(hours=1)
    token.save()
    assert token.is_valid() is False

def test_password_reset_token_invalidation():
    user = make_user(email="reset2@example.com")
    token = PasswordResetToken.objects.create(
        user=user,
        token="xyz789",
        expires_at=timezone.now() + timedelta(hours=24)
    )
    assert token.used is False
    token.invalidate()
    token.refresh_from_db()
    assert token.used is True
    assert token.is_valid() is False

def test_email_verification_token_validity():
    user = make_user(email="verify@example.com")
    token = EmailVerificationToken.objects.create(
        user=user,
        token="def456",
        expires_at=timezone.now() + timedelta(hours=24)
    )
    assert token.is_valid() is True
    
    token.used = True
    token.save()
    assert token.is_valid() is False
    
    token.used = False
    token.expires_at = timezone.now() - timedelta(hours=1)
    token.save()
    assert token.is_valid() is False

def test_email_verification_token_invalidation():
    user = make_user(email="verify2@example.com")
    token = EmailVerificationToken.objects.create(
        user=user,
        token="ghi789",
        expires_at=timezone.now() + timedelta(hours=24)
    )
    assert token.used is False
    token.invalidate()
    token.refresh_from_db()
    assert token.used is True
    assert token.is_valid() is False

def test_token_cascade_delete_with_user():
    user = make_user(email="cascade@example.com")
    
    PasswordResetToken.objects.create(
        user=user,
        token="rst123",
        expires_at=timezone.now() + timedelta(hours=24)
    )
    EmailVerificationToken.objects.create(
        user=user,
        token="ver456",
        expires_at=timezone.now() + timedelta(hours=24)
    )
    
    assert PasswordResetToken.objects.filter(user=user).exists()
    assert EmailVerificationToken.objects.filter(user=user).exists()
    
    user.delete()
    
    assert not PasswordResetToken.objects.filter(user__email="cascade@example.com").exists()
    assert not EmailVerificationToken.objects.filter(user__email="cascade@example.com").exists()
    user = make_user(email="rel@example.com")
    role = user.roles.first()
    assert role.role == "public"
    assert str(role) == f"{user.email} - public"
    assert list(user.roles.values_list("role", flat=True)) == ["public"]
