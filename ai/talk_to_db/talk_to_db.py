# =========================
# File: talk_to_db/talk_to_db.py
# =========================

from __future__ import annotations
import json, time
from typing import Optional
from dotenv import load_dotenv
from .config_logging import logger
from .llm import question_to_query, query_to_result
from .validation import validate_query
from .db import connect_to_db, execute_query
from .like_suggest import run_query_with_like, _make_like_pattern, _extract_field_and_value

# External utilities (unchanged imports, expected to exist in project)
from redis_utils import (
    health as redis_health_check,
    now_iso,
    push_last_twenty_message,
    get_last_twenty_messages,
    save_user_message_json,
    save_ai_response_json,
)

load_dotenv()


def talk_to_db(
    question: str,
    user_id: str,
    user_role: str,
    chat_id: str,
    is_first_message: bool,
    verbose: bool = False,
) -> str:
    conn = None
    cur = None
    try:
        # 0) Redis health check (optional)
        if not redis_health_check():
            msg = "⚠️ اتصال به Redis مشکل دارد (ping ناموفق)."
            logger.warning(msg)
            if verbose:
                logger.debug("Verbose mode: reporting Redis health issue.")

        # 1) Update history & store user JSON
        push_last_twenty_message(chat_id, "user", question)
        last_twenty = get_last_twenty_messages(chat_id)
        last_twenty_str = json.dumps(last_twenty, ensure_ascii=False)

        user_json = {
            "user_id": str(user_id),
            "user_role": user_role,
            "message_role": "user",
            "chat_id": str(chat_id),
            "content": question,
            "is_first_message": "1" if is_first_message else "0",
            "timestamp": now_iso(),
            "last_twenty_messages": last_twenty_str,
        }
        save_user_message_json(user_json)
        logger.info(f"User message stored. chat_id={chat_id}, user_id={user_id}")
        logger.debug(f"User message content: {question!r}")

        # 2) Generate SQL
        query = question_to_query(question)
        if isinstance(query, tuple):
            query, *_ = query

        if not validate_query(query):
            logger.warning(f"Unsafe/invalid query rejected:\n{query}")
            return "درخواست نامعتبر است."

        if verbose:
            logger.info("Generated Query (verbose on):\n" + query)

        # 3) Execute query
        conn, cur = connect_to_db()
        if not cur or not conn:
            logger.error("Unable to obtain DB connection/cursor.")
            return "عدم امکان اتصال به پایگاه داده."

        results, columns = execute_query(query, cur)
        if not results:
            logger.info("Query executed: no rows returned.")
        else:
            logger.info(f"Query executed: {len(results)} rows returned.")

        # Optional pretty table (DEBUG only)
        if verbose and results:
            try:
                col_widths = [max(len(str(col)), max(len(str(row[i])) for row in results)) for i, col in enumerate(columns)]
                header = " | ".join(col.ljust(col_widths[i]) for i, col in enumerate(columns))
                sep = "-+-".join("-" * col_widths[i] for i in range(len(columns)))
                rows_str = "\n".join(
                    " | ".join(str(row[i]).ljust(col_widths[i]) for i in range(len(columns)))
                    for row in results
                )
                logger.debug("Result table preview:\n%s\n%s\n%s\n", header, sep, rows_str)
            except Exception:
                logger.exception("Failed to render verbose table preview.")

        # 4) Check if original query returned results
        if not results:
            logger.info("Original query returned no results.")
            # Check for LIKE suggestions
            options = run_query_with_like(query, conn)
            
            if options is not None and isinstance(options, list) and len(options) > 0:
                if len(options) == 1:
                    # Exactly one suggestion - execute it
                    suggestion = options[0]
                    confirmation_question = f"آیا منظور شما {suggestion} بود؟"
                    logger.info(f"Single suggestion found: {suggestion}")
                    
                    # Extract field and value from original query
                    found = _extract_field_and_value(query)
                    if found:
                        field, value = found
                        pattern = _make_like_pattern(suggestion)
                        
                        # Modify the original query to use LIKE instead of exact match
                        modified_query = query.replace(f"{field} = '{value}'", f"{field} ILIKE %s")
                        modified_query = modified_query.replace(f"{field} ILIKE '{value}'", f"{field} ILIKE %s")
                        
                        try:
                            logger.info("Executing modified query with LIKE pattern.")
                            logger.debug(f"Modified query: {modified_query}")
                            cur.execute(modified_query, (pattern,))
                            suggestion_results = cur.fetchall()
                            
                            # Get column names
                            suggestion_columns = [desc[0] for desc in cur.description]
                            
                            if suggestion_results:
                                logger.info(f"Suggestion query executed: {len(suggestion_results)} rows returned.")
                                # Convert suggestion result to Persian answer using second LLM
                                suggestion_answer = query_to_result(suggestion_results, suggestion_columns, suggestion)
                                if isinstance(suggestion_answer, tuple):
                                    suggestion_answer, *_ = suggestion_answer
                                
                                # Set final_text to the suggestion result
                                final_text = suggestion_answer
                                logger.info("Final answer replaced with suggestion result.")
                            else:
                                logger.info("Suggestion query executed: no rows returned.")
                                final_text = f"{confirmation_question}\n\nمتأسفانه برای این پیشنهاد داده‌ای یافت نشد."
                        except Exception as e:
                            logger.exception("Failed to execute suggestion LIKE query.")
                            final_text = f"{confirmation_question}\n\nخطا در اجرای درخواست پیشنهادی: {str(e)}"
                    else:
                        logger.warning("Could not extract field and value from original query for suggestion.")
                        final_text = f"{confirmation_question}\n\nنمی‌توان درخواست پیشنهادی را پردازش کرد."
                else:
                    # Multiple suggestions - show them
                    suggest_header = "در پایگاه داده این ها را نیز یافتیم، ممکن است مفید باشد و یا بخواید سوال خود را دقیق کنید"
                    suggestion_lines = "\n".join(f"- {o}" for o in options)
                    final_text = suggest_header + "\n" + suggestion_lines
                    logger.info("Multiple suggestions found and displayed.")
            else:
                # No suggestions available
                final_text = """هیچ رکوردی پیدا نشد.
پیشنهاد‌ها:
۱- بازه زمانی را تغییر دهید
۲- فیلتر‌های موجود را ویرایش/حذف کنید
۳- ممکن است اشتباه تایپی داشته باشید

یک سوال نمونه:
۱۰ کالای با ارزش دلاری بالا که از امارات در ماه فروردین ۴۰۴ چه کالاهایی وارد شده‌اند؟"""
                logger.info("No results found and no suggestions available.")
        else:
            # Original query returned results - process normally with second LLM
            t0 = time.time()
            final_answer = query_to_result(results, columns, question)
            if isinstance(final_answer, tuple):
                final_text, a_tokens, a_model = final_answer
            else:
                final_text, a_tokens, a_model = final_answer, None, "gpt-5-mini"
            dt = time.time() - t0

            logger.info(f"Answer generated in {round(dt, 3)}s using model={a_model}.")
            logger.debug(f"Final answer (first 300 chars): {final_text[:300]!r}")

        # 5) Save AI response JSON
        ai_json = {
            "user_id": str(user_id),
            "chat_id": str(chat_id),
            "content": final_text,
            "ai_response_metadata": json.dumps(
                {
                    "model": "gpt-5-mini",
                    "processing_time": "0s",
                    "suggested_title": "عنوان پیشنهادی",
                },
                ensure_ascii=False,
            ),
            "ai_references": json.dumps([{"title": "سورس نمونه"}], ensure_ascii=False),
            "tokens_used": "",
            "response_time": now_iso(),
            "timestamp": now_iso(),
        }
        save_ai_response_json(ai_json)
        logger.info("AI response saved to Redis.")

        # 6) Update history with assistant message
        push_last_twenty_message(chat_id, "assistant", final_text)
        logger.debug("Chat history updated with assistant message.")

        return final_text

    except Exception as e:
        logger.exception("Unhandled error in talk_to_db flow.")
        return f"خطا در اجرای درخواست: {str(e)}"
    finally:
        try:
            if cur:
                cur.close()
                logger.debug("Database cursor closed.")
        except Exception:
            logger.exception("Failed closing DB cursor.")
        try:
            if conn:
                conn.close()
                logger.debug("Database connection closed.")
        except Exception:
            logger.exception("Failed closing DB connection.")


if __name__ == "__main__":
    # هلت‌چک Redis
    try:
        if not redis_health_check():
            logger.warning("⚠️ اتصال به Redis مشکل دارد.")
        else:
            logger.info("Redis health check passed.")
    except Exception:
        logger.exception("Redis health check raised an exception.")
