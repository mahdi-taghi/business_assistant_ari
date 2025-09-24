from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils import timezone
from django.conf import settings
from django.contrib.auth import get_user_model
from .models import EmailLog

class EmailService:
    @staticmethod
    def serialize_context(context):
        """Serialize context data to ensure JSON compatibility"""
        if not context:
            return {}
            
        serialized_context = context.copy()
        
        # Handle User object serialization
        if 'user' in serialized_context and serialized_context['user']:
            user = serialized_context['user']
            serialized_context['user'] = {
                'id': user.id,
                'email': user.email,
                'username': getattr(user, 'username', ''),
                'first_name': getattr(user, 'first_name', ''),
                'last_name': getattr(user, 'last_name', '')
            }

        if 'sender' in serialized_context and serialized_context['sender']:
            sender = serialized_context['sender']
            serialized_context['sender'] = {
                'id': sender.id,
                'email': sender.email,
                'username': getattr(sender, 'username', ''),
                'first_name': getattr(sender, 'first_name', ''),
                'last_name': getattr(sender, 'last_name', '')
            }
            
        return serialized_context

    @staticmethod
    def send_email(
        subject: str,
        to_email: str,
        template_name: str = None,
        context: dict = None,
        content: str = None,
    ) -> bool:
        """
        Send email and log the attempt
        """
        email_log = None
        
        try:
            # Serialize context for JSON storage
            serialized_context = EmailService.serialize_context(context)
            
            # Create email log entry
            email_log = EmailLog.objects.create(
                subject=subject,
                to_email=to_email,
                from_email=settings.DEFAULT_FROM_EMAIL,
                template_name=template_name,
                context=serialized_context,
                content=content or ''
            )

            # If template is provided, render it
            if template_name:
                # Use original context for template rendering
                html_content = render_to_string(f"{template_name}.html", context or {})
                text_content = render_to_string(f"{template_name}.txt", context or {})
            else:
                html_content = content
                text_content = content

            # Send email
            send_mail(
                subject=subject,
                message=text_content,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[to_email],
                html_message=html_content,
                fail_silently=False,
            )

            # Update log status
            email_log.status = 'sent'
            email_log.sent_at = timezone.now()
            email_log.save()

            return True

        except Exception as e:
            # Log error if email_log exists
            if email_log:
                email_log.status = 'failed'
                email_log.error_message = str(e)
                email_log.save()
            
            # Create new log entry if email_log wasn't created
            else:
                EmailLog.objects.create(
                    subject=subject,
                    to_email=to_email,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    template_name=template_name,
                    context=EmailService.serialize_context(context),
                    content=content or '',
                    status='failed',
                    error_message=str(e)
                )
            
            return False