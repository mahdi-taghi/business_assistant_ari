# =========================
# File: talk_to_db/utils.py
# =========================

from __future__ import annotations

def truncate_for_log(text: object, limit: int = 4000) -> str:
    try:
        if text is None:
            return ""
        s = str(text)
        return s if len(s) <= limit else s[:limit] + f"... [truncated {len(s)-limit} chars]"
    except Exception:
        return "<unrenderable>"

__all__ = ["truncate_for_log"]