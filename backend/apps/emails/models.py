from django.db import models
from django.utils.translation import gettext_lazy as _

class EmailLog(models.Model):
    STATUS_CHOICES = [
        ('pending', _('Pending')),
        ('sent', _('Sent')),
        ('failed', _('Failed')),
    ]

    subject = models.CharField(_('Subject'), max_length=255)
    to_email = models.EmailField(_('To Email'))
    from_email = models.EmailField(_('From Email'))
    content = models.TextField(_('Content'))
    template_name = models.CharField(_('Template Name'), max_length=100, null=True, blank=True)
    context = models.JSONField(_('Context'), null=True, blank=True)
    status = models.CharField(_('Status'), max_length=20, choices=STATUS_CHOICES, default='pending')
    error_message = models.TextField(_('Error Message'), null=True, blank=True)
    created_at = models.DateTimeField(_('Created At'), auto_now_add=True)
    sent_at = models.DateTimeField(_('Sent At'), null=True, blank=True)

    class Meta:
        verbose_name = _('Email Log')
        verbose_name_plural = _('Email Logs')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.subject} - {self.to_email} ({self.status})"
