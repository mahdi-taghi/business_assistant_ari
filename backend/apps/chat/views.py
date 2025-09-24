from django.shortcuts import render
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.throttling import UserRateThrottle
from django.db.models import Count
from .models import Chat, Message
from .serializers import ChatListSerializer, MessageSerializer, ChatCreateSerializer

class ActiveChatsView(generics.ListAPIView):
    serializer_class = ChatListSerializer
    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [UserRateThrottle]
    
    def get_queryset(self):
        return Chat.objects.filter(
            user=self.request.user,
            is_archived=False
        ).annotate(
            message_count=Count('messages')
        ).order_by('-last_activity')

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['message_count'] = True
        return context

class ArchivedChatsView(generics.ListAPIView):
    serializer_class = ChatListSerializer
    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [UserRateThrottle]
    
    def get_queryset(self):
        return Chat.objects.filter(
            user=self.request.user,
            is_archived=True
        ).annotate(
            message_count=Count('messages')
        ).order_by('-last_activity')

class CreateChatView(generics.CreateAPIView):
    serializer_class = ChatCreateSerializer
    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [UserRateThrottle]


class ToggleArchiveView(generics.UpdateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [UserRateThrottle]
    queryset = Chat.objects.all()
    
    def update(self, request, *args, **kwargs):
        chat = self.get_object()
        
        if chat.user != request.user:
            return Response(
                {"error": "You don't have permission to modify this chat"}, 
                status=status.HTTP_403_FORBIDDEN
            )
            
        chat.is_archived = not chat.is_archived
        chat.save()
        
        return Response({
            "id": chat.id,
            "is_archived": chat.is_archived,
            "message": "Chat archive status updated successfully"
        })

class DeleteChatView(generics.DestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [UserRateThrottle]
    queryset = Chat.objects.all()

    def destroy(self, request, *args, **kwargs):
        chat = self.get_object()
        
        if chat.user != request.user:
            return Response(
                {"error": "You don't have permission to delete this chat"}, 
                status=status.HTTP_403_FORBIDDEN
            )
            
        chat.delete()
        return Response(
            {"message": "Chat deleted successfully"},
            status=status.HTTP_204_NO_CONTENT
        )

class ChatMessagesView(generics.ListAPIView):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [UserRateThrottle]
    
    def get_queryset(self):
        chat_id = self.kwargs.get('chat_id')
        try:
            chat = Chat.objects.get(id=chat_id, user=self.request.user)
        except Chat.DoesNotExist:
            return Message.objects.none()
            
        return Message.objects.filter(chat=chat)