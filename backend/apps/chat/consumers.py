from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .redis_config import (
    get_redis_connection,
    CHAT_STREAM_KEY,
    RESPONSE_STREAM_KEY,
    create_message_data,
    DateTimeEncoder,
    send_message_to_ai,
    cleanup_message_entries,
    cleanup_chat_entries
)
from .models import Chat, Message
from datetime import datetime
import json
import asyncio

class ChatConsumer(AsyncWebsocketConsumer):
    @database_sync_to_async
    def get_chat_history(self, limit=20):
        messages = Message.objects.filter(
            chat_id=self.chat_id
        ).order_by('-created_at')[:limit].values('role', 'content', 'created_at')
        return [{
            'role': msg['role'],
            'content': msg['content'],
            'timestamp': msg['created_at'].isoformat() if msg['created_at'] else datetime.utcnow().isoformat()
        } for msg in messages]

    @database_sync_to_async
    def get_chat(self):
        try:
            return Chat.objects.get(id=self.chat_id, user=self.user)
        except Chat.DoesNotExist:
            return None

    @database_sync_to_async
    def save_message(self, content, role, metadata=None, references=None, tokens_used=None, response_time=None):
        return Message.objects.create(
            chat_id=self.chat_id,
            role=role,
            content=content,
            ai_response_metadata=metadata,
            ai_references=references,
            tokens_used=tokens_used,
            response_time=response_time,
            created_at=datetime.utcnow()
        )

    @database_sync_to_async
    def get_user_role(self):
        """Get user's role from UserRole or determine if admin"""
        if self.user.is_superuser:
            return 'admin'
        try:
            if hasattr(self.user, 'userrole'):
                return self.user.userrole.role
            return 'public'
        except Exception:
            return 'public'

    @database_sync_to_async
    def update_chat_title(self, title):
        from .models import Chat
        Chat.objects.filter(id=self.chat_id).update(title=title)

    async def connect(self):
        if self.scope["user"].is_anonymous:
            await self.close(code=4003)
            return
            
        self.user = self.scope["user"]
        self.chat_id = self.scope["url_route"]["kwargs"].get("chat_id")
        
        chat = await self.get_chat()
        if not chat:
            await self.close(code=4004)
            return

        if chat.is_archived:
            await self.close(code=4008)
            return

        self.chat_group_name = f"chat_{self.user.id}_{self.chat_id}"
        await self.channel_layer.group_add(
            self.chat_group_name,
            self.channel_name
        )
        
        self.redis = await get_redis_connection()
        await self.accept()

    async def disconnect(self, close_code):
        """Cleanup when connection closes"""
        cleanup_success = False
        redis_conn = None
        
        try:
            if hasattr(self, 'redis') and hasattr(self, 'chat_id'):
                redis_conn = self.redis
                # Clean up Redis entries with retry
                max_retries = 3
                for attempt in range(max_retries):
                    try:
                        print(f"Starting cleanup for chat {self.chat_id}, attempt {attempt + 1}")
                        await cleanup_chat_entries(redis_conn, self.chat_id)
                        cleanup_success = True
                        print(f"Cleanup successful for chat {self.chat_id}")
                        break
                    except Exception as e:
                        print(f"Cleanup attempt {attempt + 1} failed for chat {self.chat_id}: {e}")
                        if attempt < max_retries - 1:
                            await asyncio.sleep(0.1 * (attempt + 1))
                
        except Exception as e:
            print(f"Error during disconnect cleanup for chat {self.chat_id}: {e}")
            
        finally:
            # Remove from channel layer group first
            if hasattr(self, 'chat_group_name'):
                try:
                    await self.channel_layer.group_discard(
                        self.chat_group_name,
                        self.channel_name
                    )
                except Exception as e:
                    print(f"Error discarding from group: {e}")

            # Close Redis connection
            if redis_conn:
                try:
                    if not cleanup_success:
                        # One last try to cleanup before closing
                        try:
                            await cleanup_chat_entries(redis_conn, self.chat_id)
                        except:
                            pass
                    await redis_conn.close()
                except Exception as e:
                    print(f"Error closing Redis connection: {e}")
                finally:
                    if hasattr(self, 'redis'):
                        del self.redis
            
            # Finally disconnect from WebSocket
            try:
                await super().disconnect(close_code)
            except Exception as e:
                print(f"Error in parent disconnect: {e}")

    async def wait_for_ai_response(self, last_id="$", timeout=60, max_retries=3):
        """
        انتظار برای دریافت پاسخ AI از Redis با قابلیت retry
        """
        for attempt in range(max_retries):
            try:
                response = await self.redis.xread(
                    {RESPONSE_STREAM_KEY: last_id}, 
                    block=timeout * 1000, 
                    count=1
                )
                
                if response:
                    _, messages = response[0]
                    return messages[0]
                
                if attempt < max_retries - 1:  
                    await self.send(json.dumps({
                        'type': 'status',
                        'message': f'Waiting for AI response... (attempt {attempt + 1}/{max_retries})'
                    }))
                    await asyncio.sleep(2)  
                    
            except Exception as e:
                print(f"Error in waiting for AI response (attempt {attempt + 1}): {e}")
                if attempt < max_retries - 1:
                    await asyncio.sleep(2)
                
        return None

    async def receive(self, text_data):
        message_id = None
        request_entry_id = None
        response_entry_id = None
        
        try:
            data = json.loads(text_data)
            content = data.get('content')
            
            if not content:
                return

            # Create and save message
            user_role = await self.get_user_role()
            await self.save_message(content, 'user')

            # Get chat history
            pre_history = await self.get_chat_history(20)
            is_first = len(pre_history) == 0
            chat_history_json = json.dumps(pre_history, cls=DateTimeEncoder)
            
            # Create message data
            message_data = await create_message_data(
                self.user.id,
                user_role,
                'user',
                self.chat_id,
                content,
                is_first
            )
            message_data['last_twenty_messages'] = chat_history_json

            # Send to Redis
            message_id, request_entry_id = await send_message_to_ai(self.redis, message_data)

            # Send confirmations
            await self.send(json.dumps({
                'type': 'message_received',
                'chat_id': self.chat_id,
                'message_id': message_id
            }))

            await self.send(json.dumps({
                'type': 'status',
                'message': 'Processing your message...'
            }))

            # Wait for and process AI response
            msg = await self.wait_for_ai_response()
            if msg:
                response_entry_id, response_data = msg
                
                try:
                    # Save and process response
                    await self.process_ai_response(response_data)
                    
                    # Send response to client
                    await self.send(json.dumps({
                        'type': 'ai_response',
                        'data': response_data
                    }))
                    
                    # Clean up Redis entries after successful processing
                    await asyncio.shield(cleanup_message_entries(
                        self.redis,
                        message_id=message_id,
                        response_entry_id=response_entry_id
                    ))
                    
                except Exception as e:
                    print(f"Error processing response: {e}")
                    await cleanup_message_entries(
                        self.redis,
                        message_id=message_id,
                        response_entry_id=response_entry_id
                    )
                    raise
                
            else:
                # Timeout case
                await cleanup_message_entries(self.redis, message_id=message_id)
                await self.send(json.dumps({
                    'type': 'error',
                    'message': 'AI response timeout after multiple attempts.'
                }))
                
        except Exception as e:
            print(f"Error in receive: {e}")
            if message_id:
                await cleanup_message_entries(
                    self.redis,
                    message_id=message_id,
                    response_entry_id=response_entry_id
                )
            await self.send(json.dumps({
                'type': 'error',
                'message': str(e)
            }))

    async def process_ai_response(self, response_data):
        """Process AI response data"""
        # Save message
        await self.save_message(
            response_data.get('content', ''),
            'assistant',
            metadata=response_data.get('ai_response_metadata'),
            references=response_data.get('ai_references'),
            tokens_used=int(response_data.get('tokens_used', "0")),
            response_time=float(response_data.get('response_time', "0"))
        )

        # Update title if metadata contains suggested_title
        try:
            metadata = json.loads(response_data.get('ai_response_metadata', '{}'))
            if title := metadata.get('suggested_title'):
                await self.update_chat_title(title)
        except json.JSONDecodeError:
            pass