#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_DIR="$ROOT_DIR/tmp/dev-logs"
PID_DIR="$ROOT_DIR/tmp/dev-pids"

mkdir -p "$LOG_DIR" "$PID_DIR"

echo "[1/4] Levantando infraestructura Docker..."
cd "$ROOT_DIR/docker"
docker compose up -d
docker compose --profile spark up -d spark
docker compose --profile web up -d web

cd "$ROOT_DIR"

echo "[2/4] Arrancando producer..."
nohup python src/ingestion/producer.py > "$LOG_DIR/producer.log" 2>&1 &
echo $! > "$PID_DIR/producer.pid"

echo "[3/4] Arrancando consumer_test..."
nohup python src/ingestion/consumer_test.py > "$LOG_DIR/consumer.log" 2>&1 &
echo $! > "$PID_DIR/consumer.pid"

echo "[4/4] Arrancando spark-submit..."
nohup docker compose --profile spark exec spark /bin/sh -lc "export PYTHONPATH=/app/src/processing && /opt/spark/bin/spark-submit --packages org.apache.spark:spark-sql-kafka-0-10_2.13:4.1.1 /app/src/processing/spark_stream.py" > "$LOG_DIR/spark.log" 2>&1 &
echo $! > "$PID_DIR/spark.pid"

echo
echo "Stack iniciado."
echo "Logs:"
echo "  tail -f tmp/dev-logs/producer.log"
echo "  tail -f tmp/dev-logs/consumer.log"
echo "  tail -f tmp/dev-logs/spark.log"
echo
echo "URLs:"
echo "  Grafana: http://localhost:3000"
echo "  InfluxDB: http://localhost:8086"
echo "  Web UI:  http://localhost:3001"
