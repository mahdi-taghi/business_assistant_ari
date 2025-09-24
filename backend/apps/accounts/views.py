from rest_framework import generics, permissions, status, serializers
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.tokens import AccessToken
from .serializers import RegisterSerializer, MeSerializer, APILoginSerializer, ForgotPasswordSerializer, ResetPasswordSerializer, LogoutSerializer, ChangePasswordSerializer
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.throttling import AnonRateThrottle, UserRateThrottle
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings
from apps.emails.services import EmailService
import secrets
from django.utils import timezone
from datetime import timedelta
from .models import PasswordResetToken, EmailVerificationToken
from rest_framework.exceptions import ValidationError
from rest_framework.decorators import action

class CustomAnonThrottle(AnonRateThrottle):
    rate = '5/minute'

class CustomUserThrottle(UserRateThrottle):
    rate = '20/minute'

class EmailThrottle(AnonRateThrottle):
    rate = '3/hour'

class RegisterView(generics.CreateAPIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [CustomAnonThrottle]
    serializer_class = RegisterSerializer

    def perform_create(self, serializer):
        user = serializer.save()
        
        # Generate verification token
        token = secrets.token_urlsafe(32)
        valid_hours = 24
        expires_at = timezone.now() + timedelta(hours=valid_hours)
        
        # Save verification token
        EmailVerificationToken.objects.create(
            user=user,
            token=token,
            expires_at=expires_at
        )

        # Send verification email
        verification_url = f"{settings.FRONTEND_URL}/verify-email?token={token}"
        context = {
            'user': user,
            'verification_url': verification_url,
            'valid_hours': valid_hours
        }
        
        EmailService.send_email(
            subject="Verify Your Email Address",
            to_email=user.email,
            template_name="accounts/email_verification",
            context=context
        )

class LoginView(TokenObtainPairView):
    permission_classes = [AllowAny]
    throttle_classes = [CustomAnonThrottle]
    serializer_class = APILoginSerializer

class RefreshView(TokenRefreshView):
    permission_classes = [AllowAny]
    throttle_classes = [CustomAnonThrottle]

class MeView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated]
    throttle_classes = [CustomUserThrottle]
    serializer_class = MeSerializer
    http_method_names = ['get', 'patch']  # Only allow GET and PATCH

    def get_object(self):
        return self.request.user

    def patch(self, request, *args, **kwargs):
        partial = True
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        return Response(serializer.data)

class ChangePasswordView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]
    throttle_classes = [CustomUserThrottle]
    serializer_class = ChangePasswordSerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({
                "message": "Password changed successfully."
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ForgotPasswordView(generics.GenericAPIView):
    permission_classes = [AllowAny]
    throttle_classes = [EmailThrottle]
    serializer_class = ForgotPasswordSerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        if not hasattr(serializer, 'user') or serializer.user is None:
            return Response({
                "message": "Password reset instructions have been sent to your email."
            })

        user = serializer.user

        # Generate token
        token = secrets.token_urlsafe(32)
        expires_at = timezone.now() + timedelta(hours=24)
        
        # Save token
        PasswordResetToken.objects.create(
            user=user,
            token=token,
            expires_at=expires_at
        )

        # Send email
        from core.settings import RESET_PASSWORD_REDIRECT_URL
        reset_url = f"{RESET_PASSWORD_REDIRECT_URL}/reset-password?token={token}"
        context = {
            'user': user,
            'reset_url': reset_url,
            'valid_hours': 24
        }
        
        EmailService.send_email(
            subject="Password Reset Request",
            to_email=user.email,
            template_name="accounts/password_reset_email",
            context=context
        )

        return Response({
            "message": "Password reset instructions have been sent to your email."
        })

class ResetPasswordView(generics.GenericAPIView):
    permission_classes = [AllowAny]
    throttle_classes = [CustomAnonThrottle]
    serializer_class = ResetPasswordSerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Get user from token
        user = serializer.token_obj.user
        security = user.security

        # Reset password
        serializer.save()
        
        # Verify email if not already verified
        if not security.email_verified:
            security.verify_email()
        
        return Response({
            "message": "Password has been reset successfully."
        })

class LogoutView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = LogoutSerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        if hasattr(request.user, 'security'):
            request.user.security.last_login_time = None
            request.user.security.save(update_fields=['last_login_time'])
        
        return Response(
            {"message": "Successfully logged out."}, 
            status=status.HTTP_200_OK
        )

class VerifyEmailView(generics.GenericAPIView):
    permission_classes = [AllowAny]
    throttle_classes = [CustomAnonThrottle]
    
    class InputSerializer(serializers.Serializer):
        token = serializers.CharField()

    def post(self, request):
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            token_obj = EmailVerificationToken.objects.get(
                token=serializer.validated_data['token']
            )
            if not token_obj.is_valid():
                raise ValidationError("Invalid or expired token")
                
            user = token_obj.user
            security = user.security
            
            if not security.email_verified:
                security.verify_email()
                token_obj.invalidate()
            
            return Response({
                "message": "Email verified successfully"
            })
            
        except EmailVerificationToken.DoesNotExist:
            raise ValidationError("Invalid token")

class ResendVerificationView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]
    throttle_classes = [EmailThrottle]

    def post(self, request):
        user = request.user
        security = user.security

        # Check if email is already verified
        if security.email_verified:
            return Response({
                "message": "Email is already verified."
            }, status=status.HTTP_400_BAD_REQUEST)

        # Generate verification token
        token = secrets.token_urlsafe(32)
        valid_hours = 24
        expires_at = timezone.now() + timedelta(hours=valid_hours)
        
        # Save verification token
        EmailVerificationToken.objects.create(
            user=user,
            token=token,
            expires_at=expires_at
        )

        # Send verification email
        verification_url = f"{settings.FRONTEND_URL}/verify-email?token={token}"
        context = {
            'user': user,
            'verification_url': verification_url,
            'valid_hours': valid_hours
        }
        
        EmailService.send_email(
            subject="Verify Your Email Address",
            to_email=user.email,
            template_name="accounts/email_verification",
            context=context
        )

        return Response({
            "message": "Verification email has been sent successfully."
        })