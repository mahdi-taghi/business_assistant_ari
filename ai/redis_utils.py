# redis_utils.py
import json
import os
import redis
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional

# اتصال به Redis (از REDIS_URL در .env استفاده می‌کند)
r = redis.Redis.from_url(
    os.getenv("REDIS_URL", "redis://localhost:6379/0"),
    decode_responses=True,  # خروجی‌ها به صورت str یونیکد
)

def now_iso() -> str:
    """زمان فعلی به ISO8601 با microseconds"""
    return datetime.now(timezone.utc).astimezone().isoformat(timespec="microseconds")

def health() -> bool:
    """ping ساده برای چک سلامت اتصال Redis"""
    try:
        return r.ping()
    except Exception:
        return False

def push_last_twenty_message(chat_id: str, role: str, content: str, ts: Optional[str] = None):
    """تاریخچهٔ ۲۰ پیام آخر چت را به‌صورت لیست در Redis نگه می‌دارد (LPUSH/LTRIM)."""
    key = f"chat:{chat_id}:last_twenty"
    item = {"role": role, "content": content, "timestamp": ts or now_iso()}
    try:
        with r.pipeline() as p:
            p.lpush(key, json.dumps(item, ensure_ascii=False))
            p.ltrim(key, 0, 19)
            p.execute()
    except Exception as e:
        print(f"Redis error push_last_twenty_message: {e}")

def get_last_twenty_messages(chat_id: str) -> List[Dict[str, Any]]:
    """خواندن تاریخچهٔ ۲۰ پیام آخر (جدیدترین اول)."""
    key = f"chat:{chat_id}:last_twenty"
    try:
        raw = r.lrange(key, 0, -1)
        return [json.loads(x) for x in raw]
    except Exception as e:
        print(f"Redis error get_last_twenty_messages: {e}")
        return []

def save_user_message_json(user_json: Dict[str, Any]):
    """ذخیرهٔ آخرین JSON پیام کاربر مطابق قرارداد تیم."""
    key = f"chat:{user_json['chat_id']}:latest_user_json"
    try:
        r.set(key, json.dumps(user_json, ensure_ascii=False))
    except Exception as e:
        print(f"Redis error save_user_message_json: {e}")

def save_ai_response_json(ai_json: Dict[str, Any]):
    """ذخیرهٔ آخرین JSON پاسخ AI مطابق قرارداد تیم."""
    key = f"chat:{ai_json['chat_id']}:latest_ai_json"
    try:
        r.set(key, json.dumps(ai_json, ensure_ascii=False))
    except Exception as e:
        print(f"Redis error save_ai_response_json: {e}")

def get_latest_user_json(chat_id: str) -> Optional[Dict[str, Any]]:
    """خواندن آخرین JSON پیام کاربر."""
    key = f"chat:{chat_id}:latest_user_json"
    raw = r.get(key)
    return json.loads(raw) if raw else None

def get_latest_ai_json(chat_id: str) -> Optional[Dict[str, Any]]:
    """خواندن آخرین JSON پاسخ AI."""
    key = f"chat:{chat_id}:latest_ai_json"
    raw = r.get(key)
    return json.loads(raw) if raw else None
