import { InfluxDB } from "@influxdata/influxdb-client";

export type ShipSnapshot = {
  mmsi: string;
  shipName: string;
  nearestPortName: string;
  sog: number | null;
  nearestPortNm: number | null;
  latitude: number | null;
  longitude: number | null;
  seenAt: string;
};

export type PipelineMetrics = {
  activeShips: number;
  avgSog: number;
  overspeedShips: number;
  speedAlertKnots: number;
  windowMinutes: number;
  ships: ShipSnapshot[];
  topPorts: Array<{ name: string; vessels: number }>;
  fastestShips: Array<{ mmsi: string; shipName: string; sog: number }>;
  warning?: string;
};

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function emptyMetrics(
  speedAlertKnots: number,
  warning?: string
): PipelineMetrics {
  return {
    activeShips: 0,
    avgSog: 0,
    overspeedShips: 0,
    speedAlertKnots,
    windowMinutes: 15,
    ships: [],
    topPorts: [],
    fastestShips: [],
    warning,
  };
}

export async function getPipelineMetrics(): Promise<PipelineMetrics> {
  const influxUrl = process.env.INFLUXDB_URL ?? "http://127.0.0.1:8086";
  const influxOrg = process.env.INFLUX_ORG ?? "canary-maritime";
  const influxBucket = process.env.INFLUX_BUCKET ?? "ship-metrics";
  const influxToken = process.env.INFLUX_ADMIN_TOKEN ?? "";
  const measurement = process.env.INFLUX_MEASUREMENT ?? "ships_positions";
  const speedAlertKnots = Number(process.env.WEB_SPEED_ALERT_KNOTS ?? "25");

  if (!influxToken) {
    return emptyMetrics(
      speedAlertKnots,
      "INFLUX_ADMIN_TOKEN no definido en entorno web."
    );
  }

  const client = new InfluxDB({ url: influxUrl, token: influxToken });
  const queryApi = client.getQueryApi(influxOrg);

  const flux = `
from(bucket: "${influxBucket}")
  |> range(start: -15m)
  |> filter(fn: (r) => r._measurement == "${measurement}")
  |> filter(fn: (r) => r._field == "sog" or r._field == "nearest_port_nm" or r._field == "latitude" or r._field == "longitude")
`;

  type FluxRow = {
    _time?: string;
    _field?: string;
    _value?: unknown;
    mmsi?: string;
    ship_name?: string;
    nearest_port_name?: string;
  };

  const rows = await queryApi.collectRows<FluxRow>(flux);
  const byMmsi = new Map<string, ShipSnapshot>();

  for (const row of rows) {
    const mmsi = row.mmsi ?? "unknown";
    const seenAt = row._time ?? new Date().toISOString();
    const existing = byMmsi.get(mmsi) ?? {
      mmsi,
      shipName: row.ship_name ?? "N/A",
      nearestPortName: row.nearest_port_name ?? "N/A",
      sog: null,
      nearestPortNm: null,
      latitude: null,
      longitude: null,
      seenAt,
    };

    if (seenAt > existing.seenAt) {
      existing.seenAt = seenAt;
      existing.shipName = row.ship_name ?? existing.shipName;
      existing.nearestPortName = row.nearest_port_name ?? existing.nearestPortName;
    }

    if (row._field === "sog") existing.sog = asNumber(row._value);
    if (row._field === "nearest_port_nm")
      existing.nearestPortNm = asNumber(row._value);
    if (row._field === "latitude") existing.latitude = asNumber(row._value);
    if (row._field === "longitude") existing.longitude = asNumber(row._value);

    byMmsi.set(mmsi, existing);
  }

  const ships = [...byMmsi.values()]
    .sort((a, b) => (b.sog ?? -1) - (a.sog ?? -1))
    .slice(0, 25);

  const withSog = ships.filter((s) => s.sog !== null) as Array<
    ShipSnapshot & { sog: number }
  >;
  const avgSog =
    withSog.length > 0
      ? withSog.reduce((acc, s) => acc + s.sog, 0) / withSog.length
      : 0;
  const overspeedShips = withSog.filter((s) => s.sog >= speedAlertKnots).length;
  const fastestShips = withSog
    .slice()
    .sort((a, b) => b.sog - a.sog)
    .slice(0, 5)
    .map((s) => ({ mmsi: s.mmsi, shipName: s.shipName, sog: s.sog }));

  const portCounter = new Map<string, number>();
  for (const ship of ships) {
    const key = ship.nearestPortName || "N/A";
    portCounter.set(key, (portCounter.get(key) ?? 0) + 1);
  }
  const topPorts = [...portCounter.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, vessels]) => ({ name, vessels }));

  return {
    activeShips: ships.length,
    avgSog,
    overspeedShips,
    speedAlertKnots,
    windowMinutes: 15,
    ships,
    topPorts,
    fastestShips,
  };
}
