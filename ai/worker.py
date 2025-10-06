# v1/ai/worker.py
import os 
from dotenv import load_dotenv # <-- جدید: برای خواندن متغیرها از .env
load_dotenv()                   # <-- جدید: متغیرهای محیطی را بارگذاری می‌کند

import json, asyncio, time
import redis.asyncio as redis

# از test.py خودت، talk_to_db رو می‌آریم
from talk_to_db import talk_to_db

REDIS_URL = os.getenv("REDIS_URL", "redis://redis_chat:6379/0")
CHAT_STREAM_KEY = os.getenv("CHAT_STREAM_KEY", "chat_stream") 
RESPONSE_STREAM_KEY = os.getenv("RESPONSE_STREAM_KEY", "response_stream") 
async def main():
    r = redis.from_url(REDIS_URL, decode_responses=True)
    last_id = "0-0"   # اگر می‌خوای فقط پیام‌های جدید رو بگیری، "$" بذار

    print(f"[ai_worker] listening: {CHAT_STREAM_KEY} -> {RESPONSE_STREAM_KEY}")
    while True:
        try:
            resp = await r.xread({CHAT_STREAM_KEY: last_id}, count=1, block=15000)
            if not resp:
                continue

            _, messages = resp[0]
            entry_id, fields = messages[0]
            last_id = entry_id

            # فیلدهایی که Consumer می‌فرسته (create_message_data) را بخوان
            user_id = fields.get("user_id")
            user_role = fields.get("user_role", "public")
            message_role = fields.get("message_role")  # معمولا 'user'
            chat_id = fields.get("chat_id")
            content = fields.get("content", "")
            is_first = fields.get("is_first_message", "0") in ("1", "true", "True")
            message_id = fields.get("message_id")  # خیلی مهم برای مچ کردن پاسخ

            # اگر ورودی کافی نیست، بی‌خیال این درخواست شو
            if not content or not chat_id or not user_id or not message_id:
                # می‌تونی یه پیام خطا تو پاسخ‌ها بذاری، ولی فعلاً رد می‌کنیم
                continue

            t0 = time.perf_counter()
            # از مغز خودت استفاده کن: سوال -> SQL -> DB -> متن نهایی
            final_text = talk_to_db(
                question=content,
                user_id=str(user_id),
                user_role=str(user_role),
                chat_id=str(chat_id),
                is_first_message=is_first,
                verbose=False
            )
            dt = time.perf_counter() - t0

            # پاسخ را در استریم پاسخ‌ها بذار (کلیدها دقیقا مطابق انتظار consumer.process_ai_response)
            await r.xadd(RESPONSE_STREAM_KEY, {
                "chat_id": str(chat_id),
                "user_id": str(user_id),
                "message_id": str(message_id),  # کليدی برای match
                "content": final_text,
                # این دو تا باید رشته باشن (consumer شما json.loads می‌کند)
                "ai_response_metadata": json.dumps({
                    "model": "gpt-5-mini",
                    "processing_time": f"{dt:.3f}s",
                    "suggested_title": (final_text or "")[:40]
                }, ensure_ascii=False),
                "ai_references": json.dumps([], ensure_ascii=False),
                "tokens_used": "0",          # اگر داشتی، مقدار بده
                "response_time": f"{dt:.3f}" # یا timestamp، هر چی team شما می‌خواد
            })

        except Exception as e:
            print("[ai_worker] error:", e)
            await asyncio.sleep(1)

if __name__ == "__main__":
    asyncio.run(main())
# v1/ai/worker.py
import os, json, asyncio, time
import redis.asyncio as redis

# از test.py خودت، talk_to_db رو می‌آریم
from test import talk_to_db

REDIS_URL = os.getenv("REDIS_URL", "redis://redis_chat:6379/0")  # داخل داکر: redis_chat
CHAT_STREAM_KEY = os.getenv("CHAT_STREAM_KEY", "chat:requests")
RESPONSE_STREAM_KEY = os.getenv("RESPONSE_STREAM_KEY", "chat:responses")

