#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "==> Killing previous runs..."
for f in server.pid frontend.pid; do
  if [ -f "$SCRIPT_DIR/$f" ]; then
    kill "$(cat "$SCRIPT_DIR/$f")" 2>/dev/null || true
    rm "$SCRIPT_DIR/$f"
  fi
done
# docker rm -f redis 2>/dev/null || true

# echo "==> Starting Redis..."
# docker run -d --name redis -p 6379:6379 redis:7-alpine

echo "==> Installing Python deps..."
pip3 install -q -r "$SCRIPT_DIR/backend/requirements.txt"

echo "==> Installing frontend deps..."
cd "$SCRIPT_DIR/frontend"
npm install --silent 2>/dev/null

echo "==> Starting server on http://localhost:5001..."
nohup python3 "$SCRIPT_DIR/backend/main.py" > "$SCRIPT_DIR/server.log" 2>&1 &
echo $! > "$SCRIPT_DIR/server.pid"
echo "Backend PID: $(cat "$SCRIPT_DIR/server.pid")"
echo "Backend logs: $SCRIPT_DIR/server.log"

echo "==> Starting frontend on http://localhost:3000..."
export NODE_OPTIONS=--openssl-legacy-provider
BROWSER=none nohup npm start > "$SCRIPT_DIR/frontend.log" 2>&1 &
echo $! > "$SCRIPT_DIR/frontend.pid"
echo "Frontend PID: $(cat "$SCRIPT_DIR/frontend.pid")"
echo "Frontend logs: $SCRIPT_DIR/frontend.log"

echo ""
echo "========================================"
echo "  Backend:  http://localhost:5001"
echo "  Frontend: http://localhost:3000"
echo "========================================"
