"""
ASGI config for core project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.2/howto/deployment/asgi/
"""

import os
import logging

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Set Django settings before imports
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

# Import Django application first
from django.core.asgi import get_asgi_application
django_asgi_app = get_asgi_application()

# Import other dependencies after Django setup
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator
from channels.auth import AuthMiddlewareStack
from apps.chat import routing as chat_routing
from apps.chat.middleware import JwtAuthMiddleware

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": AllowedHostsOriginValidator(
        AuthMiddlewareStack(
            JwtAuthMiddleware(
                URLRouter(
                    chat_routing.websocket_urlpatterns
                )
            )
        )
    ),
})

# Log application startup
logger.info("ASGI application configured successfully")
