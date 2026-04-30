from pyspark.sql import types as T  # Tipos y schema de Spark.


def build_ais_schema() -> T.StructType:
    """
    Schema mínimo para Fase 3:
    - MessageType
    - MetaData (MMSI, ShipName, time_utc)
    - Message.PositionReport (lat/lon/sog/cog/heading)
    """
    # Subschema para PositionReport.
    position_report_schema = T.StructType(
        [
            T.StructField("Latitude", T.DoubleType(), True),
            T.StructField("Longitude", T.DoubleType(), True),
            T.StructField("Sog", T.DoubleType(), True),
            T.StructField("Cog", T.DoubleType(), True),
            T.StructField("TrueHeading", T.DoubleType(), True),
        ]
    )

    # Subschema para Message.
    message_schema = T.StructType(
        [
            T.StructField("PositionReport", position_report_schema, True),
        ]
    )

    # Subschema para MetaData.
    metadata_schema = T.StructType(
        [
            T.StructField("MMSI", T.LongType(), True),
            T.StructField("ShipName", T.StringType(), True),
            T.StructField("time_utc", T.StringType(), True),
        ]
    )

    # Schema raíz del JSON en Kafka.
    return T.StructType(
        [
            T.StructField("MessageType", T.StringType(), True),
            T.StructField("MetaData", metadata_schema, True),
            T.StructField("Message", message_schema, True),
        ]
    )

