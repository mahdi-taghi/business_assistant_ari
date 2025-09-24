from django.contrib.auth.backends import ModelBackend
from django.core.exceptions import PermissionDenied
from django.utils.translation import gettext_lazy as _

class LockedAccountBackend(ModelBackend):
    def authenticate(self, request, username=None, password=None, **kwargs):
        from django.contrib.auth import get_user_model
        User = get_user_model()

        login_value = kwargs.get(User.USERNAME_FIELD, username)
        if not login_value:
            return None

        login_value = (login_value or "").strip()
        try:
            user = User.objects.get(email__iexact=login_value)
        except User.DoesNotExist:
            return None

        security = getattr(user, "security", None)
        if security and security.is_account_locked():
            from django.core.exceptions import PermissionDenied
            raise PermissionDenied("Your account is locked due to too many failed login attempts.")

        if user.check_password(password) and self.user_can_authenticate(user):
            return user
        return None

