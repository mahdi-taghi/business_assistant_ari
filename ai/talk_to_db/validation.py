# =========================
# File: talk_to_db/validation.py
# =========================

from __future__ import annotations
import re
from typing import List
from .config_logging import logger

_SAFE_START = re.compile(r"^\s*(?:with\b[\s\S]*?select\b|select\b)", re.IGNORECASE)
_DANGEROUS_ANYWHERE = re.compile(
    r"\b("
    r"delete|drop|truncate|update|insert|alter|create|replace|"
    r"execute|exec|merge|call|grant|revoke|vacuum|analyze|"
    r"refresh\s+materialized\s+view|lock|cluster|listen|unlisten|notify|"
    r"do|security\s+definer|set|reset|begin|commit|rollback|savepoint|"
    r"pg_read_file|pg_ls_dir|pg_stat_file|lo_import|lo_export"
    r")\b",
    re.IGNORECASE,
)
_PG_SLEEP = re.compile(r"\bpg_sleep\s*\(", re.IGNORECASE)
_COPY_PROGRAM = re.compile(r"\bcopy\b[\s\S]*\b(program|stdin|stdout)\b", re.IGNORECASE)


def _split_statements(sql: str) -> List[str]:
    s = sql
    stmts, cur, i, n = [], [], 0, len(s)
    in_sq = in_dq = in_dollar = False
    dollar_tag = None
    escape = False

    while i < n:
        ch = s[i]
        if in_sq:
            cur.append(ch)
            if ch == "'" and not escape:
                in_sq = False
            if ch == "\\" and not escape:
                escape = True
            else:
                escape = False
            i += 1
            continue
        if in_dq:
            cur.append(ch)
            if ch == '"' and not escape:
                in_dq = False
            if ch == "\\" and not escape:
                escape = True
            else:
                escape = False
            i += 1
            continue
        if in_dollar:
            cur.append(ch)
            if ch == '$' and s[i - len(dollar_tag) + 1 : i + 1] == dollar_tag:
                in_dollar = False
                dollar_tag = None
            i += 1
            continue
        if ch == "'":
            cur.append(ch)
            in_sq = True
            i += 1
            continue
        if ch == '"':
            cur.append(ch)
            in_dq = True
            i += 1
            continue
        if ch == '$':
            m = re.match(r"\$[A-Za-z0-9_]*\$", s[i:])
            if m:
                tag = m.group(0)
                cur.append(tag)
                in_dollar = True
                dollar_tag = tag
                i += len(tag)
                continue
            else:
                cur.append(ch)
                i += 1
                continue
        if ch == ';':
            stmt = ''.join(cur).strip()
            if stmt:
                stmts.append(stmt)
            cur = []
            i += 1
            continue
        cur.append(ch)
        i += 1
    last = ''.join(cur).strip()
    if last:
        stmts.append(last)
    return stmts


def validate_query(query: str, max_statements: int = 10) -> bool:
    if not isinstance(query, str):
        logger.warning("validate_query: query is not a string.")
        return False
    q = query.strip()
    if not q:
        logger.warning("validate_query: empty query.")
        return False
    try:
        stmts = _split_statements(q)
    except Exception:
        logger.exception("validate_query: failed to split statements.")
        return False
    if not stmts:
        logger.warning("validate_query: no statements after split.")
        return False
    if len(stmts) > max_statements:
        logger.warning("validate_query: too many statements (%d) > %d.", len(stmts), max_statements)
        return False
    for s in stmts:
        s_stripped = s.strip()
        if not _SAFE_START.match(s_stripped):
            logger.warning("validate_query: statement does not start with SELECT/WITH.")
            return False
        if re.match(r"^\s*with\b", s_stripped, re.IGNORECASE):
            prefix_before_first_select = re.split(r"\bselect\b", s_stripped, 1, flags=re.IGNORECASE)[0]
            if re.search(r"\b(insert|update|delete|merge|alter|create|drop|truncate|replace|execute|exec|call)\b", prefix_before_first_select, re.IGNORECASE):
                logger.warning("validate_query: WITH clause contains DML/DDL.")
                return False
        if _DANGEROUS_ANYWHERE.search(s_stripped):
            logger.warning("validate_query: dangerous keyword found.")
            return False
        if _PG_SLEEP.search(s_stripped):
            logger.warning("validate_query: pg_sleep detected.")
            return False
        if _COPY_PROGRAM.search(s_stripped):
            logger.warning("validate_query: COPY PROGRAM/STDIN/STDOUT detected.")
            return False
    logger.debug("validate_query: query is safe.")
    return True

__all__ = ["validate_query"]