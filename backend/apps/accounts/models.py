from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.utils import timezone
from django.core.validators import RegexValidator
from django.db.models import F
import json

class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("Email is required")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        
        # Create UserSecurity instance
        UserSecurity.objects.create(user=user)
        
        # Create default public role
        UserRole.objects.create(user=user, role="public")
        
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        user = self.create_user(email, password, **extra_fields)
        UserRole.objects.get_or_create(user=user, role="admin")
        return user

class User(AbstractBaseUser, PermissionsMixin):
    # Basic Information
    email = models.EmailField(unique=True, max_length=255)
    first_name = models.CharField(max_length=30)
    last_name = models.CharField(max_length=30)
    
    # Phone with validation
    phone_regex = RegexValidator(
        regex=r'^(\+98|0)?9\d{9}$',
        message="شماره تلفن باید به فرمت ایرانی باشد: 09123456789"
    )
    phone_number = models.CharField(
        validators=[phone_regex], 
        max_length=15, 
        blank=True, 
        null=True
    )

    # Permissions
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Authentication
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']
    
    # Manager
    objects = UserManager()

    class Meta:
        verbose_name = 'کاربر'
        verbose_name_plural = 'کاربران'
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return self.email

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}".strip()

    def get_display_name(self):
        return self.full_name or self.email

    def set_password(self, raw_password):
        super().set_password(raw_password)
        if hasattr(self, 'security'):
            self.security.set_password_changed()

class UserSecurity(models.Model):
    user = models.OneToOneField(
        User, 
        on_delete=models.CASCADE, 
        related_name='security'
    )
    
    # Login Security
    failed_login_attempts = models.PositiveIntegerField(default=0)
    last_failed_login = models.DateTimeField(null=True, blank=True)
    is_locked = models.BooleanField(default=False)
    locked_until = models.DateTimeField(null=True, blank=True)
    
    # Account Security
    password_changed_at = models.DateTimeField(auto_now_add=True)
    require_password_change = models.BooleanField(default=False)
    
    # Verification Status
    email_verified = models.BooleanField(default=False)
    email_verified_at = models.DateTimeField(null=True, blank=True)
    phone_verified = models.BooleanField(default=False)
    phone_verified_at = models.DateTimeField(null=True, blank=True)
    
    # Device & Location Tracking
    known_devices = models.JSONField(default=list, blank=True)
    last_login_ip = models.GenericIPAddressField(null=True, blank=True)
    last_login_device = models.CharField(max_length=255, null=True, blank=True)
    last_login_user_agent = models.TextField(null=True, blank=True)
    last_login_time = models.DateTimeField(null=True, blank=True)
    
    # Security Settings
    two_factor_enabled = models.BooleanField(default=False)
    login_notifications = models.BooleanField(default=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'امنیت کاربر'
        verbose_name_plural = 'امنیت کاربران'

    def __str__(self):
        return f"Security for {self.user.email}"
    
    def is_account_locked(self):
        if not self.is_locked:
            return False
        if self.locked_until and timezone.now() > self.locked_until:
            self.is_locked = False
            self.locked_until = None
            self.failed_login_attempts = 0
            self.save(update_fields=['is_locked', 'locked_until', 'failed_login_attempts'])
            return False
        return True
    
    def increment_failed_login(self):
        self.failed_login_attempts = F('failed_login_attempts') + 1
        self.last_failed_login = timezone.now()
        self.save(update_fields=['failed_login_attempts', 'last_failed_login'])

        self.refresh_from_db(fields=['failed_login_attempts'])

        if self.failed_login_attempts >= 5 and not self.is_locked:
            self.is_locked = True
            self.locked_until = timezone.now() + timezone.timedelta(minutes=30)
            self.save(update_fields=['is_locked', 'locked_until'])
    
    def reset_failed_login(self):
        self.failed_login_attempts = 0
        self.last_failed_login = None
        self.is_locked = False
        self.locked_until = None
        self.save(update_fields=['failed_login_attempts', 'last_failed_login', 'is_locked', 'locked_until'])
    
    def add_known_device(self, device_info):
        if not isinstance(self.known_devices, list):
            self.known_devices = []
        
        device_exists = any(
            device.get('fingerprint') == device_info.get('fingerprint') 
            for device in self.known_devices
        )
        
        if not device_exists:
            device_info['added_at'] = timezone.now().isoformat()
            self.known_devices.append(device_info)
            self.save()
    
    def update_login_info(self, ip, user_agent, device_info=None):
        self.last_login_ip = ip
        self.last_login_user_agent = user_agent
        self.last_login_time = timezone.now()
        
        if device_info:
            self.last_login_device = device_info.get('name', 'Unknown Device')
            self.add_known_device(device_info)
        
        self.save()
    
    def verify_email(self):
        self.email_verified = True
        self.email_verified_at = timezone.now()
        self.save()
    
    def verify_phone(self):
        self.phone_verified = True
        self.phone_verified_at = timezone.now()
        self.save()

    def set_password_changed(self):
        """Update password change timestamp and reset require_password_change flag"""
        self.password_changed_at = timezone.now()
        self.require_password_change = False
        self.save(update_fields=['password_changed_at', 'require_password_change'])

class UserRole(models.Model):
    ROLE_CHOICES = [
        ("public", "Public"),
        ("admin", "Admin"),
    ]

    user = models.ForeignKey(User, related_name="roles", on_delete=models.CASCADE)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(
        User, 
        related_name="assigned_roles", 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True
    )

    class Meta:
        unique_together = ("user", "role")
        verbose_name = 'نقش کاربر'
        verbose_name_plural = 'نقش‌های کاربر'

    def __str__(self):
        return f"{self.user.email} - {self.role}"

class PasswordResetToken(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    token = models.CharField(max_length=64, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    used = models.BooleanField(default=False)
    expires_at = models.DateTimeField()

    class Meta:
        verbose_name = 'توکن بازیابی رمز عبور'
        verbose_name_plural = 'توکن‌های بازیابی رمز عبور'

    def is_valid(self):
        return (
            not self.used and 
            self.expires_at > timezone.now()
        )

    def invalidate(self):
        self.used = True
        self.save()

class EmailVerificationToken(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    token = models.CharField(max_length=64, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    used = models.BooleanField(default=False)
    expires_at = models.DateTimeField()

    def is_valid(self):
        return (
            not self.used and 
            self.expires_at > timezone.now()
        )

    def invalidate(self):
        self.used = True
        self.save()