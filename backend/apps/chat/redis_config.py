from redis.asyncio import Redis
from django.conf import settings
from datetime import datetime
import json
import asyncio
import uuid

class DateTimeEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, datetime):
            return obj.isoformat()
        return super().default(obj)

async def get_redis_connection():
    redis = Redis(
        host=settings.REDIS_HOST,
        port=settings.REDIS_PORT,
        password=settings.REDIS_PASSWORD,
        decode_responses=True
    )
    return redis

# Redis Stream keys
CHAT_STREAM_KEY = "chat_stream"
RESPONSE_STREAM_KEY = "response_stream"
MSG_MAP_PREFIX = "msg_map:"  # mapping key prefix for message_id -> request_entry_id

async def create_message_data(user_id, website_user_role, message_role, chat_id, content, is_first_message=False, chat_history="[]", message_id=None):
    current_time = datetime.utcnow().isoformat()
    return {
        "message_id": message_id or str(uuid.uuid4()),
        "user_id": str(user_id),
        "user_role": str(website_user_role),
        "message_role": str(message_role),
        "chat_id": str(chat_id),
        "content": str(content),
        "is_first_message": "1" if is_first_message else "0",
        "timestamp": current_time,
        "last_twenty_messages": chat_history
    }

async def create_response_data(user_id, chat_id, content, metadata=None, references=None, message_id=None):
    current_time = datetime.utcnow().isoformat()
    return {
        "message_id": message_id or str(uuid.uuid4()),
        "user_id": str(user_id),
        "chat_id": str(chat_id),
        "content": str(content),
        "ai_response_metadata": json.dumps(metadata or {}, cls=DateTimeEncoder),
        "ai_references": json.dumps(references or [], cls=DateTimeEncoder),
        "tokens_used": "0",
        "response_time": current_time,
        "timestamp": current_time
    }

async def send_message_to_ai(redis_conn, message_data, request_ttl_seconds=3600):
    """
    Adds message to CHAT_STREAM_KEY with a generated message_id field,
    stores mapping message_id -> redis_entry_id (so we can delete later).
    Returns the message_id and redis entry id assigned by XADD.
    """
    # ensure message_id present
    if "message_id" not in message_data:
        message_data["message_id"] = str(uuid.uuid4())

    redis_fields = {k: str(v) for k, v in message_data.items()}
    # XADD and keep stream length bounded
    entry_id = await redis_conn.xadd(
        CHAT_STREAM_KEY,
        redis_fields,
        maxlen=10000,
        approximate=True
    )
    # store mapping for cleanup: msg_map:{message_id} -> entry_id
    await redis_conn.set(f"{MSG_MAP_PREFIX}{message_data['message_id']}", entry_id, ex=request_ttl_seconds)
    return message_data['message_id'], entry_id

async def cleanup_message_entries(redis_conn, message_id: str, response_entry_id: str = None) -> None:
    """Clean up Redis message entries"""
    if not message_id:
        return
        
    try:
        map_key = f"{MSG_MAP_PREFIX}{message_id}"
        request_entry_id = await redis_conn.get(map_key)
        
        if request_entry_id:
            # Delete from chat stream first
            await redis_conn.xdel(CHAT_STREAM_KEY, request_entry_id)
        
        if response_entry_id:    
            # Delete from response stream
            await redis_conn.xdel(RESPONSE_STREAM_KEY, response_entry_id)
            
        # Finally delete the mapping key
        await redis_conn.delete(map_key)
        
    except Exception as e:
        print(f"Error during Redis cleanup for message {message_id}: {str(e)}")

async def cleanup_chat_entries(redis_conn, chat_id: str) -> None:
    """Clean up all Redis entries related to a chat"""
    try:
        print(f"Starting cleanup for chat {chat_id}")
        
        # 1. Clean up chat stream entries using xrange
        try:
            # Get messages in chunks to avoid memory issues
            last_id = '-'
            while True:
                # Get next chunk of messages
                messages = await redis_conn.xrange(CHAT_STREAM_KEY, min=last_id, count=100)
                if not messages:
                    break
                
                # Process messages in this chunk
                entries_to_delete = []
                for entry_id, fields in messages:
                    if fields.get('chat_id', b'').decode('utf-8') == str(chat_id):
                        entries_to_delete.append(entry_id)
                
                # Delete found entries
                if entries_to_delete:
                    await redis_conn.xdel(CHAT_STREAM_KEY, *entries_to_delete)
                    print(f"Deleted {len(entries_to_delete)} chat messages")
                
                # Move to next chunk
                last_id = messages[-1][0]
                
        except Exception as e:
            print(f"Error cleaning chat stream: {e}")

        # 2. Clean up response stream entries using xrange
        try:
            # Get messages in chunks
            last_id = '-'
            while True:
                # Get next chunk of messages
                messages = await redis_conn.xrange(RESPONSE_STREAM_KEY, min=last_id, count=100)
                if not messages:
                    break
                
                # Process messages in this chunk
                entries_to_delete = []
                for entry_id, fields in messages:
                    if fields.get('chat_id', b'').decode('utf-8') == str(chat_id):
                        entries_to_delete.append(entry_id)
                
                # Delete found entries
                if entries_to_delete:
                    await redis_conn.xdel(RESPONSE_STREAM_KEY, *entries_to_delete)
                    print(f"Deleted {len(entries_to_delete)} response messages")
                
                # Move to next chunk
                last_id = messages[-1][0]
                
        except Exception as e:
            print(f"Error cleaning response stream: {e}")

        # 3. Clean up message mappings
        try:
            pattern = f"{MSG_MAP_PREFIX}*"
            mapping_keys = await redis_conn.keys(pattern)
            if mapping_keys:
                await redis_conn.delete(*mapping_keys)
                print(f"Deleted {len(mapping_keys)} message mappings")
        except Exception as e:
            print(f"Error cleaning message mappings: {e}")

        # 4. Clean up ASGI group key
        try:
            group_key = f"asgi:group:chat_{chat_id}"
            await redis_conn.delete(group_key)
            print(f"Deleted ASGI group key: {group_key}")
        except Exception as e:
            print(f"Error cleaning ASGI group: {e}")

        print(f"Cleanup completed for chat {chat_id}")

    except Exception as e:
        print(f"Error during chat cleanup for chat {chat_id}: {e}")
        # Even if we get an error, try to clean up the ASGI group
        try:
            group_key = f"asgi:group:chat_{chat_id}"
            await redis_conn.delete(group_key)
        except:
            pass