# =========================
# File: talk_to_db/db.py
# =========================

from __future__ import annotations
import os
import psycopg2
from typing import Tuple
from .config_logging import logger


def connect_to_db():
    """Connect to PostgreSQL database and return connection and cursor"""
    try:
        DATABASE_URL = os.getenv("DATABASE_URL")
        if not DATABASE_URL:
            raise RuntimeError("DATABASE_URL is not set.")
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        logger.info("Connected to PostgreSQL successfully.")
        return conn, cur
    except Exception:
        logger.exception("Error connecting to database")
        return None, None


def execute_query(query: str, cur) -> Tuple[list, list]:
    logger.info("Executing SQL on database.")
    logger.debug("SQL to execute:\n%s", query)
    cur.execute(query)
    columns = [desc[0] for desc in cur.description]
    results = cur.fetchall()
    logger.info("Query returned %d rows and %d columns.", len(results), len(columns))
    return results, columns

__all__ = ["connect_to_db", "execute_query"]