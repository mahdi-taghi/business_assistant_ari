import pytest
from channels.routing import URLRouter
from channels.auth import AuthMiddlewareStack
from django.urls import re_path
from apps.chat.consumers import ChatConsumer
from apps.chat.middleware import JwtAuthMiddleware
from channels.testing import WebsocketCommunicator

@pytest.fixture
def application():
    """
    Create an application instance with proper middleware stack
    """
    return JwtAuthMiddleware(
        AuthMiddlewareStack(
            URLRouter([
                re_path(r"ws/chat/(?P<chat_id>\d+)/$", ChatConsumer.as_asgi()),
            ])
        )
    )

@pytest.fixture
async def websocket_communicator(application, db):
    """
    Creates a WebSocket communicator for testing
    """
    return WebsocketCommunicator(
        application=application,
        path="/ws/chat/1/"
    )