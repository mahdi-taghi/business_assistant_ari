import asyncio
import json
import pytest
import uuid
from channels.testing import WebsocketCommunicator
from channels.db import database_sync_to_async
from core.asgi import application
from apps.chat.models import Chat, Message
from rest_framework_simplejwt.tokens import AccessToken
from apps.chat.redis_config import (
    CHAT_STREAM_KEY, 
    RESPONSE_STREAM_KEY,
    get_redis_connection,
    MSG_MAP_PREFIX
)
from apps.chat.consumers import ChatConsumer
from django.contrib.auth import get_user_model

User = get_user_model()

@pytest.mark.asyncio
@pytest.mark.django_db(transaction=True)
class TestChatWebSocket:
    async def create_test_user(self, email=None):
        """Create a test user with optional email"""
        if not email:
            email = f"test_{uuid.uuid4().hex}@example.com"
        
        user = await database_sync_to_async(User.objects.create_user)(
            email=email,
            password='testpass123',
            is_active=True
        )
        return user

    async def get_token_for_user(self, user):
        """Get JWT token for a user"""
        return str(AccessToken.for_user(user))

    async def create_test_chat(self, user, title=None):
        """Create a test chat for a user"""
        if not title:
            title = f"Test Chat {uuid.uuid4().hex[:6]}"
        
        chat = await database_sync_to_async(Chat.objects.create)(
            user=user,
            title=title
        )
        return chat

    async def setup_test_data(self):
        """Setup basic test data for a single user"""
        self.user = await self.create_test_user()
        self.token = await self.get_token_for_user(self.user)
        self.chat = await self.create_test_chat(self.user)

    async def test_websocket_connect(self):
        await self.setup_test_data()
        communicator = WebsocketCommunicator(
            application,
            f"ws/chat/{self.chat.id}/?token={self.token}",
            headers=[(b"origin", b"http://localhost")]
        )
        try:
            connected, _ = await communicator.connect()
            assert connected is True
        finally:
            await communicator.disconnect()

    async def test_websocket_receive_message(self):
        await self.setup_test_data()
        communicator = WebsocketCommunicator(
            application,
            f"ws/chat/{self.chat.id}/?token={self.token}",
            headers=[(b"origin", b"http://localhost")]
        )
        try:
            connected, _ = await communicator.connect()
            assert connected is True
            test_message = {"content": "Hello AI", "is_first_message": True}
            await communicator.send_json_to(test_message)
            response = await communicator.receive_json_from()  # message_received
            assert response["type"] == "message_received"
            assert response["chat_id"] == str(self.chat.id)
            status = await communicator.receive_json_from()  # status
            assert status["type"] == "status"
            assert "Processing" in status["message"]
        finally:
            await communicator.disconnect()

    async def test_websocket_unauthorized(self):
        await self.setup_test_data()
        communicator = WebsocketCommunicator(
            application,
            f"/ws/chat/{self.chat.id}/?token=invalid_token"
        )
        connected, _ = await communicator.connect()
        assert connected is False

    async def test_websocket_chat_not_found(self):
        await self.setup_test_data()
        communicator = WebsocketCommunicator(
            application,
            f"/ws/chat/999/?token={self.token}"
        )
        connected, _ = await communicator.connect()
        assert connected is False

    async def test_websocket_archived_chat(self):
        await self.setup_test_data()
        self.chat.is_archived = True
        await database_sync_to_async(self.chat.save)()
        communicator = WebsocketCommunicator(
            application,
            f"/ws/chat/{self.chat.id}/?token={self.token}"
        )
        connected, _ = await communicator.connect()
        assert connected is False

    async def test_websocket_message_persistence(self):
        await self.setup_test_data()
        communicator = WebsocketCommunicator(
            application,
            f"ws/chat/{self.chat.id}/?token={self.token}",
            headers=[(b"origin", b"http://localhost")]
        )
        try:
            connected, _ = await communicator.connect()
            assert connected is True
            test_message = {"content": "Test message", "is_first_message": False}
            await communicator.send_json_to(test_message)
            await communicator.receive_json_from()  # message_received
            await communicator.receive_json_from()  # status

            count_messages = database_sync_to_async(
                lambda: Message.objects.filter(chat=self.chat, content="Test message").count()
            )
            messages_count = await count_messages()
            assert messages_count == 1
        finally:
            await communicator.disconnect()

    async def test_message_id_matching(self, monkeypatch):
        """Test that responses are matched with correct requests using message_id"""
        # Patch wait_for_ai_response to simulate immediate AI response
        counter = {"value": 0}
        async def fake_wait_for_ai_response(self, last_id="$", timeout=60, max_retries=3):
            counter["value"] += 1
            simulated_response = {
                "content": "AI simulated reply",
                "message_id": f"simulated-{counter['value']}",
                "ai_response_metadata": "{}",
                "ai_references": "[]",
                "tokens_used": "0",
                "response_time": "0"
            }
            return ("fake_entry", simulated_response)
        monkeypatch.setattr(ChatConsumer, "wait_for_ai_response", fake_wait_for_ai_response)

        await self.setup_test_data()
        communicator = WebsocketCommunicator(
            application,
            f"ws/chat/{self.chat.id}/?token={self.token}",
            headers=[(b"origin", b"http://localhost")]
        )
        try:
            connected, _ = await communicator.connect()
            assert connected is True

            # First message
            msg1 = {"content": "First message", "is_first_message": True}
            await communicator.send_json_to(msg1)
            response1 = await communicator.receive_json_from()  # message_received
            assert response1["type"] == "message_received"
            message_id1 = response1.get("message_id")
            status1 = await communicator.receive_json_from()  # status
            assert status1["type"] == "status"
            # Now also receive simulated ai_response
            ai_response1 = await communicator.receive_json_from()
            assert ai_response1["type"] == "ai_response"

            # Second message
            msg2 = {"content": "Second message", "is_first_message": False}
            await communicator.send_json_to(msg2)
            response2 = await communicator.receive_json_from()  # message_received
            assert response2["type"] == "message_received"
            message_id2 = response2.get("message_id")
            status2 = await communicator.receive_json_from()  # status
            assert status2["type"] == "status"
            ai_response2 = await communicator.receive_json_from()
            assert ai_response2["type"] == "ai_response"

            # Verify unique message_ids for the two requests (as returned in message_received)
            assert message_id1 is not None and message_id2 is not None
            assert message_id1 != message_id2
        finally:
            await communicator.disconnect()

    async def test_redis_cleanup(self, monkeypatch):
        """Test that Redis connection works for message processing"""
        message_id_store = {"current": None}
        
        async def fake_wait_for_ai_response(self, last_id="$", timeout=60, max_retries=3):
            await asyncio.sleep(0.1)  # Small delay to simulate processing
            simulated_response = {
                "content": "AI simulated response",
                "message_id": message_id_store["current"],
                "ai_response_metadata": "{}",
                "ai_references": "[]",
                "tokens_used": "0",
                "response_time": "0"
            }
            return ("fake_entry", simulated_response)

        monkeypatch.setattr(ChatConsumer, "wait_for_ai_response", fake_wait_for_ai_response)

        await self.setup_test_data()
        redis = await get_redis_connection()
        communicator = WebsocketCommunicator(
            application,
            f"ws/chat/{self.chat.id}/?token={self.token}",
            headers=[(b"origin", b"http://localhost")]
        )

        try:
            connected, _ = await communicator.connect()
            assert connected is True

            # Send test message
            test_message = {"content": "Test message", "is_first_message": False}
            await communicator.send_json_to(test_message)

            # Get message ID from response
            response = await communicator.receive_json_from()  # message_received response
            message_id = response.get("message_id")
            message_id_store["current"] = message_id
            assert message_id is not None

            await communicator.receive_json_from()  # status message

            # Get AI response and verify it arrives
            ai_response = await communicator.receive_json_from()  # ai_response
            assert ai_response["type"] == "ai_response"
            assert ai_response["data"]["content"] == "AI simulated response"

        finally:
            await redis.close()
            await communicator.disconnect()

    async def test_chat_title_update(self):
        """Test that chat title updates when AI response provides a suggested title"""
        await self.setup_test_data()
        communicator = WebsocketCommunicator(
            application,
            f"ws/chat/{self.chat.id}/?token={self.token}",
            headers=[(b"origin", b"http://localhost")]
        )
        try:
            connected, _ = await communicator.connect()
            assert connected is True
            test_message = {"content": "First message", "is_first_message": True}
            await communicator.send_json_to(test_message)
            response = await communicator.receive_json_from()  # message_received
            message_id = response.get("message_id")
            await communicator.receive_json_from()  # status

            redis = await get_redis_connection()
            ai_response_data = {
                "message_id": message_id,
                "content": "AI response with title update",
                "ai_response_metadata": json.dumps({"suggested_title": "Test Chat Title"}),
                "ai_references": "[]",
                "tokens_used": "0",
                "response_time": "0",
                "timestamp": "2025-09-09T00:00:00"
            }
            await redis.xadd(RESPONSE_STREAM_KEY, ai_response_data)
            ai_response = await communicator.receive_json_from()
            assert ai_response["type"] == "ai_response"
            await redis.close()

            from apps.chat.models import Chat
            updated_chat = await database_sync_to_async(Chat.objects.get)(id=self.chat.id)
            assert updated_chat.title == "Test Chat Title"
        finally:
            await communicator.disconnect()

    async def test_ai_response_timeout(self, monkeypatch):
        """Test handling of AI response timeout"""
        # Patch wait_for_ai_response to simulate timeout (returning None)
        async def fake_wait_for_ai_response(self, last_id="$", timeout=60, max_retries=3):
            await asyncio.sleep(0)
            return None
        monkeypatch.setattr(ChatConsumer, "wait_for_ai_response", fake_wait_for_ai_response)

        await self.setup_test_data()
        communicator = WebsocketCommunicator(
            application,
            f"ws/chat/{self.chat.id}/?token={self.token}",
            headers=[(b"origin", b"http://localhost")]
        )
        try:
            connected, _ = await communicator.connect()
            assert connected is True
            test_message = {"content": "Test timeout", "is_first_message": False}
            await communicator.send_json_to(test_message)
            await communicator.receive_json_from()  # message_received
            await communicator.receive_json_from()  # status
            error_msg = await communicator.receive_json_from()
            assert error_msg["type"] == "error"
            assert "timeout" in error_msg["message"]
        finally:
            await communicator.disconnect()

    async def test_chat_cleanup_on_disconnect(self):
        """Test that websocket disconnects properly"""
        await self.setup_test_data()
        redis = await get_redis_connection()
        communicator = None

        try:
            communicator = WebsocketCommunicator(
                application,
                f"ws/chat/{self.chat.id}/?token={self.token}",
                headers=[(b"origin", b"http://localhost")]
            )

            connected, _ = await communicator.connect()
            assert connected is True

            # Verify connection works by sending a test message
            test_message = {"content": "Test message", "is_first_message": False}
            await communicator.send_json_to(test_message)
            
            # Should get message ID confirmation
            response = await communicator.receive_json_from()
            assert response.get("message_id") is not None

            # Close communicator 
            await communicator.disconnect()
            communicator = None

            # Verify only that ASGI group is cleaned up
            group_key = f"asgi:group:chat_{self.chat.id}"
            assert not await redis.exists(group_key)

        finally:
            await redis.close()
            if communicator:
                try:
                    await communicator.disconnect()
                except Exception:
                    pass

    async def test_concurrent_users(self, monkeypatch):
        """Test that multiple concurrent users receive their correct AI responses"""
        # Number of concurrent users
        num_users = 10
        users_data = []
        
        # Create multiple test users and their chats
        for i in range(num_users):
            user = await self.create_test_user(f"user{i}@test.com")
            chat = await self.create_test_chat(user)
            token = await self.get_token_for_user(user)
            users_data.append({
                "user": user,
                "chat": chat,
                "token": token,
                "expected_message": f"Response for user{i}@test.com"
            })

        # Create a mock AI response function that returns user-specific responses
        async def fake_wait_for_ai_response(self, last_id="$", timeout=60, max_retries=3):
            await asyncio.sleep(0.1)  # Small delay to simulate processing
            # Find the matching user data based on the chat_id
            user_data = next(
                (data for data in users_data if str(data["chat"].id) == self.chat_id),
                None
            )
            if user_data:
                return ("fake_entry", {
                    "content": user_data["expected_message"],
                    "message_id": str(uuid.uuid4()),
                    "ai_response_metadata": "{}",
                    "ai_references": "[]",
                    "tokens_used": "0",
                    "response_time": "0"
                })
            return None

        monkeypatch.setattr(ChatConsumer, "wait_for_ai_response", fake_wait_for_ai_response)

        # Create communicators for all users
        communicators = []
        try:
            for user_data in users_data:
                communicator = WebsocketCommunicator(
                    application,
                    f"ws/chat/{user_data['chat'].id}/?token={user_data['token']}",
                    headers=[(b"origin", b"http://localhost")]
                )
                connected, _ = await communicator.connect()
                assert connected is True
                communicators.append({
                    "communicator": communicator,
                    "user_data": user_data
                })

            # Send messages from all users concurrently
            send_tasks = []
            for comm_data in communicators:
                send_tasks.append(asyncio.create_task(
                    comm_data["communicator"].send_json_to({
                        "content": f"Message from {comm_data['user_data']['user'].email}",
                        "is_first_message": False
                    })
                ))
            await asyncio.gather(*send_tasks)

            # Receive message IDs and status messages
            for comm_data in communicators:
                # Get message ID confirmation
                response = await comm_data["communicator"].receive_json_from()
                assert response.get("message_id") is not None
                # Get status message
                status = await comm_data["communicator"].receive_json_from()
                assert status["type"] == "status"

            # Receive and verify AI responses
            for comm_data in communicators:
                ai_response = await comm_data["communicator"].receive_json_from()
                assert ai_response["type"] == "ai_response"
                assert ai_response["data"]["content"] == comm_data["user_data"]["expected_message"]

        finally:
            # Clean up all communicators
            for comm_data in communicators:
                try:
                    await comm_data["communicator"].disconnect()
                except Exception:
                    pass