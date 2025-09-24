import pytest
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from apps.chat.models import Chat, Message

User = get_user_model()

@pytest.mark.django_db
class TestChatModel:
    @pytest.fixture
    def user(self):
        return User.objects.create_user(
            email="test@example.com",
            password="testpass123",
            first_name="Test",
            last_name="User"
        )

    @pytest.fixture
    def chat(self, user):
        return Chat.objects.create(user=user)

    def test_chat_creation(self, user):
        chat = Chat.objects.create(user=user)
        assert chat.title == 'New Chat'
        assert chat.is_archived is False
        assert chat.user == user
        assert isinstance(chat.created_at, timezone.datetime)
        assert isinstance(chat.last_activity, timezone.datetime)

    def test_chat_string_representation(self, chat):
        assert str(chat) == f"Chat {chat.id} - New Chat"
        
        chat.title = "Custom Title"
        chat.save()
        assert str(chat) == f"Chat {chat.id} - Custom Title"

    def test_chat_ordering(self, user):
        chat1 = Chat.objects.create(user=user)
        chat2 = Chat.objects.create(user=user)
        chat3 = Chat.objects.create(user=user)
        
        # Update last_activity of chat1
        chat1.save()  # This updates last_activity
        
        chats = Chat.objects.all()
        assert chats[0] == chat1
        assert chats[2] == chat2  # Oldest last_activity

@pytest.mark.django_db
class TestMessageModel:
    @pytest.fixture
    def user(self):
        return User.objects.create_user(
            email="test@example.com",
            password="testpass123",
            first_name="Test",
            last_name="User"
        )

    @pytest.fixture
    def chat(self, user):
        return Chat.objects.create(user=user)

    def test_message_creation(self, chat):
        message = Message.objects.create(
            chat=chat,
            role=Message.ROLE_USER,
            content="Test message"
        )
        assert message.chat == chat
        assert message.role == Message.ROLE_USER
        assert message.content == "Test message"
        assert message.ai_response_metadata is None
        assert message.ai_references is None
        assert message.tokens_used is None
        assert message.response_time is None

    def test_message_string_representation(self, chat):
        message = Message.objects.create(
            chat=chat,
            role=Message.ROLE_ASSISTANT,
            content="Test response"
        )
        assert str(message) == f"assistant message in chat {chat.id}"

    def test_message_ordering(self, chat):
        msg1 = Message.objects.create(chat=chat, role=Message.ROLE_USER, content="First")
        msg2 = Message.objects.create(chat=chat, role=Message.ROLE_ASSISTANT, content="Second")
        msg3 = Message.objects.create(chat=chat, role=Message.ROLE_USER, content="Third")
        
        messages = Message.objects.filter(chat=chat)
        assert list(messages) == [msg1, msg2, msg3]

    def test_message_cascade_delete(self, chat):
        Message.objects.create(chat=chat, role=Message.ROLE_USER, content="Test")
        Message.objects.create(chat=chat, role=Message.ROLE_ASSISTANT, content="Test response")
        
        assert Message.objects.count() == 2
        chat.delete()
        assert Message.objects.count() == 0

    def test_ai_metadata_fields(self, chat):
        metadata = {"model": "gpt-4", "temperature": 0.7}
        references = [{"title": "Doc1", "url": "http://example.com"}]
        
        message = Message.objects.create(
            chat=chat,
            role=Message.ROLE_ASSISTANT,
            content="Test with metadata",
            ai_response_metadata=metadata,
            ai_references=references,
            tokens_used=150,
            response_time=1.5
        )
        
        message.refresh_from_db()
        assert message.ai_response_metadata == metadata
        assert message.ai_references == references
        assert message.tokens_used == 150
        assert message.response_time == 1.5