from dotenv import load_dotenv
from openai import OpenAI
from typing import Tuple

import psycopg2
import os

import re

from typing import List, Dict, Any, Optional
from redis_utils import (
    health as redis_health_check,
    now_iso,
    push_last_twenty_message,
    get_last_twenty_messages,
    save_user_message_json,
    save_ai_response_json,
)
import json, time 

load_dotenv()

client = OpenAI()
def connect_to_db():
    """Connect to PostgreSQL database and return connection and cursor"""
    try:
        DATABASE_URL = os.getenv("DATABASE_URL")
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        return conn, cur
    except Exception as e:
        print(f"Error connecting to database: {e}")
        return None, None

SYSTEM_PROMPT = """
تو یک تحلیل‌گر داده هستی که از جدول `final_true` برای پاسخ به سؤال‌های آماری استفاده می‌کنی.
وظیفه‌ات تولید کد postgres است که بر اساس `final_true` اطلاعات را تحلیل کند.

اطلاعات جدول مربوط به واردات و صادرات ایران از سال ۱۳۸۸ تا ۱۴۰۴ است و ستون‌های آن به شرح زیر است:
ستون "year" نوع "integer"، این ستون سال مبادله را مشخص میکند و عددی چهار رقمی بین ۱۳۸۸ تا ۱۴۰۴ است
ستون "month" نوع "integer"، این ستون ماه مبادله را مشخص میکند و عددی بین ۱ تا ۱۲ است
ستون "customs_name" نوع "text"،  این ستون اسم گمرکی که در آن مبادله رخ داده را مشخص می‌کند
ستون "country" نوع "text"،  این ستون اسم کشور که با آن مبادله کردیم را مشخص می‌کند
ستون "hs_code" نوع "text"،  کد تعرفه کالای مورد مبادله
ستون "weight" نوع "numeric"،  وزن کالای مورد مبادله به کیلوگرم
ستون "rial" نوع "numeric"،  ارزش کالای مورد مبادله به ریال
ستون "dollar" نوع "numeric"،  ارزش کالای مورد مبادله به دلار
ستون "type" نوع "text"،  نوع مبادله را مشخص می‌کند واردات یا صادرات

توجه:
- از میان ارزش دلار و ریال به صورت پیش فرض از دلار استفاده کن مگر اینکه صراحتاً در سؤال به ریال اشاره شده باشد.
- فقط کد postgres تولید کن و چیز اضافی نگو
- فقط کوئری SELECT بنویس که فقط از جدول final_true استفاده کند.
- از هیچ دستور DDL/DML مثل INSERT/UPDATE/DELETE/DROP/COPY/CREATE استفاده نکن.
- اگر نیاز به محدود کردن نتایج است از LIMIT استفاده کن.
- در کوئری‌هایی که نیاز به GROUP BY دارند، فقط روی ستون کلیدی (مثل hs_code یا year یا country) گروه‌بندی کن. 
- ستون‌های توضیحی (مثل customs_name) را در GROUP BY قرار نده مگر اینکه مستقیماً موضوع سؤال باشد.
- اگر لازم است توضیح یا متن یک کد (مثلاً customs_name) هم بیاید، آن را فقط به صورت یک ستون کمکی همراه با hs_code انتخاب کن (مثلاً با تابعی مثل MAX یا MIN).
- اگر شرط روی ستون customs_name یا country دقیقاً یک مقدار مشخص باشد (مثل «تهران» یا «ایران»)، فقط از مقایسه‌ی دقیق (= 'تهران') استفاده کن و از الگوهای کلی مثل ILIKE '%تهران%' استفاده نکن، مگر اینکه در سؤال صراحتاً اشاره شده باشد که همه‌ی موارد مشابه یا شامل آن واژه هم مدنظر هستند.

مثال:
ورودی:
تعداد کشور‌هایی که با ایران مبادله داشتند؟
خروجی:
SELECT COUNT(DISTINCT country) AS number_of_countries
FROM final_true;

"""


def question_to_query(question: str):
    response = client.chat.completions.create(
        model="gpt-5", 
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": question}
        ]
    )
    return response.choices[0].message.content


def execute_query(query: str, cur) -> Tuple[list, list]:
    """Execute PostgreSQL query and return results with column names"""
    
    cur.execute(query)
    columns = [desc[0] for desc in cur.description]
    results = cur.fetchall()
    return results, columns


