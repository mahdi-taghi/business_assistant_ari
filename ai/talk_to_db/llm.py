# =========================
# File: talk_to_db/llm.py
# =========================

from __future__ import annotations
import time, json
from dotenv import load_dotenv
from openai import OpenAI
from .config_logging import logger
from .prompts import SYSTEM_PROMPT_SQL, SYSTEM_PROMPT_SQL_TO_TEXT
from .utils import truncate_for_log

load_dotenv()

# Instantiate OpenAI client once per process
try:
    client = OpenAI()
    logger.debug("OpenAI client instantiated.")
except Exception:
    logger.exception("Failed to instantiate OpenAI client.")


def question_to_query(question: str) -> str:
    logger.info("User question: %s", truncate_for_log(question, 2000))
    logger.debug("Generating SQL from question via OpenAI.")
    response = client.chat.completions.create(
        model="gpt-5",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT_SQL},
            {"role": "user", "content": question},
        ],
    )
    sql = response.choices[0].message.content
    logger.info("Generated SQL:\n%s", truncate_for_log(sql, 4000))
    logger.debug("Model produced SQL (raw):\n%s", truncate_for_log(sql, 10000))
    return sql


def _rows_to_json_sample(results: list, columns: list, max_rows: int = 50) -> str:
    try:
        sample = results[:max_rows]
        rows_as_dict = [dict(zip(columns, [None if v is None else str(v) for v in row])) for row in sample]
        payload = json.dumps(rows_as_dict, ensure_ascii=False)
        if len(payload) > 10000:
            payload = payload[:10000] + "... [truncated]"
        return payload
    except Exception:
        logger.exception("Failed to serialize SQL results for logging.")
        return "[]"


def query_to_result(results: list, columns: list, user_question: str) -> str:
    # Build a flat table text like original logic
    def _fmt(v):
        if v is None:
            return ""
        return str(v).replace("\n", " ")
    header = " | ".join(columns)
    rows_text = []
    for r in results:
        rows_text.append(" | ".join(_fmt(c) for c in r))
    table_text = header + "\n" + ("\n".join(rows_text) if rows_text else "")

    user_payload = (
        f"سوال کاربر: '''{user_question}'''\n\n"
        f"نتایج جدول (ستون‌ها و ردیف‌ها):\n\n{table_text}\n\n"
        "با توجه به سوال کاربر و این داده‌ها، پاسخ فارسی، طبیعی و قابل فهم بنویس. فقط خروجی نهایی را بده."
    )

    # Log both inputs/outputs for the second LLM
    logger.info("Preparing input for second LLM (question + table).")
    logger.debug("Second LLM input (truncated):\n%s", truncate_for_log(user_payload, 8000))

    t0 = time.time()
    response = client.chat.completions.create(
        model="gpt-5-mini",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT_SQL_TO_TEXT},
            {"role": "user", "content": user_payload},
        ],
    )
    txt = response.choices[0].message.content
    dt = time.time() - t0
    logger.info("LLM text generation finished in %.3fs.", dt)
    logger.info("Second LLM output (brief): %s", truncate_for_log(txt, 500))
    logger.debug("Second LLM output (full/truncated):\n%s", truncate_for_log(txt, 12000))
    return txt

__all__ = ["question_to_query", "query_to_result"]