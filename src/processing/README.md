# PySpark: Streaming & Geofencing

Implementación de Fase 3:

- Lee desde Kafka topic `raw-ship-data`.
- Parsea JSON AIS con schema explícito.
- Filtra barcos por **bounding box** de Canarias (rápido, según `docs/PROJECT_SPEC.md`).
- Calcula distancia **Haversine** al **puerto canario más cercano** (lista en `data/canary_ports.json`).
- Imprime salida en consola (checkpoint incluido).

Fase 4 (persistencia):

- Escribe micro-batches en InfluxDB con `foreachBatch` cuando `SPARK_OUTPUT_MODE=influx|both`.

## Script principal

- `spark_stream.py`
- `core/config.py`: carga de entorno y parámetros Spark/Kafka/geofence.
- `core/spark_session.py`: construcción de SparkSession.
- `core/schema.py`: schema explícito del payload AIS.
- `core/transforms.py`: pipeline Kafka → JSON → normalización → bbox → **puerto más cercano** → timestamp.
- `core/geo.py`: fórmula de Haversine en millas náuticas (núcleo reutilizable y testeable).
- `core/ports.py`: carga del JSON de puertos.
- `core/influx_sink.py`: serializa filas de Spark y escribe puntos en InfluxDB con batching.

## Datos de puertos

Archivo por defecto: `src/processing/data/canary_ports.json` (nombre, lat, lon en WGS84). Puedes ampliarlo o sustituirlo:

- Variable de entorno **`CANARY_PORTS_JSON_PATH`**: ruta absoluta o relativa al directorio de trabajo desde el que lanzas Spark (host o contenedor).

## Variables útiles

- `KAFKA_BOOTSTRAP_SERVERS` (default: `127.0.0.1:9092`)
- `KAFKA_TOPIC_RAW_SHIP_DATA` (default: `raw-ship-data`)
- `SPARK_CHECKPOINT_DIR` (default: `tmp/spark-checkpoints/raw-ship-data`)
- `CANARY_PORTS_JSON_PATH` (opcional; sustituye el JSON empaquetado)
- `AIS_BBOX_*` (opcional; mismos límites que ingestión/spec si quieres alinearlos por entorno)
- `SPARK_OUTPUT_MODE` (default: `console`; `influx` o `both`)
- `INFLUXDB_URL` (default: `http://127.0.0.1:8086`)
- `INFLUX_MEASUREMENT` (default: `ships_positions`)
- `INFLUX_BATCH_SIZE` (default: `500`)
- `INFLUX_FLUSH_INTERVAL_MS` (default: `1000`)

## Ejecución local (Windows / PowerShell)

> Requisito: tener Spark + conector Kafka para Spark disponible.

```powershell
python src/processing/spark_stream.py
```

Si usas `spark-submit`:

```powershell
spark-submit src/processing/spark_stream.py
```

## Ejecución recomendada con Docker (sin pelear con Java/Winutils)

1) Levanta Spark toolbox (perfil `spark`):

```powershell
docker compose --profile spark up -d spark
```

2) Ejecuta el job de Spark dentro del contenedor:

```powershell
docker compose --profile spark exec spark /opt/spark/bin/spark-submit --conf spark.jars.ivy=/tmp/.ivy2 --conf spark.driver.extraJavaOptions="-Divy.home=/tmp/.ivy2 -Divy.cache.dir=/tmp/.ivy2/cache" --packages org.apache.spark:spark-sql-kafka-0-10_2.13:4.1.1 /app/src/processing/spark_stream.py
```

3) Para activar persistencia en Influx desde el mismo job:

```powershell
docker compose --profile spark exec spark /bin/sh -lc "pip install influxdb-client && export SPARK_OUTPUT_MODE=both && /opt/spark/bin/spark-submit --conf spark.jars.ivy=/tmp/.ivy2 --conf spark.driver.extraJavaOptions='-Divy.home=/tmp/.ivy2 -Divy.cache.dir=/tmp/.ivy2/cache' --packages org.apache.spark:spark-sql-kafka-0-10_2.13:4.1.1 /app/src/processing/spark_stream.py"
```

Notas:

- `/app` es el repo montado dentro del contenedor (`../:/app` en compose).
- En Docker, Kafka se consume por `kafka:19092` (listener interno de la red Docker).

### Nota importante sobre `SPARK_OUTPUT_MODE=both`

Para evitar un fallo observado en Spark 4.1.1 con dos queries paralelas sobre la misma
fuente Kafka, el modo `both` se implementa con **una sola query** (`foreachBatch`) que:

1) muestra preview en consola (`df.show(...)`)
2) escribe en InfluxDB

### Error conocido: `KafkaMicroBatchStream.metrics` NullPointerException

Si ves algo como:

`Cannot invoke "scala.collection.IterableOps.map(...)" ... KafkaMicroBatchStream.metrics`

es un bug observado en Spark 4.1.1 con la fuente Kafka. El proyecto ya incluye
workaround en `core/spark_session.py`:

- `spark.sql.streaming.metricsEnabled=false`

## Troubleshooting rápido

- Error `ModuleNotFoundError: No module named 'core'` en Spark workers:
  - Ya está mitigado desde `core/spark_session.py` propagando `PYTHONPATH`.
  - Si lanzas comandos manuales fuera de este flujo, añade:

```powershell
docker compose --profile spark exec spark /bin/sh -lc "export PYTHONPATH=/app/src/processing && /opt/spark/bin/spark-submit --conf spark.jars.ivy=/tmp/.ivy2 --conf spark.driver.extraJavaOptions='-Divy.home=/tmp/.ivy2 -Divy.cache.dir=/tmp/.ivy2/cache' --packages org.apache.spark:spark-sql-kafka-0-10_2.13:4.1.1 /app/src/processing/spark_stream.py"
```
