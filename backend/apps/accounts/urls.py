from django.urls import path
from .views import RegisterView, LoginView, RefreshView, MeView, ForgotPasswordView, ResetPasswordView, LogoutView, VerifyEmailView, ResendVerificationView, ChangePasswordView

urlpatterns = [
    # Authentication
    path("register/", RegisterView.as_view(), name="auth-register"),
    path("login/",    LoginView.as_view(),    name="auth-login"),
    path("refresh/",  RefreshView.as_view(),  name="auth-refresh"),
    path("logout/",   LogoutView.as_view(), name="auth-logout"),

    # User info
    path("me/",       MeView.as_view(),       name="auth-me"),
    path("me/change-password/", ChangePasswordView.as_view(), name="auth-change-password"),

    # Password management
    path("forgot-password/", ForgotPasswordView.as_view(), name="auth-forgot-password"),
    path("reset-password/", ResetPasswordView.as_view(), name="auth-reset-password"),

    # Email verification
    path("verify-email/", VerifyEmailView.as_view(), name="auth-verify-email"),
    path("resend-verification/", ResendVerificationView.as_view(), name="auth-resend-verification"),
]
