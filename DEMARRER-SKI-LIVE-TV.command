#!/bin/bash
cd "$(dirname "$0")" || exit 1
PORT=8080
echo "Ski Live TV démarre sur http://localhost:${PORT}/"
python3 -m http.server "$PORT" &
SERVER_PID=$!
sleep 1
open "http://localhost:${PORT}/?v=20261123-2"
wait "$SERVER_PID"
