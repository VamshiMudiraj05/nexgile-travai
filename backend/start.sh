#!/usr/bin/env bash
# Automatically use the virtual environment without needing manual activation
cd "$(dirname "$0")"
if [ -d ".venv" ]; then
    exec .venv/bin/python -m uvicorn app.main:app --reload --port 8000 "$@"
else
    exec python3 -m uvicorn app.main:app --reload --port 8000 "$@"
fi
