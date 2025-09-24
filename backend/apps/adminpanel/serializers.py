from rest_framework import serializers
from django.contrib.auth import get_user_model
from apps.accounts.models import UserRole, UserSecurity
from django.utils import timezone
from django.core.validators import MinLengthValidator
from django.contrib.auth.password_validation import validate_password
from apps.emails.services import EmailService
from apps.emails.models import EmailLog
from apps.errorlog.models import ErrorLog
from apps.accounts.models import EmailVerificationToken
from django.conf import settings
from datetime import timedelta
import secrets
import logging
from apps.chat.models import Chat, Message

logger = logging.getLogger(__name__)


User = get_user_model()

class AdminEmailLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmailLog
        fields = '__all__'

class AdminSendEmailSerializer(serializers.Serializer):
    recipient_ids = serializers.ListField(
        child=serializers.IntegerField(), 
        help_text="A list of user IDs to send the email to."
    )
    subject = serializers.CharField(max_length=255)
    message = serializers.CharField()
    template_name = serializers.CharField(max_length=100, required=False, allow_blank=True)

    def validate_recipient_ids(self, value):
        if not value:
            raise serializers.ValidationError("At least one recipient must be specified.")
        
        recipients_count = User.objects.filter(id__in=value).count()
        if recipients_count != len(value):
            raise serializers.ValidationError("One or more recipient IDs are invalid.")
            
        return value

class AdminUserListSerializer(serializers.ModelSerializer):
    roles = serializers.SerializerMethodField()
    full_name = serializers.CharField(source='get_display_name', read_only=True)
    account_status = serializers.SerializerMethodField()
    security_info = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 
            'email',
            'full_name',
            'first_name', 
            'last_name',
            'phone_number',
            'is_active',
            'is_staff',
            'roles',
            'created_at',
            'account_status',
            'security_info'
        ]

    def get_roles(self, obj):
        return [role.role for role in obj.roles.all()]

    def get_account_status(self, obj):
        security = getattr(obj, 'security', None)
        return {
            'is_active': obj.is_active,
            'is_locked': security.is_locked if security else False,
            'failed_attempts': security.failed_login_attempts if security else 0,
            'created_at': obj.created_at,
            'last_login': security.last_login_time if security else None
        }

    def get_security_info(self, obj):
        security = getattr(obj, 'security', None)
        if not security:
            return None
        
        return {
            'email_verified': security.email_verified,
            'phone_verified': security.phone_verified,
            'two_factor_enabled': security.two_factor_enabled,
            'last_login_ip': security.last_login_ip
        }

class AdminUserDetailSerializer(AdminUserListSerializer):
    class Meta(AdminUserListSerializer.Meta):
        fields = AdminUserListSerializer.Meta.fields + [
            'updated_at',
        ]

class AdminUserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[
            MinLengthValidator(8),
            validate_password
        ]
    )
    roles = serializers.MultipleChoiceField(choices=UserRole.ROLE_CHOICES, required=False)
    send_verification_email = serializers.BooleanField(default=True, write_only=True)

    class Meta:
        model = User
        fields = [
            'id',
            'email',
            'first_name',
            'last_name',
            'phone_number',
            'password',
            'is_active',
            'is_staff',
            'roles',
            'send_verification_email'
        ]
        read_only_fields = ['id']

    def validate_password(self, value):
        if value.isdigit():
            raise serializers.ValidationError("Password cannot be entirely numeric.")
        if len(set(value)) < 5:
            raise serializers.ValidationError("Password must contain at least 5 different characters.")
        if value.lower() == value:
            raise serializers.ValidationError("Password must contain at least one uppercase letter.")
        if value.upper() == value:
            raise serializers.ValidationError("Password must contain at least one lowercase letter.")
        if not any(char.isdigit() for char in value):
            raise serializers.ValidationError("Password must contain at least one number.")
        if not any(not char.isalnum() for char in value):
            raise serializers.ValidationError("Password must contain at least one special character.")
        return value

    def create(self, validated_data):
        send_verification = validated_data.pop('send_verification_email', True)
        roles = validated_data.pop('roles', ['public'])
        password = validated_data.pop('password')
        
        user = User.objects.create_user(
            password=password,
            **validated_data
        )

        # Update roles
        UserRole.objects.filter(user=user).delete()
        for role in roles:
            UserRole.objects.create(
                user=user,
                role=role,
                created_by=self.context['request'].user
            )

        if send_verification:
            self._send_verification_email(user)

        return user

    def _send_verification_email(self, user):
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
            'valid_hours': valid_hours,
            'created_by': self.context['request'].user.get_display_name()
        }
        
        EmailService.send_email(
            subject="Verify Your Email Address",
            to_email=user.email,
            template_name="accounts/email_verification",
            context=context
        )

    def to_representation(self, instance):
        return AdminUserListSerializer(instance).data

