## Canary Maritime Monitor

![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=fff)
![Apache Kafka](https://img.shields.io/badge/Apache%20Kafka-231F20?logo=apachekafka&logoColor=fff)
![Apache Spark](https://img.shields.io/badge/Apache%20Spark-E25A1C?logo=apachespark&logoColor=fff)
![InfluxDB](https://img.shields.io/badge/InfluxDB-22ADF6?logo=influxdb&logoColor=fff)
![Grafana](https://img.shields.io/badge/Grafana-F46800?logo=grafana&logoColor=fff)
![Next.js](https://img.shields.io/badge/Next.js-000000?logo=next.js&logoColor=fff)
![React](https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=111)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-06B6D4?logo=tailwindcss&logoColor=fff)
![Python](https://img.shields.io/badge/Python-3776AB?logo=python&logoColor=fff)

## Documentación

Índice principal en **[`docs/README.md`](docs/README.md)** (especificación, roadmap, arquitectura y guía larga en español).

## Estructura del proyecto

canary-maritime-monitor/
├── .cursor/                # Configuración específica para la IA
│   └── rules.md            # Instrucciones de comportamiento para Cursor
├── docker/                 # Infraestructura (Infrastructure as Code)
│   └── docker-compose.yml  # Kafka (KRaft), InfluxDB, Grafana, Spark (opcional)
├── docs/                   # Especificación, roadmap, bitácora y guías
│   ├── README.md           # Índice de la carpeta docs/
│   ├── PROJECT_SPEC.md     # Especificación técnica
│   ├── ROADMAP.md          # Hoja de ruta por fases
│   ├── ARCHITECTURE_WALKTHROUGH.md
│   ├── GUIA_DETALLADA_PIPELINE_ES.md
│   └── LEARNING_LOG.md     # Plantilla de diario de aprendizaje
├── src/                    # Código fuente
│   ├── ingestion/          # Python: AISStream → Kafka
│   ├── processing/         # PySpark: Streaming, bbox + Haversine / puertos
│   ├── storage/            # Verificación de persistencia en InfluxDB
│   └── web/                # Frontend base Next.js + Tailwind
├── tests/                  # Tests unitarios (Haversine / puertos)
├── notebooks/              # Análisis exploratorio (Jupyter)
└── README.md               # Este archivo

## Tests (opcional)

Sin dependencias extra (`unittest` está en la librería estándar). Desde la raíz del repo:

```powershell
$env:PYTHONPATH = "src"
python -m unittest discover -s tests -p "test_*.py" -v
```

## Fase 4 (arranque rápido)

```powershell
# 1) Stack base
docker compose up -d

# 2) Spark toolbox (si vas a ejecutar streaming)
docker compose --profile spark up -d spark

# 3) Web en Docker (opcional)
docker compose --profile web up -d web
```

## Theme system (web UI)

La capa web tiene un sistema de tema centralizado en `src/web/ui/src/theme/dashboard-theme.ts`.

- `layout`: clases base de fondo, contenedor y elementos decorativos sutiles.
- `card`: variantes de tarjetas reutilizables (`base`, `elevated`, `cta`).
- `text`: colores semánticos de texto (`title`, `muted`, `accent`).

Este enfoque reduce estilos hardcodeados en componentes y facilita iterar diseño sin tocar toda la UI.
