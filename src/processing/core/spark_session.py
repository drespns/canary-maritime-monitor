from pyspark.sql import SparkSession  # Punto de entrada de PySpark.

from .config import SparkProcessingConfig  # Config tipada.


def build_spark_session(config: SparkProcessingConfig) -> SparkSession:
    """Crear sesión Spark con parámetros de ejecución local."""
    # Este path contiene el paquete `core` (src/processing/core/*).
    # Lo propagamos al driver y workers para evitar:
    # ModuleNotFoundError: No module named 'core'
    processing_src_path = "/app/src/processing"

    # Construir SparkSession con configuración centralizada.
    spark = (
        SparkSession.builder.appName(config.spark_app_name)
        .master(config.spark_master)
        .config("spark.sql.shuffle.partitions", config.spark_shuffle_partitions)
        .config("spark.executorEnv.PYTHONPATH", processing_src_path)
        .config("spark.driverEnv.PYTHONPATH", processing_src_path)
        # Workaround Spark 4.1.1 + Kafka source:
        # evita NPE en KafkaMicroBatchStream.metrics(...) al cerrar progreso del batch.
        .config("spark.sql.streaming.metricsEnabled", "false")
        .getOrCreate()
    )
    # Ajustar nivel de log para no inundar terminal.
    spark.sparkContext.setLogLevel(config.spark_log_level)
    # Devolver sesión lista para usar.
    return spark

