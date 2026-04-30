#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PID_DIR="$ROOT_DIR/tmp/dev-pids"

kill_if_exists() {
  local pid_file="$1"
  if [[ -f "$pid_file" ]]; then
    local pid
    pid="$(cat "$pid_file")"
    if kill -0 "$pid" >/dev/null 2>&1; then
      kill "$pid" || true
    fi
    rm -f "$pid_file"
  fi
}

echo "Parando procesos locales..."
kill_if_exists "$PID_DIR/producer.pid"
kill_if_exists "$PID_DIR/consumer.pid"
kill_if_exists "$PID_DIR/spark.pid"

echo "Parando contenedores..."
cd "$ROOT_DIR/docker"
docker compose --profile spark --profile web down

echo "Done."
