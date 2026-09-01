#!/usr/bin/env bash
# Start the backend (port 4000) and frontend (port 3000) together.
# Ctrl-C stops both.
set -euo pipefail

cd "$(dirname "$0")"

pids=()
cleanup() {
  trap - INT TERM EXIT
  for pid in "${pids[@]}"; do
    kill "$pid" 2>/dev/null || true
  done
  wait 2>/dev/null || true
}
trap cleanup INT TERM EXIT

( cd backend && npm start 2>&1 | sed 's/^/[backend] /' ) &
pids+=("$!")

( cd frontend && npm run dev 2>&1 | sed 's/^/[frontend] /' ) &
pids+=("$!")

wait
