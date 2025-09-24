from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.core.exceptions import PermissionDenied
from django.utils import timezone
from datetime import timedelta
import secrets
from rest_framework import serializers
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import TokenError, RefreshToken
from .models import PasswordResetToken, EmailVerificationToken
from django.conf import settings
import user_agents
from apps.emails.services import EmailService

User = get_user_model()


def _client_ip(req):
    xff = req.META.get("HTTP_X_FORWARDED_FOR")
    return xff.split(",")[0].strip() if xff else req.META.get("REMOTE_ADDR")


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ["email", "first_name", "last_name", "password", "phone_number"]

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User.objects.create_user(**validated_data, password=password)
        
        # Set initial password change time and require_password_change=False
        security = user.security
        security.set_password_changed()
        
        return user


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        request = self.context.get("request")
        try:
            data = super().validate(attrs)
        except PermissionDenied:
            raise AuthenticationFailed("Your account has been temporarily locked due to unsuccessful login attempts.")
        except Exception as e:
            msg = str(e) or ""
            if "locked" in msg.lower():
                raise AuthenticationFailed("Your account has been temporarily locked due to unsuccessful login attempts.")
            raise
        return data


class MeSerializer(serializers.ModelSerializer):
    roles = serializers.SerializerMethodField()
    security = serializers.SerializerMethodField()
    full_name = serializers.SerializerMethodField()
    account_status = serializers.SerializerMethodField()
    verification_status = serializers.SerializerMethodField()
    last_login_info = serializers.SerializerMethodField()
    login_notifications = serializers.BooleanField(write_only=True, required=False)

    class Meta:
        model = User
        fields = [
            "email",
            "first_name",
            "last_name",
            "full_name",
            "phone_number",
            "created_at",
            "updated_at",
            "roles",
            "security",
            "account_status",
            "verification_status",
            "last_login_info",
            "login_notifications",
        ]
        read_only_fields = ["created_at", "updated_at", "roles", "security", 
                           "account_status", "verification_status", "last_login_info"]

    def get_full_name(self, obj):
        return obj.get_display_name()

    def get_roles(self, obj):
        roles = list(obj.roles.values_list("role", flat=True))
        return {
            "list": roles,
            "is_admin": "admin" in roles,
            "is_superuser": obj.is_superuser,
        }

    def get_security(self, obj):
        sec = getattr(obj, "security", None)
        if not sec:
            return None
        return {
            # "two_factor_enabled": sec.two_factor_enabled,
            "login_notifications": sec.login_notifications,
            "password_changed_at": sec.password_changed_at,
        }

    def get_verification_status(self, obj):
        sec = getattr(obj, "security", None)
        if not sec:
            return None
        return {
            "email": {
                "is_verified": sec.email_verified,
                "verified_at": sec.email_verified_at,
            },
            "phone": {
                "is_verified": sec.phone_verified,
                "verified_at": sec.phone_verified_at,
            }
        }

    def get_account_status(self, obj):
        return {
            "is_active": obj.is_active,
            "account_age_days": (timezone.now() - obj.created_at).days,
        }

    def get_last_login_info(self, obj):
        sec = getattr(obj, "security", None)
        if not sec:
            return None

        return {
            "last_login_time": sec.last_login_time,
            "last_login_ip": sec.last_login_ip,
            "last_login_device": sec.last_login_device,
            "last_login_user_agent": sec.last_login_user_agent,
            "known_devices": sec.known_devices,
        }

    def validate_email(self, value):
        if value != self.instance.email:  # Email changed
            if User.objects.filter(email=value).exists():
                raise serializers.ValidationError("This email is already in use.")
        return value.lower().strip()

    def update(self, instance, validated_data):
        old_email = instance.email
        login_notifications = validated_data.pop('login_notifications', None)
        
        # Update user instance
        instance = super().update(instance, validated_data)
        
        # Handle security settings update
        if login_notifications is not None:
            security = instance.security
            security.login_notifications = login_notifications
            security.save()

        # Handle email verification if email changed
        if 'email' in validated_data and validated_data['email'] != old_email:
            security = instance.security
            security.email_verified = False
            security.email_verified_at = None
            security.save()

            # Generate verification token
            token = secrets.token_urlsafe(32)
            valid_hours = 24
            expires_at = timezone.now() + timedelta(hours=valid_hours)
            
            # Save verification token
            EmailVerificationToken.objects.create(
                user=instance,
                token=token,
                expires_at=expires_at
            )

            # Send verification email
            verification_url = f"{settings.FRONTEND_URL}/verify-email?token={token}"
            context = {
                'user': instance,
                'verification_url': verification_url,
                'valid_hours': valid_hours
            }
            
            EmailService.send_email(
                subject="Verify Your New Email Address",
                to_email=instance.email,
                template_name="accounts/email_verification",
                context=context
            )

        return instance


class APILoginSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        
        user = self.user
        data['is_superuser'] = user.is_superuser
        security = getattr(user, "security", None)
        
        if security:
            if security.require_password_change:
                raise AuthenticationFailed("You must change your password before continuing.")
                
            # Reset failed login attempts and update login info
            security.reset_failed_login()

            request = self.context.get("request")
            if request:
                ua_string = request.META.get("HTTP_USER_AGENT", "")
                ip = _client_ip(request)
                
                # Parse user agent
                user_agent = user_agents.parse(ua_string)
                device = f"{user_agent.device.family}"
                browser = f"{user_agent.browser.family} {user_agent.browser.version_string}"
                
                # Update login info
                security.update_login_info(
                    ip=ip,
                    user_agent=ua_string,
                    device_info={"name": device}
                )
                
                # Send login notification if enabled
                if security.login_notifications:
                    context = {
                        'user': user,
                        'login_time': timezone.now().strftime('%Y-%m-%d %H:%M:%S'),
                        'ip_address': ip,
                        'device': device,
                        'browser': browser
                    }
                    
                    EmailService.send_email(
                        subject="New Login to Your Account",
                        to_email=user.email,
                        template_name="accounts/login_notification",
                        context=context
                    )

        return data


class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        value = value.lower().strip()
        
        from django.core.validators import validate_email
        from django.core.exceptions import ValidationError
        try:
            validate_email(value)
        except ValidationError:
            self.user = None
            return value

        try:
            self.user = User.objects.get(email=value)
        except User.DoesNotExist:
            self.user = None
            
        return value


class ResetPasswordSerializer(serializers.Serializer):
    token = serializers.CharField()
    password = serializers.CharField(write_only=True, min_length=8)

    def validate_token(self, value):
        try:
            token = PasswordResetToken.objects.get(token=value)
            if not token.is_valid():
                raise serializers.ValidationError("Invalid or expired token")
            self.token_obj = token
            return value
        except PasswordResetToken.DoesNotExist:
            raise serializers.ValidationError("Invalid token")

    def save(self):
        user = self.token_obj.user
        user.set_password(self.validated_data['password'])
        user.save()
        self.token_obj.invalidate()


class LogoutSerializer(serializers.Serializer):
    refresh = serializers.CharField()

    def validate(self, attrs):
        self.token = attrs['refresh']
        return attrs

    def save(self, **kwargs):
        try:
            RefreshToken(self.token).blacklist()
        except TokenError:
            raise serializers.ValidationError('Invalid or expired token')


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, min_length=8)
    confirm_password = serializers.CharField(required=True)

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Old password is not correct.")
        return value

    def validate(self, data):
        if data['new_password'] != data['confirm_password']:
            raise serializers.ValidationError({
                "confirm_password": "New password and confirm password do not match."
            })
        if data['old_password'] == data['new_password']:
            raise serializers.ValidationError({
                "new_password": "New password must be different from the old password."
            })
        return data

    def save(self):
        user = self.context['request'].user
        user.set_password(self.validated_data['new_password'])
        user.save()
