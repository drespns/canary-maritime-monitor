# Runbook de ejecución (comandos)

Guía operativa para lanzar el proyecto completo.

## Opción A: automatizado (recomendado)

### Git Bash

```bash
bash scripts/start-all.sh
```

Parar:

```bash
bash scripts/stop-all.sh
```

### PowerShell

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start-all.ps1
```

Parar:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\stop-all.ps1
```

## Opción B: manual paso a paso

## 1) Infraestructura

```bash
cd docker
docker compose up -d
docker compose --profile spark up -d spark
docker compose --profile web up -d web
```

## 2) Ingestión

Terminal 1:

```bash
python src/ingestion/producer.py
```

Terminal 2:

```bash
python src/ingestion/consumer_test.py
```

## 3) Spark submit

```bash
cd docker
docker compose --profile spark exec spark /bin/sh -lc "export PYTHONPATH=/app/src/processing && /opt/spark/bin/spark-submit --packages org.apache.spark:spark-sql-kafka-0-10_2.13:4.1.1 /app/src/processing/spark_stream.py"
```

## 4) Verificación Influx

```bash
python src/storage/influx_smoke_test.py
```

## 5) UIs

- Grafana: <http://localhost:3000>
- InfluxDB: <http://localhost:8086>
- Web: <http://localhost:3001>
- API metrics: <http://localhost:3001/api/metrics>

## Diagnóstico rápido

- Si Influx da 0 filas: revisar que Spark siga vivo y que aparezcan logs `[influx-sink]`.
- Si Spark rompe con `No module named 'core'`: usar el comando de Spark con `PYTHONPATH=/app/src/processing`.
- Si web muestra 0: revisar token `INFLUX_ADMIN_TOKEN` y endpoint `/api/metrics`.
