import pytest
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from apps.chat.models import Chat, Message

User = get_user_model()

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def user(db):
    return User.objects.create_user(
        email="chatuser@example.com",
        password="testpass123",
        first_name="Chat",
        last_name="User"
    )

@pytest.fixture
def auth_client(api_client, user):
    api_client.force_authenticate(user=user)
    return api_client

@pytest.fixture
def active_chat(user):
    return Chat.objects.create(user=user, is_archived=False)

@pytest.fixture
def archived_chat(user):
    return Chat.objects.create(user=user, is_archived=True)

@pytest.fixture
def message(active_chat):
    return Message.objects.create(
        chat=active_chat,
        role=Message.ROLE_USER,
        content="Test message",
        tokens_used=10,
        response_time=1.5,
        ai_response_metadata={"model": "gpt-4"},
        ai_references={"source": "documentation"}
    )

@pytest.fixture
def assistant_message(active_chat):
    return Message.objects.create(
        chat=active_chat,
        role=Message.ROLE_ASSISTANT,
        content="Assistant response",
        tokens_used=15,
        response_time=2.0,
        ai_response_metadata={"model": "gpt-4"},
        ai_references={"source": "knowledge_base"}
    )

@pytest.mark.django_db
class TestChatViews:
    def test_active_chats_view(self, auth_client, active_chat, archived_chat):
        url = reverse('chat:active-chats')
        response = auth_client.get(url, format='json')
        assert response.status_code == 200
        data = response.data.get('results', response.data)
        chat_ids = [chat['id'] for chat in data]
        assert active_chat.id in chat_ids
        assert archived_chat.id not in chat_ids
        for chat in data:
            assert 'message_count' in chat

    def test_archived_chats_view(self, auth_client, active_chat, archived_chat):
        url = reverse('chat:archived-chats')
        response = auth_client.get(url, format='json')
        assert response.status_code == 200
        data = response.data.get('results', response.data)
        chat_ids = [chat['id'] for chat in data]
        assert archived_chat.id in chat_ids
        assert active_chat.id not in chat_ids

    def test_toggle_archive_view(self, auth_client, user):
        chat = Chat.objects.create(user=user, is_archived=False)
        url = reverse('chat:toggle-archive', args=[chat.id])
        # Toggle to archive
        response = auth_client.patch(url, {}, format='json')
        assert response.status_code == 200
        chat.refresh_from_db()
        assert chat.is_archived is True
        # Toggle back to active
        response = auth_client.patch(url, {}, format='json')
        assert response.status_code == 200
        chat.refresh_from_db()
        assert chat.is_archived is False

    def test_delete_chat_view(self, auth_client, user):
        chat = Chat.objects.create(user=user)
        url = reverse('chat:delete-chat', args=[chat.id])
        response = auth_client.delete(url, format='json')
        assert response.status_code == 204
        assert not Chat.objects.filter(id=chat.id).exists()

    def test_unauthorized_modify_chat(self, api_client, user):
        # Chat created by user
        chat = Chat.objects.create(user=user)
        # Create another user and authenticate
        other_user = User.objects.create_user(
            email="other@example.com",
            password="pass1234",
            first_name="Other",
            last_name="User"
        )
        client = APIClient()
        client.force_authenticate(user=other_user)
        url = reverse('chat:delete-chat', args=[chat.id])
        response = client.delete(url, format='json')
        # Expecting not found or permission denied error
        assert response.status_code in [403, 404]

@pytest.mark.django_db
class TestMessageViews:
    def test_chat_messages_view(self, auth_client, active_chat, message, assistant_message):
        url = reverse('chat:chat-messages', args=[active_chat.id])
        response = auth_client.get(url)
        
        assert response.status_code == 200
        data = response.data['results']  # Access the results from pagination
        assert len(data) == 2
        
        # Verify message fields
        for msg in data:
            assert all(field in msg for field in [
                'id', 'role', 'content', 'created_at',
                'ai_response_metadata', 'ai_references',
                'tokens_used', 'response_time'
            ])

    def test_unauthorized_chat_messages_view(self, api_client, active_chat):
        url = reverse('chat:chat-messages', args=[active_chat.id])
        response = api_client.get(url)
        assert response.status_code == 401

    def test_nonexistent_chat_messages(self, auth_client):
        url = reverse('chat:chat-messages', args=[99999])
        response = auth_client.get(url)
        assert response.status_code == 200
        assert len(response.data['results']) == 0  # Check results from pagination

    def test_other_user_chat_messages(self, auth_client, user):
        # Create another user's chat
        other_user = User.objects.create_user(
            email="other2@example.com",
            password="pass1234"
        )
        other_chat = Chat.objects.create(user=other_user)
        Message.objects.create(
            chat=other_chat,
            role=Message.ROLE_USER,
            content="Other user's message"
        )
        
        url = reverse('chat:chat-messages', args=[other_chat.id])
        response = auth_client.get(url)
        assert len(response.data['results']) == 0  # Check results from pagination

@pytest.mark.django_db
class TestChatListSerializer:
    def test_chat_list_serializer_with_messages(self, active_chat, message, assistant_message):
        from apps.chat.serializers import ChatListSerializer
        
        serializer = ChatListSerializer(active_chat)
        data = serializer.data
        
        assert data['id'] == active_chat.id
        assert data['message_count'] == 2
        assert data['last_message'] is not None
        assert data['last_message']['content'] == assistant_message.content
        assert data['last_message']['role'] == Message.ROLE_ASSISTANT

    def test_chat_list_serializer_without_messages(self, active_chat):
        from apps.chat.serializers import ChatListSerializer
        
        serializer = ChatListSerializer(active_chat)
        data = serializer.data
        
        assert data['id'] == active_chat.id
        assert data['message_count'] == 0
        assert data['last_message'] is None

@pytest.mark.django_db
class TestMessageSerializer:
    def test_message_serializer(self, message):
        from apps.chat.serializers import MessageSerializer
        
        serializer = MessageSerializer(message)
        data = serializer.data
        
        assert data['id'] == message.id
        assert data['role'] == Message.ROLE_USER
        assert data['content'] == "Test message"
        assert data['tokens_used'] == 10
        assert data['response_time'] == 1.5
        assert data['ai_response_metadata'] == {"model": "gpt-4"}
        assert data['ai_references'] == {"source": "documentation"}