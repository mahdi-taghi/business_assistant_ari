from django.contrib.auth.signals import user_logged_in, user_login_failed, user_logged_out
from django.dispatch import receiver
from django.utils import timezone
from django.contrib.auth import get_user_model
from .models import UserSecurity

User = get_user_model()

@receiver(user_logged_in)
def handle_user_logged_in(sender, request, user, **kwargs):
    security = getattr(user, "security", None)
    if security:
        security.update_login_info(
            ip=get_client_ip(request),
            user_agent=request.META.get("HTTP_USER_AGENT", ""),
            device_info={"name": "Admin Panel"}
        )
        security.reset_failed_login()


@receiver(user_login_failed)
def handle_user_login_failed(sender, credentials, request, **kwargs):
    email = (credentials or {}).get("username") or (credentials or {}).get("email") or (credentials or {}).get("login")
    if not email:
        return
    try:
        user = User.objects.get(email__iexact=email)
    except User.DoesNotExist:
        return
    security = getattr(user, "security", None)
    if security:
        security.increment_failed_login()


@receiver(user_logged_out)
def handle_user_logged_out(sender, request, user, **kwargs):
    print(f"User {user.email} logged out at {timezone.now()}")


def get_client_ip(request):
    x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
    if x_forwarded_for:
        ip = x_forwarded_for.split(",")[0]
    else:
        ip = request.META.get("REMOTE_ADDR")
    return ip
