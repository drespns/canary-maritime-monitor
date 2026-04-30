$ErrorActionPreference = "Stop"

$root = (Resolve-Path "$PSScriptRoot\..").Path
$logDir = Join-Path $root "tmp/dev-logs"
New-Item -ItemType Directory -Force -Path $logDir | Out-Null

Set-Location (Join-Path $root "docker")
docker compose up -d
docker compose --profile spark up -d spark
docker compose --profile web up -d web

Set-Location $root

Start-Process python -ArgumentList "src/ingestion/producer.py" -RedirectStandardOutput (Join-Path $logDir "producer.log") -RedirectStandardError (Join-Path $logDir "producer.err.log")
Start-Process python -ArgumentList "src/ingestion/consumer_test.py" -RedirectStandardOutput (Join-Path $logDir "consumer.log") -RedirectStandardError (Join-Path $logDir "consumer.err.log")
Start-Process docker -ArgumentList "compose --profile spark exec spark /bin/sh -lc `"export PYTHONPATH=/app/src/processing && /opt/spark/bin/spark-submit --packages org.apache.spark:spark-sql-kafka-0-10_2.13:4.1.1 /app/src/processing/spark_stream.py`"" -WorkingDirectory (Join-Path $root "docker") -RedirectStandardOutput (Join-Path $logDir "spark.log") -RedirectStandardError (Join-Path $logDir "spark.err.log")

Write-Host "Stack iniciado."
Write-Host "Grafana: http://localhost:3000"
Write-Host "InfluxDB: http://localhost:8086"
Write-Host "Web UI:  http://localhost:3001"
Write-Host "Logs en: $logDir"
