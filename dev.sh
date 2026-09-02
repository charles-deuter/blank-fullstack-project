#!/usr/bin/env bash
# Start a local Postgres, the backend (port 4000), and the frontend (port 3000).
# Ctrl-C stops all three; the Postgres container is removed on exit.
set -euo pipefail
set -m  # each background job gets its own process group, so we can kill its whole tree

cd "$(dirname "$0")"

PG_CONTAINER=local-postgres

pids=()
cleanup() {
  trap - INT TERM EXIT
  for pid in "${pids[@]}"; do
    # negative PID = signal the whole process group (npm -> tsx/next -> node, sed)
    kill -TERM -- "-${pid}" 2>/dev/null || kill -TERM "${pid}" 2>/dev/null || true
  done
  wait 2>/dev/null || true
  echo "[postgres] stopping $PG_CONTAINER"
  docker stop "$PG_CONTAINER" >/dev/null 2>&1 || true
}
trap cleanup INT TERM EXIT

echo "[postgres] starting $PG_CONTAINER"
# A leftover container from a killed run would win the name, and the readiness
# probe below would happily pass against it — migrating a database we didn't start.
docker rm -f "$PG_CONTAINER" >/dev/null 2>&1 || true
docker run --rm --name "$PG_CONTAINER" \
  -e POSTGRES_USER=local \
  -e POSTGRES_PASSWORD=arfarf \
  -p 5432:5432 \
  postgres:16-alpine &
pids+=("$!")

# Wait for Postgres to accept connections before starting the apps.
for _ in $(seq 1 30); do
  if docker exec "$PG_CONTAINER" pg_isready -U local >/dev/null 2>&1; then
    break
  fi
  sleep 1
done
docker exec "$PG_CONTAINER" pg_isready -U local >/dev/null 2>&1 || {
  echo "[postgres] failed to become ready" >&2
  exit 1
}
echo "[postgres] ready"

# The container starts empty every run, so the schema has to be applied before
# anything queries it.
echo "[postgres] applying migrations"
( cd backend && npm run db:migrate ) 2>&1 | sed 's/^/[migrate] /'

( cd backend && exec npm start 2>&1 | sed 's/^/[backend] /' ) &
pids+=("$!")

( cd frontend && exec npm run dev 2>&1 | sed 's/^/[frontend] /' ) &
pids+=("$!")

wait
