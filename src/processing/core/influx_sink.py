"""Sink de Spark micro-batch hacia InfluxDB 2.x."""

from __future__ import annotations

from typing import Any


def _row_to_point(row: Any, measurement: str):
    """Transforma una fila Spark en un Point de InfluxDB."""
    from influxdb_client import Point

    point = Point(measurement)

    # Tags: útiles para filtrado/agrupación en consultas.
    point = point.tag("mmsi", str(row.mmsi) if row.mmsi is not None else "unknown")
    if row.ship_name is not None:
        point = point.tag("ship_name", str(row.ship_name))
    if row.nearest_port_name is not None:
        point = point.tag("nearest_port_name", str(row.nearest_port_name))

    # Fields numéricos/estado.
    if row.latitude is not None:
        point = point.field("latitude", float(row.latitude))
    if row.longitude is not None:
        point = point.field("longitude", float(row.longitude))
    if row.sog is not None:
        point = point.field("sog", float(row.sog))
    if row.cog is not None:
        point = point.field("cog", float(row.cog))
    if row.true_heading is not None:
        point = point.field("true_heading", float(row.true_heading))
    if row.nearest_port_nm is not None:
        point = point.field("nearest_port_nm", float(row.nearest_port_nm))
    if row.message_type is not None:
        point = point.field("message_type", str(row.message_type))

    # Timestamp de evento procesado por Spark.
    if row.processed_at is not None:
        point = point.time(row.processed_at)

    return point


def write_batch_to_influx(batch_df, batch_id: int, config) -> None:
    """Escribe un micro-batch de Spark en InfluxDB usando batching."""
    if batch_df.rdd.isEmpty():
        return

    from influxdb_client import InfluxDBClient
    from influxdb_client.client.write_api import WriteOptions

    selected = batch_df.select(
        "mmsi",
        "ship_name",
        "message_type",
        "latitude",
        "longitude",
        "sog",
        "cog",
        "true_heading",
        "nearest_port_nm",
        "nearest_port_name",
        "processed_at",
    )

    with InfluxDBClient(
        url=config.influxdb_url,
        token=config.influxdb_token,
        org=config.influxdb_org,
    ) as client:
        write_api = client.write_api(
            write_options=WriteOptions(
                batch_size=config.influxdb_batch_size,
                flush_interval=config.influxdb_flush_interval_ms,
            )
        )

        buffer = []
        for row in selected.toLocalIterator():
            buffer.append(_row_to_point(row, config.influxdb_measurement))
            if len(buffer) >= config.influxdb_batch_size:
                write_api.write(
                    bucket=config.influxdb_bucket,
                    org=config.influxdb_org,
                    record=buffer,
                )
                buffer.clear()

        if buffer:
            write_api.write(
                bucket=config.influxdb_bucket,
                org=config.influxdb_org,
                record=buffer,
            )

        write_api.flush()
        print(f"[influx-sink] batch_id={batch_id} written")
