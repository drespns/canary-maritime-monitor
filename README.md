# Canary Maritime Monitor

![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=fff)
![Apache Kafka](https://img.shields.io/badge/Apache%20Kafka-231F20?logo=apachekafka&logoColor=fff)
![Apache Spark](https://img.shields.io/badge/Apache%20Spark-E25A1C?logo=apachespark&logoColor=fff)
![InfluxDB](https://img.shields.io/badge/InfluxDB-22ADF6?logo=influxdb&logoColor=fff)
![Grafana](https://img.shields.io/badge/Grafana-F46800?logo=grafana&logoColor=fff)
![Next.js](https://img.shields.io/badge/Next.js-000000?logo=next.js&logoColor=fff)
![React](https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=111)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-06B6D4?logo=tailwindcss&logoColor=fff)
![Python](https://img.shields.io/badge/Python-3776AB?logo=python&logoColor=fff)
![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)

Pipeline end-to-end para seguimiento marítimo en Canarias: ingestión AIS en tiempo real, procesamiento streaming, persistencia en series temporales y visualización operativa.

## Qué hace este proyecto

- Consume mensajes AIS desde `wss://stream.aisstream.io/v0/stream`.
- Publica eventos crudos en Kafka (`raw-ship-data`).
- Procesa el stream con Spark Structured Streaming:
  - parsing y normalización de campos
  - geofencing de Canarias (Bounding Box)
  - enriquecimiento geográfico (puerto más cercano con Haversine)
- Persiste resultados en InfluxDB.
- Expone visualización en:
  - Grafana (provisionado por archivos)
  - Dashboard web Next.js (mapa, KPIs, filtros, panel lateral, glosario de datos y preview del README).

## Arquitectura resumida

1. **Ingestión** (`src/ingestion`): WebSocket AIS -> Kafka Producer.
2. **Procesamiento** (`src/processing`): Kafka -> Spark -> enriquecimiento -> InfluxDB.
3. **Persistencia** (`src/storage`): validación de escritura/lectura en Influx.
4. **Visualización** (`src/web/ui` + Grafana): métricas de operación y mapa en vivo.

## Estado actual

- Fase 1 a Fase 4 base completadas.
- Stack local dockerizado con perfiles (`spark`, `web`).
- Dashboard web modularizado y listo para iterar en UX/analítica.
- Documentación extensa disponible en `docs/`.

## Arranque rápido (Windows / PowerShell)

```powershell
# 1) Infra base
docker compose up -d

# 2) Ingestión (terminal 1)
python src/ingestion/producer.py

# 3) Consumer de validación (terminal 2)
python src/ingestion/consumer_test.py

# 4) Spark streaming (terminal 3)
docker compose --profile spark exec spark /bin/sh -lc "export PYTHONPATH=/app/src/processing && /opt/spark/bin/spark-submit --packages org.apache.spark:spark-sql-kafka-0-10_2.13:4.1.1 /app/src/processing/spark_stream.py"

# 5) Web en Docker (opcional)
docker compose --profile web up -d --force-recreate web
```

## Scripts útiles

- `scripts/start-all.ps1` / `scripts/stop-all.ps1`: arranque/parada automática del flujo completo en Windows.
- `scripts/start-all.sh` / `scripts/stop-all.sh`: equivalente para entornos bash.

Catálogo completo: `docs/SCRIPTS_INDEX.md`.

## Estructura del repositorio

```text
canary-maritime-monitor/
├── docker/              # Infra Docker Compose + provisioning Grafana
├── docs/                # Especificación, roadmap, guías y runbook
├── scripts/             # Automatización de arranque/parada local
├── src/
│   ├── ingestion/       # AISStream -> Kafka
│   ├── processing/      # Spark streaming + enriquecimiento geo + sink Influx
│   ├── storage/         # Scripts de verificación Influx
│   └── web/             # App Next.js + UI dashboard
└── tests/               # Tests unitarios de lógica geográfica
```

## Variables de entorno importantes

- `AISSTREAM_API_KEY`
- `KAFKA_BOOTSTRAP_SERVERS` (en host suele ir mejor `127.0.0.1:9092`)
- `INFLUXDB_URL`, `INFLUX_ORG`, `INFLUX_BUCKET`, `INFLUX_ADMIN_TOKEN`
- `SPARK_OUTPUT_MODE` (`console`, `influx`, `both`)
- `WEB_SPEED_ALERT_KNOTS`
- (Web/Vercel) Protección opcional de endpoints:
  - `METRICS_API_KEY` para `/api/metrics`
  - `README_API_KEY` para `/api/readme`
  - `HEALTH_API_KEY` para `/api/health`

Plantilla base: `docker/.env.example`.

## Quality checks

### Python tests

```powershell
$env:PYTHONPATH = "src"
python -m unittest discover -s tests -p "test_*.py" -v
```

### UI checks

```powershell
cd src/web/ui
npm run lint
npm run build
```

## Theme system (web)

Sistema centralizado en `src/web/ui/src/theme/dashboard-theme.ts`:

- `layout`: página, contenedor y elementos decorativos.
- `card`: variantes reutilizables de tarjetas.
- `text`: colores semánticos.

Objetivo: permitir evolución visual rápida sin tocar decenas de componentes.

## Documentación recomendada

- Índice general: [`docs/README.md`](docs/README.md)
- Guía detallada paso a paso: [`docs/GUIA_DETALLADA_PIPELINE_ES.md`](docs/GUIA_DETALLADA_PIPELINE_ES.md)
- Recorrido arquitectónico: [`docs/ARCHITECTURE_WALKTHROUGH.md`](docs/ARCHITECTURE_WALKTHROUGH.md)
- Runbook operativo: [`docs/RUNBOOK.md`](docs/RUNBOOK.md)

## Licencia

Este proyecto está bajo **Apache License 2.0**.
