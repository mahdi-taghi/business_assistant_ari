#!/bin/bash

SESSION_NAME="bussiness_assistant"
WINDOW_NAME="dev_dashboard"

# بررسی می‌کند که آیا سشن از قبل وجود دارد یا خیر
tmux has-session -t $SESSION_NAME 2>/dev/null

if [ $? != 0 ]; then
  # 1. ایجاد سشن و پنجره اصلی (که حالا شامل دو پین می‌شود)
  tmux new-session -d -s $SESSION_NAME -n "dev_view"
  
  # اجرای دستورات بک‌اند در پین اصلی (پین 0)
  tmux send-keys -t $SESSION_NAME:dev_view.0 "cd ai" C-m
  tmux send-keys -t $SESSION_NAME:dev_view.0 "conda activate myenv" C-m
  tmux send-keys -t $SESSION_NAME:dev_view.0 "python ai_worker.py" C-m

  # 2. تقسیم افقی پنجره جاری (ایجاد پین جدید)
  # -v یعنی تقسیم عمودی صفحه، که باعث ایجاد پین‌های افقی می‌شود (یکی بالا، یکی پایین)
  tmux split-window -v -t $SESSION_NAME:dev_view

  # 3. اجرای دستورات فرانت‌اند در پین جدید (پین 1)
  tmux send-keys -t $SESSION_NAME:dev_view.1 "cd frontend" C-m
  tmux send-keys -t $SESSION_NAME:dev_view.1 "npm run dev" C-m

  tmux split-window -h -t $SESSION_NAME:dev_view
  tmux send-keys -t $SESSION_NAME:dev_view.2 "docker compose up" C-m


fi

# 5. اتصال به سشن
tmux attach-session -t $SESSION_NAME