def query_to_result(results: list, columns: list, user_question: str) -> str:
    """Convert DB results (all rows + column names) and user question to a Persian human-readable answer."""
    # Build a compact textual table representation
    # Convert all values to strings and escape newlines
    def fmt_cell(v):
        if v is None:
            return ""
        s = str(v)
        return s.replace("\n", " ")

    header = " | ".join(columns)
    rows_text = []
    for r in results:
        row_cells = [fmt_cell(c) for c in r]
        rows_text.append(" | ".join(row_cells))
    table_text = header + "\n" + ("\n".join(rows_text) if rows_text else "")

    SYSTEM_PROMPT_sql_to_text = """
                تو یک دستیار هوش مصنوعی هستی. وظیفه تو این است که سوال کاربر و نتیجه‌ای که از پایگاه داده استخراج شده را بگیری و یک پاسخ کوتاه و روان و قابل فهم به زبان فارسی تولید کنی.
            فقط و فقط پاسخ نهایی را برگردان.
            اگر لازم دیدی می‌توانی خلاصه‌ای از جدول (مثلاً تعداد ردیف‌ها، نام ستون‌های مهم یا چند ردیف اول) بیاوری، ولی کاربر ممکن است انتظار داشته باشد همه‌ی نتایج در پاسخ دیده شوند — بنابراین جدول کامل را نیز در صورت کوتاه بودن، به صورت مرتب و قابل خواندن وارد کن.
            توجه:
            - اعداد بسیار بزرگ را با کاما جدا کن (مثلاً ۱,۲۳۴,۵۶۷).
            - اگر عدد اعشاری است، آن را به دو رقم اعشار گرد کن (مثلاً ۱۲۳۴.۵۶).
            - چیزی برای ادامه گفتگو نپرس.
    """
    
    # Send to LLM for a natural Persian reply, providing the full table and the original question.
    response = client.chat.completions.create(
        model="gpt-5-mini",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT_sql_to_text},
            {"role": "user", "content": f"سوال کاربر: '''{user_question}'''\n\nنتایج جدول (ستون‌ها و ردیف‌ها):\n\n{table_text}\n\nبا توجه به سوال کاربر و این داده‌ها، پاسخ فارسی، طبیعی و قابل فهم بنویس. فقط خروجی نهایی را بده."}
        ]
    )
    return response.choices[0].message.content




# Patterns
_SAFE_START = re.compile(
    r'^\s*(?:with\b[\s\S]*?select\b|select\b)',
    re.IGNORECASE
)

# کلیِ کلمات خطرناک که هر کدام در هر استیتمنت به‌عنوان کلمهٔ جداگانه ممنوع‌اند
_DANGEROUS_ANYWHERE = re.compile(
    r'\b('
    r'delete|drop|truncate|update|insert|alter|create|replace|'
    r'execute|exec|merge|call|grant|revoke|vacuum|analyze|'
    r'refresh\s+materialized\s+view|lock|cluster|listen|unlisten|notify|'
    r'do|security\s+definer|set|reset|begin|commit|rollback|savepoint|'
    r'pg_read_file|pg_ls_dir|pg_stat_file|lo_import|lo_export'
    r')\b',
    re.IGNORECASE
)

_PG_SLEEP = re.compile(r'\bpg_sleep\s*\(', re.IGNORECASE)
_COPY_PROGRAM = re.compile(r'\bcopy\b[\s\S]*\b(program|stdin|stdout)\b', re.IGNORECASE)


def _split_statements(sql: str) -> List[str]:
    """
    Split top-level SQL statements by semicolon, ignoring semicolons inside:
     - single quotes '...'
     - double quotes "..." (identifiers / strings)
     - dollar-quoted strings $$...$$ or $tag$...$tag$
    Returns list of trimmed statements (without trailing semicolons).
    """
    s = sql
    stmts = []
    cur = []
    i = 0
    n = len(s)

    # state
    in_sq = False   # single-quote '
    in_dq = False   # double-quote "
    in_dollar = False
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
            # check for end tag
            if ch == '$' and s[i - len(dollar_tag) + 1:i + 1] == dollar_tag:
                # ensure we've matched the full tag ending (this is a quick check;
                # because we always append characters, it's safe)
                in_dollar = False
                dollar_tag = None
            i += 1
            continue

        # not inside any quote
        # detect start of single-quote
        if ch == "'":
            cur.append(ch)
            in_sq = True
            i += 1
            continue

        # double quote
        if ch == '"':
            cur.append(ch)
            in_dq = True
            i += 1
            continue

        # dollar-quote start? detect $tag$
        if ch == '$':
            # try to find a tag like $tag$
            m = re.match(r'\$[A-Za-z0-9_]*\$', s[i:])
            if m:
                tag = m.group(0)  # e.g. $$ or $abc$
                cur.append(tag)
                in_dollar = True
                dollar_tag = tag
                i += len(tag)
                continue
            else:
                # solitary dollar sign
                cur.append(ch)
                i += 1
                continue

        # semicolon at top-level => split
        if ch == ';':
            stmt = ''.join(cur).strip()
            if stmt:
                stmts.append(stmt)
            cur = []
            i += 1
            # skip possible spaces after semicolon (they'll be trimmed later)
            continue

        # otherwise just append
        cur.append(ch)
        i += 1

    # leftover
    last = ''.join(cur).strip()
    if last:
        stmts.append(last)
    return stmts