async def main():
    r = redis.from_url(REDIS_URL, decode_responses=True)
    last_id = "0-0"   # اگر می‌خوای فقط پیام‌های جدید رو بگیری، "$" بذار

    print(f"[ai_worker] listening: {CHAT_STREAM_KEY} -> {RESPONSE_STREAM_KEY}")
    while True:
        try:
            resp = await r.xread({CHAT_STREAM_KEY: last_id}, count=1, block=15000)
            if not resp:
                continue

            _, messages = resp[0]
            entry_id, fields = messages[0]
            last_id = entry_id

            # فیلدهایی که Consumer می‌فرسته (create_message_data) را بخوان
            user_id = fields.get("user_id")
            user_role = fields.get("user_role", "public")
            message_role = fields.get("message_role")  # معمولا 'user'
            chat_id = fields.get("chat_id")
            content = fields.get("content", "")
            is_first = fields.get("is_first_message", "0") in ("1", "true", "True")
            message_id = fields.get("message_id")  # خیلی مهم برای مچ کردن پاسخ

            # اگر ورودی کافی نیست، بی‌خیال این درخواست شو
            if not content or not chat_id or not user_id or not message_id:
                # می‌تونی یه پیام خطا تو پاسخ‌ها بذاری، ولی فعلاً رد می‌کنیم
                continue

            t0 = time.perf_counter()
            # از مغز خودت استفاده کن: سوال -> SQL -> DB -> متن نهایی
            final_text = talk_to_db(
                question=content,
                user_id=str(user_id),
                user_role=str(user_role),
                chat_id=str(chat_id),
                is_first_message=is_first,
                verbose=False
            )
            dt = time.perf_counter() - t0

            # پاسخ را در استریم پاسخ‌ها بذار (کلیدها دقیقا مطابق انتظار consumer.process_ai_response)
            await r.xadd(RESPONSE_STREAM_KEY, {
                "chat_id": str(chat_id),
                "user_id": str(user_id),
                "message_id": str(message_id),  # کليدی برای match
                "content": final_text,
                # این دو تا باید رشته باشن (consumer شما json.loads می‌کند)
                "ai_response_metadata": json.dumps({
                    "model": "gpt-5-mini",
                    "processing_time": f"{dt:.3f}s",
                    "suggested_title": (final_text or "")[:40]
                }, ensure_ascii=False),
                "ai_references": json.dumps([], ensure_ascii=False),
                "tokens_used": "",          # اگر داشتی، مقدار بده
                "response_time": f"{dt:.3f}" # یا timestamp، هر چی team شما می‌خواد
            })

        except Exception as e:
            print("[ai_worker] error:", e)
            await asyncio.sleep(1)

if __name__ == "__main__":
    asyncio.run(main())
# v1/ai/worker.py
import os, json, asyncio, time
import redis.asyncio as redis

# از test.py خودت، talk_to_db رو می‌آریم
from test import talk_to_db

REDIS_URL = os.getenv("REDIS_URL", "redis://redis_chat:6379/0")  # داخل داکر: redis_chat
CHAT_STREAM_KEY = os.getenv("CHAT_STREAM_KEY", "chat:requests")
RESPONSE_STREAM_KEY = os.getenv("RESPONSE_STREAM_KEY", "chat:responses")

