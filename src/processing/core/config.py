import os  # Lectura de variables de entorno.
from dataclasses import dataclass  # Config tipada y clara.
from pathlib import Path  # Manejo robusto de rutas.


@dataclass(frozen=True)
class CanaryBoundingBox:
    """Bounding box de Canarias para geofencing."""

    lat_min: float
    lat_max: float
    lon_min: float
    lon_max: float


@dataclass(frozen=True)
class SparkProcessingConfig:
    """Configuración principal de Spark Structured Streaming."""

    kafka_bootstrap_servers: str
    kafka_topic_raw_ship_data: str
    spark_checkpoint_dir: str
    spark_app_name: str
    spark_master: str
    spark_shuffle_partitions: str
    spark_log_level: str
    canary_bbox: CanaryBoundingBox
    output_mode: str
    influxdb_url: str
    influxdb_org: str
    influxdb_bucket: str
    influxdb_token: str
    influxdb_measurement: str
    influxdb_batch_size: int
    influxdb_flush_interval_ms: int


def _load_env_files() -> None:
    """
    Cargar variables desde:
    - repo/.env
    - repo/docker/.env
    sin pisar variables ya definidas en el proceso.
    """
    # Subir desde src/processing/core/config.py hasta la raíz del repo.
    repo_root = Path(__file__).resolve().parents[3]
    # Lista de archivos .env candidatos.
    env_candidates = [repo_root / ".env", repo_root / "docker" / ".env"]

    # Procesar cada candidato.
    for env_path in env_candidates:
        # Saltar si no existe.
        if not env_path.exists():
            continue

        # Recorrer línea a línea.
        for raw_line in env_path.read_text(encoding="utf-8").splitlines():
            # Limpiar espacios.
            line = raw_line.strip()
            # Ignorar líneas vacías, comentarios y líneas inválidas.
            if not line or line.startswith("#") or "=" not in line:
                continue

            # Separar clave/valor solo por el primer "=".
            key, value = line.split("=", 1)
            # Limpiar clave.
            key = key.strip()
            # Limpiar valor y comillas opcionales.
            value = value.strip().strip('"').strip("'")
            # Guardar sin sobrescribir entorno existente.
            os.environ.setdefault(key, value)


def load_processing_config() -> SparkProcessingConfig:
    """Construir configuración final para el script de Spark."""
    # Cargar variables de entorno de ficheros locales.
    _load_env_files()

    # Construir bounding box de Canarias (defaults del proyecto).
    canary_bbox = CanaryBoundingBox(
        lat_min=float(os.getenv("AIS_BBOX_LAT_MIN", "27.0")),
        lat_max=float(os.getenv("AIS_BBOX_LAT_MAX", "30.0")),
        lon_min=float(os.getenv("AIS_BBOX_LON_MIN", "-19.0")),
        lon_max=float(os.getenv("AIS_BBOX_LON_MAX", "-13.0")),
    )

    # Devolver configuración tipada de Spark.
    return SparkProcessingConfig(
        # Kafka bootstrap para scripts en host Windows.
        kafka_bootstrap_servers=os.getenv("KAFKA_BOOTSTRAP_SERVERS", "127.0.0.1:9092"),
        # Topic que produce Fase 2.
        kafka_topic_raw_ship_data=os.getenv("KAFKA_TOPIC_RAW_SHIP_DATA", "raw-ship-data"),
        # Checkpoint local de la query de streaming.
        spark_checkpoint_dir=os.getenv(
            "SPARK_CHECKPOINT_DIR", "tmp/spark-checkpoints/raw-ship-data"
        ),
        # Nombre visible en Spark UI.
        spark_app_name=os.getenv("SPARK_APP_NAME", "CanaryMaritimeSparkStreaming"),
        # Master local para entorno dev.
        spark_master=os.getenv("SPARK_MASTER", "local[*]"),
        # Particiones de shuffle para reducir carga en local.
        spark_shuffle_partitions=os.getenv("SPARK_SHUFFLE_PARTITIONS", "2"),
        # Nivel de log en SparkContext.
        spark_log_level=os.getenv("SPARK_LOG_LEVEL", "WARN"),
        # Caja geográfica a usar en filtro.
        canary_bbox=canary_bbox,
        # Salida del stream: console | influx | both
        output_mode=os.getenv("SPARK_OUTPUT_MODE", "console").lower(),
        # InfluxDB sink (Fase 4).
        influxdb_url=os.getenv("INFLUXDB_URL", "http://127.0.0.1:8086"),
        influxdb_org=os.getenv("INFLUX_ORG", "canary-maritime"),
        influxdb_bucket=os.getenv("INFLUX_BUCKET", "ship-metrics"),
        influxdb_token=os.getenv("INFLUX_ADMIN_TOKEN", ""),
        influxdb_measurement=os.getenv("INFLUX_MEASUREMENT", "ships_positions"),
        influxdb_batch_size=int(os.getenv("INFLUX_BATCH_SIZE", "500")),
        influxdb_flush_interval_ms=int(os.getenv("INFLUX_FLUSH_INTERVAL_MS", "1000")),
    )

