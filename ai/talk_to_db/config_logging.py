# =========================
# File: talk_to_db/config_logging.py
# =========================

from __future__ import annotations
import logging
from logging.handlers import RotatingFileHandler
import os, sys

LOG_DIR = os.getenv("LOG_DIR", "logs")
LOG_FILE = os.path.join(LOG_DIR, os.getenv("LOG_FILE_NAME", "talk_to_db.log"))
os.makedirs(LOG_DIR, exist_ok=True)

CONSOLE_LEVEL = os.getenv("LOG_CONSOLE_LEVEL", "INFO").upper()
FILE_LEVEL = os.getenv("LOG_FILE_LEVEL", "DEBUG").upper()

_FORMAT = logging.Formatter(
    fmt="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)

_console = logging.StreamHandler(sys.stdout)
_console.setLevel(CONSOLE_LEVEL)
_console.setFormatter(_FORMAT)

_file = RotatingFileHandler(
    LOG_FILE, maxBytes=5 * 1024 * 1024, backupCount=3, encoding="utf-8"
)
_file.setLevel(FILE_LEVEL)
_file.setFormatter(_FORMAT)

# Module-level logger for the whole package
logger = logging.getLogger("talk_to_db")
logger.setLevel(logging.DEBUG)
if not logger.handlers:
    logger.addHandler(_console)
    logger.addHandler(_file)
logger.propagate = False

__all__ = ["logger"]