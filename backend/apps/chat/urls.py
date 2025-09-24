from django.urls import path
from .views import (
    ActiveChatsView, ArchivedChatsView, ToggleArchiveView, 
    DeleteChatView, ChatMessagesView, CreateChatView
)

app_name = 'chat'

urlpatterns = [
    # Chat management
    path('create/', CreateChatView.as_view(), name='create-chat'),
    path('active/', ActiveChatsView.as_view(), name='active-chats'),
    path('archived/', ArchivedChatsView.as_view(), name='archived-chats'),
    path('<int:pk>/toggle-archive/', ToggleArchiveView.as_view(), name='toggle-archive'),
    path('<int:pk>/delete/', DeleteChatView.as_view(), name='delete-chat'),

    # Message retrieval
    path('<int:chat_id>/messages/', ChatMessagesView.as_view(), name='chat-messages'),
]