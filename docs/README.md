# Índice de documentación

Lectura recomendada para orientarse en el repositorio.

| Documento | Contenido |
|-----------|-----------|
| [`PROJECT_SPEC.md`](./PROJECT_SPEC.md) | Qué problema resuelve el proyecto y el pipeline de alto nivel. |
| [`ROADMAP.md`](./ROADMAP.md) | Fases (Docker → ingestión → Spark → Influx/Grafana/web) y avance. |
| [`ARCHITECTURE_WALKTHROUGH.md`](./ARCHITECTURE_WALKTHROUGH.md) | Diagrama de flujo, puertos Kafka, rutas de estudio 30 min / 2 h / 1 día. |
| [`GUIA_DETALLADA_PIPELINE_ES.md`](./GUIA_DETALLADA_PIPELINE_ES.md) | Historia y “por qué” de cada pieza (Compose, producer, Spark, errores típicos). |
| [`RUNBOOK.md`](./RUNBOOK.md) | Comandos para lanzar/parar todo (manual y automatizado). |
| [`SCRIPTS_INDEX.md`](./SCRIPTS_INDEX.md) | Inventario de scripts/archivos clave con descripción corta. |
| [`LEARNING_LOG.md`](./LEARNING_LOG.md) | Plantilla de diario de aprendizaje (bitácora tuya). |

Los README por módulo viven junto al código:

- `src/ingestion/README.md` — variables y comandos del producer/consumer.
- `src/processing/README.md` — Spark, Docker, Haversine y puertos.
- `src/storage/README.md` — verificación de persistencia en InfluxDB.
- `src/web/README.md` — arranque de la UI Next.js/Tailwind.
