"""Entry point de Spark Streaming (Fase 3)."""

# Cargar configuración centralizada.
from core.config import load_processing_config
# Crear SparkSession con ajustes de ejecución.
from core.spark_session import build_spark_session
# Schema explícito del payload AIS.
from core.schema import build_ais_schema
# Sink InfluxDB para micro-batches.
from core.influx_sink import write_batch_to_influx
# Funciones de transformación en pipeline.
from core.transforms import (
    add_nearest_port_columns,
    add_processing_timestamp,
    apply_canary_geofence,
    filter_valid_coordinates,
    normalize_ais_fields,
    parse_payload_json,
    read_kafka_stream,
)


def main() -> None:
    # 1) Leer configuración (Kafka, Spark, checkpoint, bbox).
    config = load_processing_config()
    # 2) Crear sesión Spark.
    spark = build_spark_session(config)
    # 3) Construir schema AIS.
    ais_schema = build_ais_schema()

    # 4) Leer stream crudo desde Kafka.
    raw_kafka_df = read_kafka_stream(
        spark=spark,
        kafka_bootstrap_servers=config.kafka_bootstrap_servers,
        kafka_topic=config.kafka_topic_raw_ship_data,
    )
    # 5) Parsear JSON.
    parsed_df = parse_payload_json(raw_kafka_df, ais_schema)
    # 6) Normalizar columnas.
    normalized_df = normalize_ais_fields(parsed_df)
    # 7) Filtrar coordenadas no nulas.
    with_coords_df = filter_valid_coordinates(normalized_df)
    # 8) Aplicar geofencing de Canarias (bbox rápido; ver PROJECT_SPEC).
    canary_df = apply_canary_geofence(with_coords_df, config.canary_bbox)
    # 9) Distancia Haversine al puerto canario más cercano (lógica de valor).
    enriched_df = add_nearest_port_columns(canary_df)
    # 10) Añadir timestamp de procesamiento.
    output_df = add_processing_timestamp(enriched_df)

    if config.output_mode == "console":
        # 11) Salida en consola para debugging/estudio.
        query = (
            output_df.writeStream.outputMode("append")
            .format("console")
            .option("truncate", False)
            .option("numRows", 20)
            .option("checkpointLocation", f"{config.spark_checkpoint_dir}/console")
            .start()
        )
    elif config.output_mode == "influx":
        # 12) Persistencia en InfluxDB via foreachBatch.
        query = (
            output_df.writeStream.outputMode("append")
            .foreachBatch(lambda df, bid: write_batch_to_influx(df, bid, config))
            .option("checkpointLocation", f"{config.spark_checkpoint_dir}/influx")
            .start()
        )
    elif config.output_mode == "both":
        # Evitamos 2 queries paralelas sobre la misma fuente (bug observado en Spark 4.1.1).
        # En "both", escribimos en Influx y además mostramos preview del micro-batch.
        def _write_influx_and_preview(df, bid):
            print(f"[preview] batch_id={bid}")
            df.show(20, truncate=False)
            write_batch_to_influx(df, bid, config)

        query = (
            output_df.writeStream.outputMode("append")
            .foreachBatch(_write_influx_and_preview)
            .option("checkpointLocation", f"{config.spark_checkpoint_dir}/influx")
            .start()
        )
    else:
        raise ValueError("SPARK_OUTPUT_MODE inválido. Usa: console | influx | both")

    # 13) Mantener viva la query.
    query.awaitTermination()


# Ejecutar solo si se llama como script.
if __name__ == "__main__":
    main()

