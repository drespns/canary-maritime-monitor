# Índice de scripts y archivos ejecutables

Mapa rápido para estudiar el proyecto completo (incluye `core` y no `core`).

## Infraestructura y orquestación

- `docker/docker-compose.yml` - Orquesta Kafka, InfluxDB, Grafana, Spark toolbox y web.
- `docker/.env` - Variables reales de entorno local (no subir secretos).
- `docker/.env.example` - Plantilla de variables.
- `docker/grafana/provisioning/datasources/influxdb.yml` - Provisiona datasource InfluxDB en Grafana.
- `docker/grafana/provisioning/dashboards/default.yml` - Registra proveedor de dashboards por archivo.
- `docker/grafana/provisioning/dashboards/json/canary-overview.json` - Dashboard base de observabilidad.

## Arranque/parada automática (nuevo)

- `scripts/start-all.sh` - Arranque completo (Docker + producer + consumer + spark-submit) en Bash.
- `scripts/stop-all.sh` - Parada de procesos locales y `docker compose down` en Bash.
- `scripts/start-all.ps1` - Arranque completo equivalente para PowerShell.
- `scripts/stop-all.ps1` - Parada equivalente para PowerShell.

## Ingestión (AISStream -> Kafka)

- `src/ingestion/producer.py` - Entrypoint del bridge WebSocket -> Kafka.
- `src/ingestion/consumer_test.py` - Consumer de humo para verificar offsets/mensajes.
- `src/ingestion/core/config.py` - Carga/valida variables de entorno de ingestión.
- `src/ingestion/core/aisstream_bridge.py` - Conexión WS, suscripción, reconexión, envío a Kafka.
- `src/ingestion/core/kafka_client.py` - Wrappers JSON de producer/consumer.
- `src/ingestion/core/message_parser.py` - Helpers para filtrar `PositionReport` e identidad de barco.
- `src/ingestion/core/logging_utils.py` - Config unificada de logs.
- `src/ingestion/core/__init__.py` - Marca paquete Python.
- `src/ingestion/README.md` - Guía de uso del módulo de ingestión.

## Procesamiento (Spark)

- `src/processing/spark_stream.py` - Pipeline principal de Structured Streaming.
- `src/processing/core/config.py` - Config Spark/Kafka/bbox/sink Influx.
- `src/processing/core/spark_session.py` - Construcción de SparkSession y entorno Python workers.
- `src/processing/core/schema.py` - Schema explícito del JSON AIS.
- `src/processing/core/transforms.py` - Transformaciones (parseo, normalización, geofence, etc.).
- `src/processing/core/geo.py` - Haversine y utilidades geográficas puras.
- `src/processing/core/ports.py` - Carga y validación de puertos desde JSON.
- `src/processing/core/influx_sink.py` - `foreachBatch` para escribir en InfluxDB.
- `src/processing/core/__init__.py` - Marca paquete `core`.
- `src/processing/data/canary_ports.json` - Puertos de referencia para distancia al más cercano.
- `src/processing/requirements.txt` - Dependencias Python del módulo.
- `src/processing/README.md` - Comandos y troubleshooting del job Spark.
- `src/processing/__init__.py` - Marca paquete `processing`.

## Storage y validación de persistencia

- `src/storage/influx_smoke_test.py` - Consulta rápida a Influx para confirmar escrituras.
- `src/storage/README.md` - Guía de verificación de persistencia.

## Web (Next.js + Tailwind)

- `src/web/ui/src/app/page.tsx` - Dashboard web principal.
- `src/web/ui/src/components/live-dashboard.tsx` - UI cliente con auto-refresh cada 5s.
- `src/web/ui/src/app/api/health/route.ts` - Endpoint health.
- `src/web/ui/src/app/api/metrics/route.ts` - Endpoint API con métricas agregadas.
- `src/web/ui/src/lib/pipeline-metrics.ts` - Consulta Flux y agregación para la UI.
- `src/web/ui/src/app/layout.tsx` - Layout global App Router.
- `src/web/ui/package.json` - Scripts npm y dependencias.
- `src/web/ui/next.config.ts` - Config de Next.js.
- `src/web/ui/README.md` - Guía del frontend.
- `src/web/README.md` - Resumen del módulo web.

## Tests

- `tests/test_geo_haversine.py` - Tests unitarios de Haversine/carga de puertos.
- `tests/fixtures/mini_ports.json` - Fixture de puertos para tests.

## Documentación principal

- `docs/PROJECT_SPEC.md` - Alcance funcional y técnico.
- `docs/ROADMAP.md` - Fases y estado.
- `docs/ARCHITECTURE_WALKTHROUGH.md` - Recorrido visual de arquitectura.
- `docs/GUIA_DETALLADA_PIPELINE_ES.md` - Explicación minuciosa por fases.
- `docs/LEARNING_LOG.md` - Bitácora de aprendizaje.
- `docs/README.md` - Índice de documentación.
