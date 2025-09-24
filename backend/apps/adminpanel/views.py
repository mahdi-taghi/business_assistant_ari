from django.shortcuts import render, get_object_or_404
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import get_user_model
from .serializers import (
    AdminUserListSerializer,
    AdminUserDetailSerializer,
    AdminUserCreateSerializer,
    AdminUserUpdateSerializer,
    UserSecurityUpdateSerializer,
    AdminPasswordResetSerializer,
    AdminChatListSerializer,
    AdminChatDetailSerializer,
    AdminMessageSerializer,
    AdminEmailLogSerializer,
    AdminSendEmailSerializer,
    AdminErrorLogSerializer
)
from .permissions import IsSuperUser
from apps.emails.services import EmailService
from apps.emails.models import EmailLog
from apps.errorlog.models import ErrorLog
from apps.chat.models import Chat, Message
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiExample
import logging


User = get_user_model()
logger = logging.getLogger(__name__)

class AdminEmailLogViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsSuperUser]
    serializer_class = AdminEmailLogSerializer
    http_method_names = ['get', 'delete', 'head', 'options']
    queryset = EmailLog.objects.all()

    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by user (email or user_id)
        user_id = self.request.query_params.get('user_id')
        email = self.request.query_params.get('email')
        
        if user_id:
            try:
                user = User.objects.get(id=user_id)
                queryset = queryset.filter(to_email=user.email)
            except User.DoesNotExist:
                # Return an empty queryset if user_id is invalid
                return queryset.none()
        elif email:
            queryset = queryset.filter(to_email__iexact=email)
            
        # Filter by status
        status = self.request.query_params.get('status')
        if status:
            queryset = queryset.filter(status__iexact=status)
            
        return queryset

class AdminEmailViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated, IsSuperUser]
    serializer_class = AdminSendEmailSerializer

    def create(self, request):
        serializer = self.serializer_class(data=request.data)
        if serializer.is_valid():
            recipient_ids = serializer.validated_data['recipient_ids']
            subject = serializer.validated_data['subject']
            message = serializer.validated_data['message']
            template_name = serializer.validated_data.get('template_name')

            recipients = User.objects.filter(id__in=recipient_ids)
            for recipient in recipients:
                context = {
                    'user': recipient,
                    'message': message,
                    'sender': request.user
                }
                EmailService.send_email(
                    subject=subject,
                    to_email=recipient.email,
                    template_name=template_name or 'admin/custom_email',
                    context=context
                )
            
            return Response({'status': 'success', 'message': f'Email sent to {recipients.count()} user(s).'}, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class AdminUserViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsSuperUser]
    queryset = User.objects.all().order_by('-created_at')
    
    def get_serializer_class(self):
        if self.action == 'list':
            return AdminUserListSerializer
        elif self.action == 'create':
            return AdminUserCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return AdminUserUpdateSerializer
        return AdminUserDetailSerializer

    @extend_schema(
        request=UserSecurityUpdateSerializer,
        responses={200: UserSecurityUpdateSerializer},
        description="Update user security settings",
        examples=[
            OpenApiExample(
                'Security Update Example',
                value={
                    'is_locked': False,
                    'failed_login_attempts': 0,
                    'require_password_change': False,
                    'two_factor_enabled': True,
                    'login_notifications': True
                }
            )
        ]
    )
    @action(detail=True, methods=['patch'])
    def security(self, request, pk=None):
        user = self.get_object()
        security = user.security
        
        serializer = UserSecurityUpdateSerializer(
            security,
            data=request.data,
            partial=True
        )
        
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @extend_schema(
        request=AdminPasswordResetSerializer,
        responses={200: None},
        description="Reset user password by admin",
        examples=[
            OpenApiExample(
                'Password Reset Example',
                value={
                    'password': 'NewPassword123!',
                    'send_email': True,
                    'require_change': True
                }
            )
        ]
    )
    @action(detail=True, methods=['post'])
    def reset_password(self, request, pk=None):
        user = self.get_object()
        serializer = AdminPasswordResetSerializer(data=request.data)
        
        if serializer.is_valid():
            password = serializer.validated_data['password']
            send_email = serializer.validated_data['send_email']
            require_change = serializer.validated_data['require_change']

            # Set new password
            user.set_password(password)
            user.save()
            
            # Update security settings
            if hasattr(user, 'security'):
                user.security.require_password_change = require_change
                user.security.save()

            # Send email notification
            email_sent = False
            if send_email:
                email_sent = serializer.send_reset_notification(
                    user=user,
                    admin_user=request.user,
                    require_change=require_change
                )

            return Response({
                'status': 'success',
                'message': 'Password has been reset successfully',
                'email_sent': email_sent
            })
            
        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )

    @extend_schema(
        request=None,
        responses={200: None},
        description="Toggle user active status",
        examples=[
            OpenApiExample(
                'Toggle Active Response',
                value={
                    'status': 'success',
                    'is_active': True
                }
            )
        ]
    )
    @action(detail=True, methods=['post'])
    def toggle_active(self, request, pk=None):
        user = self.get_object()
        user.is_active = not user.is_active
        user.save()
        
        return Response({
            'status': 'success',
            'is_active': user.is_active
        })

    def perform_destroy(self, instance):
        from rest_framework import serializers
        if instance.is_superuser:
            raise serializers.ValidationError(
                "Superuser accounts cannot be deleted"
            )
        instance.delete()


class AdminChatViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Admin viewset for chats.
    Provides list and retrieve actions.
    """
    permission_classes = [IsAuthenticated, IsSuperUser]
    queryset = Chat.objects.all().prefetch_related('messages').order_by('-last_activity')

    def get_serializer_class(self):
        if self.action == 'list':
            return AdminChatListSerializer
        return AdminChatDetailSerializer


class AdminMessageViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Admin viewset for messages.
    Provides list and retrieve actions.
    """
    permission_classes = [IsAuthenticated, IsSuperUser]
    queryset = Message.objects.all().order_by('-created_at')
    serializer_class = AdminMessageSerializer

class AdminErrorLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Admin viewset for error logs.
    Provides list and retrieve actions.
    """
    permission_classes = [IsAuthenticated, IsSuperUser]
    queryset = ErrorLog.objects.all().order_by('-created_at')
    serializer_class = AdminErrorLogSerializer