def validate_query(query: str, max_statements: int = 10) -> bool:
    """
    Validate that `query` consists of 1..max_statements top-level statements,
    each of which is a safe read-only SELECT (or WITH ... SELECT).
    Returns True if safe, False otherwise.
    """
    if not isinstance(query, str):
        return False

    q = query.strip()
    if not q:
        return False

    try:
        stmts = _split_statements(q)
    except Exception:
        # on any parser failure, be conservative and reject
        return False

    if not stmts:
        return False

    # limit number of statements to avoid DOS via huge number of small statements
    if len(stmts) > max_statements:
        return False

    for s in stmts:
        s_stripped = s.strip()

        # must start with SELECT or WITH ... SELECT
        if not _SAFE_START.match(s_stripped):
            return False

        # if WITH ... make sure the CTE definitions don't contain DML/DDL
        if re.match(r'^\s*with\b', s_stripped, re.IGNORECASE):
            # extract prefix before first SELECT (this will include the WITH ... definitions)
            prefix_before_first_select = re.split(r'\bselect\b', s_stripped, 1, flags=re.IGNORECASE)[0]
            if re.search(r'\b(insert|update|delete|merge|alter|create|drop|truncate|replace|execute|exec|call)\b',
                         prefix_before_first_select, re.IGNORECASE):
                return False

        # global dangerous keywords anywhere in the statement
        if _DANGEROUS_ANYWHERE.search(s_stripped):
            return False

        # specific dangerous patterns
        if _PG_SLEEP.search(s_stripped):
            return False

        if _COPY_PROGRAM.search(s_stripped):
            return False

    # all checks passed
    return True


def _make_like_pattern(value: str) -> str:
    # اگر کاربر خودش wildcard داده (% یا _) همون رو نگه دار
    if "%" in value or "_" in value:
        return value
    # بین کلمات % بگذار و دو سرش هم %
    words = value.strip().split()
    return "%" + "%".join(words) + "%"

def _extract_field_and_value(q: str):
    """
    به ترتیب این حالت‌ها رو چک می‌کنه:
    1) customs_name/country/country_name = '...'
    2) customs_name/country/country_name ILIKE '...'
    اگر پیدا کرد، (field, value) برمی‌گردونه، وگرنه None
    """
    # = '...'
    m = re.search(r"(customs_name|country|country_name)\s*=\s*'([^']+)'", q, flags=re.IGNORECASE)
    if m:
        return m.group(1), m.group(2)
    # ILIKE '...'
    m = re.search(r"(customs_name|country|country_name)\s*ILIKE\s*'([^']+)'", q, flags=re.IGNORECASE)
    if m:
        return m.group(1), m.group(2)
    return None

def suggest_like_matches(query: str, conn, limit: int = 100):
    """
    اگر در کوئری شرطی برای customs_name/country/country_name بود:
      SELECT DISTINCT <field> FROM final_true WHERE <field> ILIKE %s ORDER BY <field> LIMIT %s
    را اجرا می‌کند و خروجیِ مرتب‌شده را برمی‌گرداند (لیست از رشته‌ها).
    اگر چیزی پیدا نشد یا شرط نبود، None برمی‌گرداند.
    """
    found = _extract_field_and_value(query)
    if not found:
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
    with conn.cursor() as cur:
        cur.execute(sql, (pattern, limit))
        rows = cur.fetchall()

    # rows مثل [('تهران',), ('غرب تهران',)...] → فقط عنصر اول هر تاپل را بردار
    options = [r[0] for r in rows]
    return options

def run_query_with_like(query: str, conn):
    """
    اگر شرط customs_name/country/country_name در کوئری بود، لیست مقادیر مشابه را برمی‌گرداند
    و متن پیشنهادی چاپ می‌کند. در غیر این صورت همان کوئریِ ورودی را (پس از تبدیل '=' به ILIKE)
    اجرا می‌کند و نتایج را برمی‌گرداند.
    """
    # اول تلاش برای پیشنهاد
    options = suggest_like_matches(query, conn)    
    return options

