# =========================
# File: talk_to_db/like_suggest.py
# =========================

from __future__ import annotations
import re
from typing import Optional, List

# Matches cases where the field appears inside an expression and is compared with = or ILIKE:
# e.g., "TRIM(REPLACE(customs_name,'گمرک','')) = 'فرودگاه امام خمینی'"
# or    "country ILIKE '%امارات%'"
# Captures:
#   group(1): field name (customs_name|country|country_name)
#   group(2): the quoted value (without the quotes)
_FIELD_COMPARE_RE = re.compile(
    r"(?:\b|_)(customs_name|country|country_name)\b[\s\S]*?(?:=|ILIKE)\s*'([^']+)'",
    flags=re.IGNORECASE,
)


def _make_like_pattern(value: str) -> str:
    """
    Turn a plain value into a fuzzy %...% pattern across words.
    If the value already contains wildcard characters, leave it as-is.
    """
    if "%" in value or "_" in value:
        return value
    words = value.strip().split()
    return "%" + "%".join(words) + "%"


def _extract_field_and_value(q: str):
    """
    Extract (field, value) from a SQL WHERE fragment that compares the field
    (possibly inside functions) to a quoted value using '=' or 'ILIKE'.
    Returns None if not found.
    """
    m = _FIELD_COMPARE_RE.search(q)
    if m:
        field = m.group(1)
        value = m.group(2)
        return field, value
    return None


def suggest_like_matches(query: str, conn, limit: int = 100) -> Optional[List[str]]:
    """
    If the query contains a comparison on customs_name/country/country_name,
    suggest DISTINCT matches using ILIKE with a fuzzy pattern derived from the value.
    Returns a list of options or None if nothing is detected / an error occurs.
    """
    found = _extract_field_and_value(query)
    if not found:
        return None

    field, value = found
    # Safety: field is constrained by the regex to the allowed set
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
            cur.execute(sql, (pattern, limit))
            rows = cur.fetchall()
        options = [r[0] for r in rows]
        return options
    except Exception:
        return None


def run_query_with_like(query: str, conn):
    return suggest_like_matches(query, conn)


__all__ = ["run_query_with_like", "suggest_like_matches"]