async def main():
    r = redis.from_url(REDIS_URL, decode_responses=True)
    last_id = "0-0"   # اگر می‌خوای فقط پیام‌های جدید رو بگیری، "$" بذار

    print(f"[ai_worker] listening: {CHAT_STREAM_KEY} -> {RESPONSE_STREAM_KEY}")
    while True:
        try:
            resp = await r.xread({CHAT_STREAM_KEY: last_id}, count=1, block=15000)
            if not resp:
                continue

            _, messages = resp[0]
            entry_id, fields = messages[0]
            last_id = entry_id

            # فیلدهایی که Consumer می‌فرسته (create_message_data) را بخوان
            user_id = fields.get("user_id")
            user_role = fields.get("user_role", "public")
            message_role = fields.get("message_role")  # معمولا 'user'
            chat_id = fields.get("chat_id")
            content = fields.get("content", "")
            is_first = fields.get("is_first_message", "0") in ("1", "true", "True")
            message_id = fields.get("message_id")  # خیلی مهم برای مچ کردن پاسخ

            # اگر ورودی کافی نیست، بی‌خیال این درخواست شو
            if not content or not chat_id or not user_id or not message_id:
                # می‌تونی یه پیام خطا تو پاسخ‌ها بذاری، ولی فعلاً رد می‌کنیم
                continue

            t0 = time.perf_counter()
            # از مغز خودت استفاده کن: سوال -> SQL -> DB -> متن نهایی
            final_text = talk_to_db(
                question=content,
                user_id=str(user_id),
                user_role=str(user_role),
                chat_id=str(chat_id),
                is_first_message=is_first,
                verbose=False
            )
            dt = time.perf_counter() - t0

            # پاسخ را در استریم پاسخ‌ها بذار (کلیدها دقیقا مطابق انتظار consumer.process_ai_response)
            await r.xadd(RESPONSE_STREAM_KEY, {
                "chat_id": str(chat_id),
                "user_id": str(user_id),
                "message_id": str(message_id),  # کليدی برای match
                "content": final_text,
                # این دو تا باید رشته باشن (consumer شما json.loads می‌کند)
                "ai_response_metadata": json.dumps({
                    "model": "gpt-5-mini",
                    "processing_time": f"{dt:.3f}s",
                    "suggested_title": (final_text or "")[:40]
                }, ensure_ascii=False),
                "ai_references": json.dumps([], ensure_ascii=False),
                "tokens_used": "",          # اگر داشتی، مقدار بده
                "response_time": f"{dt:.3f}" # یا timestamp، هر چی team شما می‌خواد
            })

        except Exception as e:
            print("[ai_worker] error:", e)
            await asyncio.sleep(1)

if __name__ == "__main__":
    asyncio.run(main())
# v1/ai/worker.py
import os, json, asyncio, time
import redis.asyncio as redis

# از test.py خودت، talk_to_db رو می‌آریم
from test import talk_to_db

REDIS_URL = os.getenv("REDIS_URL", "redis://redis_chat:6379/0")  # داخل داکر: redis_chat
CHAT_STREAM_KEY = os.getenv("CHAT_STREAM_KEY", "chat:requests")
RESPONSE_STREAM_KEY = os.getenv("RESPONSE_STREAM_KEY", "chat:responses")

async def main():
    r = redis.from_url(REDIS_URL, decode_responses=True)
    last_id = "0-0"   # اگر می‌خوای فقط پیام‌های جدید رو بگیری، "$" بذار

    print(f"[ai_worker] listening: {CHAT_STREAM_KEY} -> {RESPONSE_STREAM_KEY}")
    while True:
        try:
            resp = await r.xread({CHAT_STREAM_KEY: last_id}, count=1, block=15000)
            if not resp:
                continue

            _, messages = resp[0]
            entry_id, fields = messages[0]
            last_id = entry_id

            # فیلدهایی که Consumer می‌فرسته (create_message_data) را بخوان
            user_id = fields.get("user_id")
            user_role = fields.get("user_role", "public")
            message_role = fields.get("message_role")  # معمولا 'user'
            chat_id = fields.get("chat_id")
            content = fields.get("content", "")
            is_first = fields.get("is_first_message", "0") in ("1", "true", "True")
            message_id = fields.get("message_id")  # خیلی مهم برای مچ کردن پاسخ

            # اگر ورودی کافی نیست، بی‌خیال این درخواست شو
            if not content or not chat_id or not user_id or not message_id:
                # می‌تونی یه پیام خطا تو پاسخ‌ها بذاری، ولی فعلاً رد می‌کنیم
                continue

            t0 = time.perf_counter()
            # از مغز خودت استفاده کن: سوال -> SQL -> DB -> متن نهایی
            final_text = talk_to_db(
                question=content,
                user_id=str(user_id),
                user_role=str(user_role),
                chat_id=str(chat_id),
                is_first_message=is_first,
                verbose=False
            )
            dt = time.perf_counter() - t0

            # پاسخ را در استریم پاسخ‌ها بذار (کلیدها دقیقا مطابق انتظار consumer.process_ai_response)
            await r.xadd(RESPONSE_STREAM_KEY, {
                "chat_id": str(chat_id),
                "user_id": str(user_id),
                "message_id": str(message_id),  # کليدی برای match
                "content": final_text,
                # این دو تا باید رشته باشن (consumer شما json.loads می‌کند)
                "ai_response_metadata": json.dumps({
                    "model": "gpt-5-mini",
                    "processing_time": f"{dt:.3f}s",
                    "suggested_title": (final_text or "")[:40]
                }, ensure_ascii=False),
                "ai_references": json.dumps([], ensure_ascii=False),
                "tokens_used": "",          # اگر داشتی، مقدار بده
                "response_time": f"{dt:.3f}" # یا timestamp، هر چی team شما می‌خواد
            })

        except Exception as e:
            print("[ai_worker] error:", e)
            await asyncio.sleep(1)