def talk_to_db(
    question: str,
    user_id: str,
    user_role: str,
    chat_id: str,
    is_first_message: bool,
    verbose: bool = False
) -> str:
    conn = None
    cur = None
    try:
        # 0) هلت‌چک ساده (اختیاری)
        if not redis_health_check() and verbose:
            print("⚠️ اتصال به Redis مشکل دارد (ping ناموفق).")

        # 1) تاریخچه را به‌روزرسانی و JSON کاربر را ذخیره کن
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

        # 2) تولید کوئری
        query = question_to_query(question)
        # اگر question_to_query توی کدت فقط query برمی‌گردونه، همین کافی است
        # اگر خواستی tokens/model را هم ذخیره کنی، تابع را طوری برگردان که آن‌ها را هم بدهد.

        if isinstance(query, tuple):
            # اگر نسخه‌ای داری که (query, tokens, model) برمی‌گرداند:
            query, *_ = query

        if not validate_query(query):
            print("این درخواست مجاز نیست. فقط کوئری‌های SELECT ساده مجاز هستند.\n" + query)
            return "درخواست نامعتبر است."

        if verbose:
            print("Generated Query:\n" + query + "\n")

        # 3) اجرای کوئری
        conn, cur = connect_to_db()
        if not cur or not conn:
            print("امکان اتصال به پایگاه داده وجود ندارد.")
            return "عدم امکان اتصال به پایگاه داده."

        results, columns = execute_query(query, cur)
        if not results and verbose:
            print("هیچ نتیجه‌ای یافت نشد.")

        # نمایش جدولی برای دیباگ (اختیاری)
        if verbose and results:
            col_widths = [max(len(str(col)), max(len(str(row[i])) for row in results)) for i, col in enumerate(columns)]
            header = " | ".join(col.ljust(col_widths[i]) for i, col in enumerate(columns))
            sep = "-+-".join("-" * col_widths[i] for i in range(len(columns)))
            rows_str = "\n".join(
                " | ".join(str(row[i]).ljust(col_widths[i]) for i in range(len(columns)))
                for row in results
            )
            print(f"{header}\n{sep}\n{rows_str}\n")

        # 4) تبدیل نتیجه به پاسخ فارسی
        t0 = time.time()
        final_answer = query_to_result(results, columns, question)
        if isinstance(final_answer, tuple):
            # اگر نسخه‌ای داری که (text, tokens, model) برمی‌گرداند:
            final_text, a_tokens, a_model = final_answer
        else:
            final_text, a_tokens, a_model = final_answer, None, "gpt-5-mini"
        dt = time.time() - t0

        print(final_text)

        # 5) ذخیره پاسخ AI در Redis طبق قرارداد تیم
        ai_json = {
            "user_id": str(user_id),
            "chat_id": str(chat_id),
            "content": final_text,
            "ai_response_metadata": json.dumps({
                "model": a_model,
                "processing_time": f"{round(dt, 3)}s",
                "suggested_title": "عنوان پیشنهادی",
            }, ensure_ascii=False),
            "ai_references": json.dumps([{"title": "سورس نمونه"}], ensure_ascii=False),
            "tokens_used": str(a_tokens if a_tokens is not None else ""),
            "response_time": now_iso(),
            "timestamp": now_iso(),
        }
        save_ai_response_json(ai_json)

        # 6) تاریخچه را با پیام assistant هم به‌روزرسانی کن
        push_last_twenty_message(chat_id, "assistant", final_text)

        # 7) پیشنهادهای LIKE (در صورت وجود شرط country/customs_name)
        options = run_query_with_like(query, conn)
        if options is not None and isinstance(options, list) and len(options) > 1:
            suggest_header = "در پایگاه داده این ها را نیز یافتیم، ممکن است مفید باشد و یا بخواید سوال خود را دقیق کنید"
            suggestion_lines = "\n".join(f"- {o}" for o in options)
            print(suggest_header + "\n" + suggestion_lines)

        return final_text

    except Exception as e:
        return f"خطا در اجرای درخواست: {str(e)}"
    finally:
        if cur: cur.close()
        if conn: conn.close()


if __name__ == "__main__":
    # هلت‌چک Redis
    if not redis_health_check():
        print("⚠️ اتصال به Redis مشکل دارد.")

    print(
        talk_to_db(
            question="تعداد کشور‌هایی که با ایران مبادله داشتند؟",
            user_id="1",
            user_role="admin",
            chat_id="123",
            is_first_message=True,
            verbose=True
        )
    )
