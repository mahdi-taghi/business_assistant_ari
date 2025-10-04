#!/bin/bash

SESSION_NAME="dev"

# ----------------------------------------------------
# Configuration: VERIFY THIS PATH!
# ----------------------------------------------------
# This path is usually created when Conda is installed and initialized.
CONDA_INIT_SCRIPT="/home/amir/miniconda3/etc/profile.d/conda.sh" 
CONDA_ENV_NAME="myenv"

# Command to execute in the AI worker pane:
# 1. Source the main Conda init script.
# 2. Activate the target environment.
# 3. Change directory to 'ai'.
# 4. Run the Python worker script.
CONDA_EXEC_COMMAND="source ${CONDA_INIT_SCRIPT} && conda activate ${CONDA_ENV_NAME} && cd ai && python worker.py"

# ----------------------------------------------------
# Session Setup
# ----------------------------------------------------

# Check if a session with this name exists
tmux has-session -t $SESSION_NAME 2>/dev/null

# If the session does not exist, create a new one
if [ $? != 0 ]; then
  # 1. Create a new session with a shell in the first pane (0.0)
  tmux new-session -d -s $SESSION_NAME 
  
  # 2. Send the 'docker compose up' command to the main pane (0.0)
  tmux send-keys -t $SESSION_NAME:0.0 "docker compose up" C-m

  # 3. Split horizontally for the frontend (Pane 0.1)
  tmux split-window -h -t $SESSION_NAME:0 "cd frontend && npm run dev"

  # 4. Split vertically for the AI worker (Pane 0.2)
  # Uses 'bash -c' to run the complex Conda initialization command.
  tmux split-window -v -t $SESSION_NAME:0.0 "bash -c '${CONDA_EXEC_COMMAND}'"
  
  # 5. Set the pane layout to tiled
  tmux select-layout -t $SESSION_NAME:0 tiled
fi

# ----------------------------------------------------
# Attach to Session
# ----------------------------------------------------

# Attach to the running session
tmux attach-session -t $SESSION_NAME