if __name__ == "__main__":
    asyncio.run(main())
# v1/ai/worker.py
import os, json, asyncio, time
import redis.asyncio as redis

# از test.py خودت، talk_to_db رو می‌آریم
from test import talk_to_db

REDIS_URL = os.getenv("REDIS_URL", "redis://redis_chat:6379/0")  # داخل داکر: redis_chat
CHAT_STREAM_KEY = os.getenv("CHAT_STREAM_KEY", "chat:requests")
RESPONSE_STREAM_KEY = os.getenv("RESPONSE_STREAM_KEY", "chat:responses")

async def main():
    r = redis.from_url(REDIS_URL, decode_responses=True)
    last_id = "0-0"   # اگر می‌خوای فقط پیام‌های جدید رو بگیری، "$" بذار

    print(f"[ai_worker] listening: {CHAT_STREAM_KEY} -> {RESPONSE_STREAM_KEY}")
    while True:
        try:
            resp = await r.xread({CHAT_STREAM_KEY: last_id}, count=1, block=15000)
            if not resp:
                continue

            _, messages = resp[0]
            entry_id, fields = messages[0]
            last_id = entry_id

            # فیلدهایی که Consumer می‌فرسته (create_message_data) را بخوان
            user_id = fields.get("user_id")
            user_role = fields.get("user_role", "public")
            message_role = fields.get("message_role")  # معمولا 'user'
            chat_id = fields.get("chat_id")
            content = fields.get("content", "")
            is_first = fields.get("is_first_message", "0") in ("1", "true", "True")
            message_id = fields.get("message_id")  # خیلی مهم برای مچ کردن پاسخ

            # اگر ورودی کافی نیست، بی‌خیال این درخواست شو
            if not content or not chat_id or not user_id or not message_id:
                # می‌تونی یه پیام خطا تو پاسخ‌ها بذاری، ولی فعلاً رد می‌کنیم
                continue

            t0 = time.perf_counter()
            # از مغز خودت استفاده کن: سوال -> SQL -> DB -> متن نهایی
            final_text = talk_to_db(
                question=content,
                user_id=str(user_id),
                user_role=str(user_role),
                chat_id=str(chat_id),
                is_first_message=is_first,
                verbose=False
            )
            dt = time.perf_counter() - t0

            # پاسخ را در استریم پاسخ‌ها بذار (کلیدها دقیقا مطابق انتظار consumer.process_ai_response)
            await r.xadd(RESPONSE_STREAM_KEY, {
                "chat_id": str(chat_id),
                "user_id": str(user_id),
                "message_id": str(message_id),  # کليدی برای match
                "content": final_text,
                # این دو تا باید رشته باشن (consumer شما json.loads می‌کند)
                "ai_response_metadata": json.dumps({
                    "model": "gpt-5-mini",
                    "processing_time": f"{dt:.3f}s",
                    "suggested_title": (final_text or "")[:40]
                }, ensure_ascii=False),
                "ai_references": json.dumps([], ensure_ascii=False),
                "tokens_used": "",          # اگر داشتی، مقدار بده
                "response_time": f"{dt:.3f}" # یا timestamp، هر چی team شما می‌خواد
            })

        except Exception as e:
            print("[ai_worker] error:", e)
            await asyncio.sleep(1)

if __name__ == "__main__":
    asyncio.run(main())