class AdminUserUpdateSerializer(serializers.ModelSerializer):
    roles = serializers.MultipleChoiceField(choices=UserRole.ROLE_CHOICES, required=False)
    password = serializers.CharField(
        write_only=True, 
        required=False,
        validators=[
            MinLengthValidator(8),
            validate_password
        ]
    )

    class Meta:
        model = User
        fields = [
            'email',
            'first_name',
            'last_name',
            'phone_number',
            'is_active',
            'is_staff',
            'roles',
            'password'
        ]

    def validate_password(self, value):
        if value:
            if value.isdigit():
                raise serializers.ValidationError("Password cannot be entirely numeric.")
            if len(set(value)) < 5:
                raise serializers.ValidationError("Password must contain at least 5 different characters.")
            if value.lower() == value:
                raise serializers.ValidationError("Password must contain at least one uppercase letter.")
            if value.upper() == value:
                raise serializers.ValidationError("Password must contain at least one lowercase letter.")
            if not any(char.isdigit() for char in value):
                raise serializers.ValidationError("Password must contain at least one number.")
            if not any(not char.isalnum() for char in value):
                raise serializers.ValidationError("Password must contain at least one special character.")
        return value

    def update(self, instance, validated_data):
        roles = validated_data.pop('roles', None)
        password = validated_data.pop('password', None)

        # Update user fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if password:
            instance.set_password(password)

        instance.save()

        # Update roles if provided
        if roles is not None:
            UserRole.objects.filter(user=instance).delete()
            for role in roles:
                UserRole.objects.create(
                    user=instance,
                    role=role,
                    created_by=self.context['request'].user
                )

        return instance

    def to_representation(self, instance):
        return AdminUserListSerializer(instance).data

class UserSecurityUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserSecurity
        fields = [
            'is_locked',
            'failed_login_attempts',
            'require_password_change',
            'two_factor_enabled',
            'login_notifications'
        ]

    def update(self, instance, validated_data):
        if 'is_locked' in validated_data and not validated_data['is_locked']:
            instance.reset_failed_login()
        
        return super().update(instance, validated_data)

class AdminPasswordResetSerializer(serializers.Serializer):
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[
            MinLengthValidator(8),
            validate_password
        ]
    )
    send_email = serializers.BooleanField(default=True)
    require_change = serializers.BooleanField(default=True)

    def validate_password(self, value):
        if value.isdigit():
            raise serializers.ValidationError("Password cannot be entirely numeric.")
        if len(set(value)) < 5:
            raise serializers.ValidationError("Password must contain at least 5 different characters.")
        if value.lower() == value:
            raise serializers.ValidationError("Password must contain at least one uppercase letter.")
        if value.upper() == value:
            raise serializers.ValidationError("Password must contain at least one lowercase letter.")
        if not any(char.isdigit() for char in value):
            raise serializers.ValidationError("Password must contain at least one number.")
        if not any(not char.isalnum() for char in value):
            raise serializers.ValidationError("Password must contain at least one special character.")
        return value

    def send_reset_notification(self, user, admin_user, require_change):
        """Send password reset notification email"""
        try:
            context = {
                'user': user,
                'admin': admin_user.get_display_name(),
                'require_change': require_change,
                'site_name': settings.SITE_NAME
            }
            
            success = EmailService.send_email(
                subject="Your Password Has Been Reset",
                to_email=user.email,
                template_name="admin/password_reset_notification",  # تغییر مسیر تمپلیت
                context=context
            )
            
            if not success:
                logger.error(f"Failed to send password reset email to {user.email}")
                return False
                
            logger.info(f"Password reset notification email sent to {user.email}")
            return True
            
        except Exception as e:
            logger.error(f"Error sending password reset email to {user.email}: {str(e)}")
            return False

class AdminMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = [
            'id',
            'role',
            'content',
            'created_at',
            'tokens_used',
            'response_time',
        ]


class AdminChatListSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField()
    message_count = serializers.IntegerField(source='messages.count', read_only=True)

    class Meta:
        model = Chat
        fields = [
            'id',
            'user',
            'title',
            'created_at',
            'last_activity',
            'is_archived',
            'message_count',
        ]


class AdminChatDetailSerializer(AdminChatListSerializer):
    messages = AdminMessageSerializer(many=True, read_only=True)

    class Meta(AdminChatListSerializer.Meta):
        fields = AdminChatListSerializer.Meta.fields + ['messages']

class AdminErrorLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = ErrorLog
        fields = '__all__'
