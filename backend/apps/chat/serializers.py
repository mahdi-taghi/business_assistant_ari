from rest_framework import serializers
from .models import Chat, Message

class ChatListSerializer(serializers.ModelSerializer):
    message_count = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()

    class Meta:
        model = Chat
        fields = [
            'id',
            'title',
            'created_at',
            'last_activity',
            'is_archived',
            'message_count',
            'last_message'
        ]
        read_only_fields = ['created_at', 'last_activity']

    def get_message_count(self, obj):
        try:
            return obj.message_count
        except AttributeError:
            return obj.messages.count()

    def get_last_message(self, obj):
        last_msg = obj.messages.order_by('-created_at').first()
        if last_msg:
            return {
                'content': last_msg.content[:100],
                'role': last_msg.role,
                'created_at': last_msg.created_at
            }
        return None

class ChatCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Chat
        fields = ['id', 'title']
        read_only_fields = ['id', 'title']

    def create(self, validated_data):
        user = self.context['request'].user
        return Chat.objects.create(user=user)


class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = [
            'id',
            'role',
            'content',
            'created_at',
            'ai_response_metadata',
            'ai_references',
            'tokens_used',
            'response_time'
        ]
        read_only_fields = fields