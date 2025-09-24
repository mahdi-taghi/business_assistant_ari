from django.db import models
from django.conf import settings
from django.utils import timezone
from django.db.models import Q, Index, F, JSONField
from django.contrib.auth import get_user_model

User = get_user_model()

class Chat(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='chats')
    title = models.CharField(max_length=250, blank=True, default='New Chat')
    created_at = models.DateTimeField(auto_now_add=True)
    last_activity = models.DateTimeField(auto_now=True)
    is_archived = models.BooleanField(default=False)

    class Meta:
        indexes = [
            Index(fields=['-last_activity']),
            Index(fields=['user', '-created_at'])
        ]
        ordering = ['-last_activity']

    def __str__(self):
        return f"Chat {self.id} - {self.title or 'Untitled'}"


class Message(models.Model):
    ROLE_USER = 'user'
    ROLE_ASSISTANT = 'assistant'

    ROLE_CHOICES = [
        (ROLE_USER, 'User'),
        (ROLE_ASSISTANT, 'Assistant'),
    ]

    chat = models.ForeignKey(Chat, on_delete=models.CASCADE, related_name='messages')
    role = models.CharField(max_length=10, choices=ROLE_CHOICES)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    ai_response_metadata = JSONField(null=True, blank=True)
    ai_references = JSONField(null=True, blank=True)
    tokens_used = models.PositiveIntegerField(null=True, blank=True)
    response_time = models.FloatField(null=True, blank=True)

    class Meta:
        indexes = [
            Index(fields=['chat', '-created_at']),
            Index(fields=['role', '-created_at'])
        ]
        ordering = ['created_at']

    def __str__(self):
        return f"{self.role} message in chat {self.chat_id}"
