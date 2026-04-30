from pyspark.sql import DataFrame  # Tipo DataFrame para anotaciones.
from pyspark.sql import functions as F  # Funciones SQL de Spark.
from pyspark.sql import types as T  # Tipos de Spark.

from .config import CanaryBoundingBox  # Bounding box del filtro geográfico.
from .geo import nearest_port_nm_and_name  # Distancia Haversine al puerto más cercano.
from .ports import load_canary_ports  # Lista de puertos desde JSON.


def read_kafka_stream(
    spark,
    kafka_bootstrap_servers: str,
    kafka_topic: str,
) -> DataFrame:
    """Leer stream desde Kafka usando Structured Streaming."""
    # Crear DataFrame streaming de Kafka.
    return (
        spark.readStream.format("kafka")
        .option("kafka.bootstrap.servers", kafka_bootstrap_servers)
        .option("subscribe", kafka_topic)
        .option("startingOffsets", "latest")
        .load()
    )


def parse_payload_json(raw_kafka_df: DataFrame, ais_schema: T.StructType) -> DataFrame:
    """Convertir value(binario) -> JSON parseado con schema explícito."""
    # Seleccionar value y convertirlo a string JSON.
    json_df = raw_kafka_df.select(F.col("value").cast("string").alias("payload_json"))
    # Parsear payload_json con schema y devolver columna struct "ais".
    return json_df.select(F.from_json(F.col("payload_json"), ais_schema).alias("ais"))


def normalize_ais_fields(parsed_df: DataFrame) -> DataFrame:
    """Aplanar columnas importantes para filtrado/analítica."""
    # Seleccionar campos clave en columnas planas.
    return parsed_df.select(
        F.col("ais.MetaData.MMSI").alias("mmsi"),
        F.col("ais.MetaData.ShipName").alias("ship_name"),
        F.col("ais.MetaData.time_utc").alias("time_utc"),
        F.col("ais.MessageType").alias("message_type"),
        F.col("ais.Message.PositionReport.Latitude").alias("latitude"),
        F.col("ais.Message.PositionReport.Longitude").alias("longitude"),
        F.col("ais.Message.PositionReport.Sog").alias("sog"),
        F.col("ais.Message.PositionReport.Cog").alias("cog"),
        F.col("ais.Message.PositionReport.TrueHeading").alias("true_heading"),
    )


def filter_valid_coordinates(df: DataFrame) -> DataFrame:
    """Quedarse solo con mensajes que traen lat/lon."""
    # Filtrar filas con coordenadas no nulas.
    return df.filter(F.col("latitude").isNotNull() & F.col("longitude").isNotNull())


def apply_canary_geofence(df: DataFrame, bbox: CanaryBoundingBox) -> DataFrame:
    """Aplicar geofencing por bounding box de Canarias."""
    # Filtrar por rangos lat/lon del bbox.
    return df.filter(
        (F.col("latitude") >= bbox.lat_min)
        & (F.col("latitude") <= bbox.lat_max)
        & (F.col("longitude") >= bbox.lon_min)
        & (F.col("longitude") <= bbox.lon_max)
    )


def add_nearest_port_columns(df: DataFrame) -> DataFrame:
    """
    Añade distancia Haversine al puerto canario más cercano y su nombre.

    El bbox rectangular (paso anterior) descarta barcos fuera del área de estudio de forma barata.
    Esta columna implementa la **lógica de valor** del PROJECT_SPEC: aproximar “qué puerto está
    más cerca” para downstream (alertas, ranking, futuro Influx).

    Implementación: UDF Python que reutiliza `nearest_port_nm_and_name` sobre la lista cargada
    desde `data/canary_ports.json` (o `CANARY_PORTS_JSON_PATH`).
    """
    ports = load_canary_ports()
    # Sin puertos de referencia, mantenemos el esquema estable con nulos explícitos.
    if not ports:
        return (
            df.withColumn("nearest_port_nm", F.lit(None).cast(T.DoubleType()))
            .withColumn("nearest_port_name", F.lit(None).cast(T.StringType()))
        )

    result_schema = T.StructType(
        [
            T.StructField("nearest_port_nm", T.DoubleType(), True),
            T.StructField("nearest_port_name", T.StringType(), True),
        ]
    )

    # Importante: la tupla `ports` se serializa con el UDF (lista pequeña, coste aceptable en dev).
    @F.udf(returnType=result_schema)
    def _nearest(lat, lon):
        if lat is None or lon is None:
            return None
        nm, name = nearest_port_nm_and_name(float(lat), float(lon), ports)
        return (nm, name)

    return (
        df.withColumn("_nearest_port", _nearest(F.col("latitude"), F.col("longitude")))
        .withColumn("nearest_port_nm", F.col("_nearest_port").getField("nearest_port_nm"))
        .withColumn("nearest_port_name", F.col("_nearest_port").getField("nearest_port_name"))
        .drop("_nearest_port")
    )


def add_processing_timestamp(df: DataFrame) -> DataFrame:
    """Añadir timestamp de procesamiento (lado Spark)."""
    # Agregar columna con tiempo actual de Spark.
    return df.withColumn("processed_at", F.current_timestamp())

