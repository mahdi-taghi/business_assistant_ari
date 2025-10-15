# v1/ai/worker.py
import os
import json
import asyncio
import time
import logging
from logging.config import dictConfig

from dotenv import load_dotenv
load_dotenv()

import redis.asyncio as redis
from talk_to_db import talk_to_db

# =========================
# Logging configuration
# =========================
def setup_logging():
    log_level = os.getenv("LOG_LEVEL", "INFO").upper()
    log_format = os.getenv("LOG_FORMAT", "text").lower()  # "json" or "text"

    # File logging toggles
    log_to_file = os.getenv("LOG_TO_FILE", "true").lower() == "true"
    log_file_path = os.getenv("LOG_FILE_PATH", "logs/ai_worker.log")
    log_max_bytes = int(os.getenv("LOG_MAX_BYTES", str(5 * 1024 * 1024)))  # 5 MB
    log_backup_count = int(os.getenv("LOG_BACKUP_COUNT", "3"))

    # Ensure folder exists if writing to file
    if log_to_file:
        os.makedirs(os.path.dirname(log_file_path), exist_ok=True)

    base_config = {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "text": {
                "format": "%(asctime)s %(levelname)s %(name)s "
                          "[%(filename)s:%(lineno)d] %(message)s"
            },
            "json": {
                "format": '{"ts":"%(asctime)s","level":"%(levelname)s",'
                          '"logger":"%(name)s","file":"%(filename)s","line":%(lineno)d,'
                          '"msg":%(message)s}'
            },
        },
        "handlers": {
            "console": {
                "class": "logging.StreamHandler",
                "level": log_level,
                "formatter": "json" if log_format == "json" else "text",
            },
        },
        "loggers": {
            "": {"handlers": ["console"], "level": log_level},           # root
            "ai_worker": {"handlers": ["console"], "level": log_level},  # our module logger
        },
    }

    if log_to_file:
        # Rotating file handler
        base_config["handlers"]["file"] = {
            "class": "logging.handlers.RotatingFileHandler",
            "filename": log_file_path,
            "maxBytes": log_max_bytes,
            "backupCount": log_backup_count,
            "level": log_level,
            "encoding": "utf-8",
            "formatter": "text" if log_format != "json" else "json",
        }
        # Attach to both root and module loggers (so everything goes to file too)
        base_config["loggers"][""]["handlers"].append("file")
        base_config["loggers"]["ai_worker"]["handlers"].append("file")

    dictConfig(base_config)

setup_logging()
logger = logging.getLogger("ai_worker")

# =========================
# Env / streams
# =========================
REDIS_URL = os.getenv("REDIS_URL")
CHAT_STREAM_KEY = os.getenv("CHAT_STREAM_KEY")
RESPONSE_STREAM_KEY = os.getenv("RESPONSE_STREAM_KEY")
# Consume only new messages by default
DEFAULT_LAST_ID = os.getenv("STREAM_LAST_ID", "$")

# Optional: heartbeat for idle loops (seconds). "0" disables.
HEARTBEAT_SEC = int(os.getenv("LOG_HEARTBEAT_SEC", "60"))
_last_heartbeat = 0.0


async def main():
    # Connect to Redis (avoid logging secrets)
    r = redis.from_url(REDIS_URL, decode_responses=True)

    last_id = DEFAULT_LAST_ID
    logger.info("Starting AI worker")
    logger.info(f"Listening streams: {CHAT_STREAM_KEY} -> {RESPONSE_STREAM_KEY}; last_id={last_id}")

    global _last_heartbeat
    _last_heartbeat = time.time()

    while True:
        try:
            resp = await r.xread({CHAT_STREAM_KEY: last_id}, count=1, block=15000)

            # Heartbeat when idle
            now = time.time()
            if not resp:
                if HEARTBEAT_SEC > 0 and (now - _last_heartbeat) >= HEARTBEAT_SEC:
                    logger.info("Idle heartbeat: no messages")
                    _last_heartbeat = now
                continue

            # Unpack message
            stream_name, messages = resp[0]
            entry_id, fields = messages[0]
            last_id = entry_id  # advance cursor

            # Extract fields (keep logs safe/minimal)
            user_id = fields.get("user_id")
            user_role = fields.get("user_role", "public")
            message_role = fields.get("message_role")  # usually 'user'
            chat_id = fields.get("chat_id")
            content = fields.get("content", "")
            is_first = fields.get("is_first_message", "0") in ("1", "true", "True")
            message_id = fields.get("message_id")

            logger.info("Received message")

            # Validate minimal inputs
            if not content or not chat_id or not user_id or not message_id:
                logger.warning("Skipping invalid message: missing required fields")
                continue

            # Process
            t0 = time.perf_counter()
            content_preview = content[:80].replace("\n", " ")
            logger.debug(f"Processing question (preview='{content_preview}', len={len(content)})")

            final_text = talk_to_db(
                question=content,
                user_id=str(user_id),
                user_role=str(user_role),
                chat_id=str(chat_id),
                is_first_message=is_first
            )
            dt = time.perf_counter() - t0

            # Prepare metadata
            metadata = {
                "model": "gpt-5-mini",
                "processing_time": f"{dt:.3f}s",
                "suggested_title": (final_text or "")[:40],
            }

            # Publish response
            await r.xadd(RESPONSE_STREAM_KEY, {
                "chat_id": str(chat_id),
                "user_id": str(user_id),
                "message_id": str(message_id),  # to match on the consumer side
                "content": final_text,
                "ai_response_metadata": json.dumps(metadata, ensure_ascii=False),
                "ai_references": json.dumps([], ensure_ascii=False),
                "tokens_used": "0",
                "response_time": f"{dt:.3f}",
            })

            logger.info("Published response")

        except Exception:
            logger.exception("Worker error")
            await asyncio.sleep(1)


if __name__ == "__main__":
    asyncio.run(main())
