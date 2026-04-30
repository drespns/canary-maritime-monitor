"""Comprobación rápida de que InfluxDB recibe puntos desde Spark."""

from __future__ import annotations

import os
from pathlib import Path


def _load_env() -> None:
    repo_root = Path(__file__).resolve().parents[2]
    for candidate in (repo_root / ".env", repo_root / "docker" / ".env"):
        if not candidate.exists():
            continue
        for raw in candidate.read_text(encoding="utf-8").splitlines():
            line = raw.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


def main() -> None:
    _load_env()
    from influxdb_client import InfluxDBClient

    influx_url = os.getenv("INFLUXDB_URL", "http://127.0.0.1:8086")
    influx_org = os.getenv("INFLUX_ORG", "canary-maritime")
    influx_bucket = os.getenv("INFLUX_BUCKET", "ship-metrics")
    influx_token = os.getenv("INFLUX_ADMIN_TOKEN", "")
    influx_measurement = os.getenv("INFLUX_MEASUREMENT", "ships_positions")

    if not influx_token:
        raise ValueError("INFLUX_ADMIN_TOKEN no definido en entorno/.env")

    query = f"""
from(bucket: "{influx_bucket}")
  |> range(start: -15m)
  |> filter(fn: (r) => r._measurement == "{influx_measurement}")
  |> limit(n: 5)
"""

    with InfluxDBClient(url=influx_url, token=influx_token, org=influx_org) as client:
        tables = client.query_api().query(query=query)
        rows = [record.values for table in tables for record in table.records]

    print(f"Influx rows found (last 15m): {len(rows)}")
    for row in rows[:5]:
        print(
            row.get("_time"),
            row.get("mmsi"),
            row.get("ship_name"),
            row.get("_field"),
            row.get("_value"),
        )


if __name__ == "__main__":
    main()
