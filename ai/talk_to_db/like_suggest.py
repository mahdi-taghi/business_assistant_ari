# =========================
# File: talk_to_db/like_suggest.py
# =========================

from __future__ import annotations
import re
from typing import List, Optional
from .config_logging import logger


def _make_like_pattern(value: str) -> str:
    if "%" in value or "_" in value:
        return value
    words = value.strip().split()
    return "%" + "%".join(words) + "%"


def _extract_field_and_value(q: str):
    m = re.search(r"(customs_name|country|country_name)\s*=\s*'([^']+)'", q, flags=re.IGNORECASE)
    if m:
        return m.group(1), m.group(2)
    m = re.search(r"(customs_name|country|country_name)\s*ILIKE\s*'([^']+)'", q, flags=re.IGNORECASE)
    if m:
        return m.group(1), m.group(2)
    return None


def suggest_like_matches(query: str, conn, limit: int = 100) -> Optional[list]:
    found = _extract_field_and_value(query)
    if not found:
        logger.debug("suggest_like_matches: no suitable field/value found.")
        return None
    field, value = found
    pattern = _make_like_pattern(value)
    sql = f"""
        SELECT DISTINCT {field}
        FROM final_true
        WHERE {field} ILIKE %s
        ORDER BY {field}
        LIMIT %s;
    """
    try:
        with conn.cursor() as cur:
            logger.debug(
                "suggest_like_matches SQL:\n%s\npattern=%r, limit=%s",
                sql.strip(), pattern, limit,
            )
            cur.execute(sql, (pattern, limit))
            rows = cur.fetchall()
        options = [r[0] for r in rows]
        logger.info("suggest_like_matches: found %d options for %r.", len(options), field)
        return options
    except Exception:
        logger.exception("suggest_like_matches failed.")
        return None


def run_query_with_like(query: str, conn):
    return suggest_like_matches(query, conn)

__all__ = ["run_query_with_like", "suggest_like_matches"]