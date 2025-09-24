from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

app_name = "adminpanel"

router = DefaultRouter()
router.register(r'users', views.AdminUserViewSet)
router.register(r'chats', views.AdminChatViewSet)
router.register(r'messages', views.AdminMessageViewSet)
router.register(r'email-logs', views.AdminEmailLogViewSet)
router.register(r'send-email', views.AdminEmailViewSet, basename='send-email')
router.register(r'error-logs', views.AdminErrorLogViewSet)

urlpatterns = [
    path('', include(router.urls)),
]