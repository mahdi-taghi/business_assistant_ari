# scripts/smoke_talk_to_db.py
import sys, pathlib

# Add the parent directory (/home/amir/Documents/w/business-assistant/v1/ai)
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))

import os
from talk_to_db.talk_to_db import talk_to_db  # ✅ import works now

# Handy for verbose logs during debug
os.environ.setdefault("LOG_CONSOLE_LEVEL", "DEBUG")
os.environ.setdefault("LOG_FILE_LEVEL", "DEBUG")

def main():
    question = "۱۰ کالای گران که از کشور کره در سال 1400 وارده شده اند چه بوده است؟"
    out = talk_to_db(
        question=question,
        user_id="u123",
        user_role="public",
        chat_id="c123",
        is_first_message=True,
        verbose=True,
    )
    print("\n=== FINAL ANSWER ===")
    print(out)

if __name__ == "__main__":
    main()
