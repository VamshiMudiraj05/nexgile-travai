#!/usr/bin/env bash
cd "$(dirname "$0")"

echo "========================================="
echo " Starting Nexgile-TravAI Platform"
echo " Backend:  http://localhost:8000"
echo " Frontend: http://localhost:5173"
echo "========================================="

# Start backend in background
./backend/start.sh &
BACKEND_PID=$!

# Handle graceful shutdown of both servers on Ctrl+C
trap 'echo "Stopping servers..."; kill $BACKEND_PID 2>/dev/null; exit 0' SIGINT SIGTERM EXIT

# Start frontend in foreground
cd frontend && npm run dev
