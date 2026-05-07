import { InfluxDB } from "@influxdata/influxdb-client";
import {
  classifyShipOperator,
  isDisplayableShip,
  type ShipOperatorId,
} from "@/lib/ship-operator";

export type ShipSnapshot = {
  mmsi: string;
  shipName: string;
  nearestPortName: string;
  sog: number | null;
  nearestPortNm: number | null;
  latitude: number | null;
  longitude: number | null;
  seenAt: string;
  operatorId: ShipOperatorId;
  operatorLabel: string;
  operatorColor: string;
  operatorLogoSlug: string;
};

/** Fila agregada desde Influx antes de clasificar operador. */
type ShipSnapshotInflux = Omit<
  ShipSnapshot,
  "operatorId" | "operatorLabel" | "operatorColor" | "operatorLogoSlug"
>;

export type ShipTrackPoint = {
  latitude: number;
  longitude: number;
  seenAt: string;
  sog: number | null;
};

export type ShipTrack = {
  mmsi: string;
  shipName: string;
  points: ShipTrackPoint[];
  operatorColor: string;
};

export type FastestShipEntry = {
  mmsi: string;
  shipName: string;
  sog: number;
  operatorId: ShipOperatorId;
  operatorLabel: string;
  operatorColor: string;
  operatorLogoSlug: string;
};

export type PipelineMetrics = {
  activeShips: number;
  avgSog: number;
  overspeedShips: number;
  speedAlertKnots: number;
  /** Umbral para considerar un buque "parado" en UI (kn). */
  stoppedThresholdKnots: number;
  windowMinutes: number;
  /** Límite efectivo aplicado al listado (10–200). */
  shipsLimit: number;
  ships: ShipSnapshot[];
  shipTracks: ShipTrack[];
  topPorts: Array<{ name: string; vessels: number }>;
  fastestShips: FastestShipEntry[];
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
  stoppedThresholdKnots: number,
  shipsLimit: number,
  warning?: string
): PipelineMetrics {
  return {
    activeShips: 0,
    avgSog: 0,
    overspeedShips: 0,
    speedAlertKnots,
    stoppedThresholdKnots,
    windowMinutes: 15,
    ships: [],
    shipTracks: [],
    topPorts: [],
    fastestShips: [],
    shipsLimit,
    warning,
  };
}

function clampShipsLimit(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return 60;
  return Math.min(Math.max(Math.floor(n), 10), 200);
}

export async function getPipelineMetrics(limitOverride?: number): Promise<PipelineMetrics> {
  const influxUrl = process.env.INFLUXDB_URL ?? "http://127.0.0.1:8086";
  const influxOrg = process.env.INFLUX_ORG ?? "canary-maritime";
  const influxBucket = process.env.INFLUX_BUCKET ?? "ship-metrics";
  const influxToken = process.env.INFLUX_ADMIN_TOKEN ?? "";
  const measurement = process.env.INFLUX_MEASUREMENT ?? "ships_positions";
  const speedAlertKnots = Number(process.env.WEB_SPEED_ALERT_KNOTS ?? "25");
  const stoppedThresholdKnots = Number(process.env.WEB_STOPPED_SOG_KNOTS ?? "0.6");
  const trackPointsLimit = Number(process.env.WEB_TRACK_POINTS ?? "12");
  const fromEnv = clampShipsLimit(process.env.WEB_SHIPS_LIMIT ?? "60");
  const shipsLimit = limitOverride !== undefined ? clampShipsLimit(limitOverride) : fromEnv;

  if (!influxToken) {
    return emptyMetrics(
      speedAlertKnots,
      Number.isFinite(stoppedThresholdKnots) ? stoppedThresholdKnots : 0.6,
      shipsLimit,
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
  const byMmsi = new Map<string, ShipSnapshotInflux>();
  const byMmsiAndTime = new Map<
    string,
    { mmsi: string; seenAt: string; shipName: string; latitude: number | null; longitude: number | null; sog: number | null }
  >();

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

    const key = `${mmsi}|${seenAt}`;
    const point = byMmsiAndTime.get(key) ?? {
      mmsi,
      seenAt,
      shipName: row.ship_name ?? existing.shipName,
      latitude: null,
      longitude: null,
      sog: null,
    };
    if (row._field === "latitude") point.latitude = asNumber(row._value);
    if (row._field === "longitude") point.longitude = asNumber(row._value);
    if (row._field === "sog") point.sog = asNumber(row._value);
    byMmsiAndTime.set(key, point);
  }

  const displayable: ShipSnapshotInflux[] = [...byMmsi.values()].filter((s) =>
    isDisplayableShip(s.mmsi, s.shipName)
  );

  const ships: ShipSnapshot[] = displayable
    .sort((a, b) => (b.sog ?? -1) - (a.sog ?? -1))
    .slice(0, shipsLimit)
    .map((s) => {
      const op = classifyShipOperator(s.mmsi, s.shipName);
      return {
        ...s,
        operatorId: op.id,
        operatorLabel: op.label,
        operatorColor: op.color,
        operatorLogoSlug: op.logoSlug,
      };
    });

  const withSog = ships.filter((s) => s.sog !== null) as Array<
    ShipSnapshot & { sog: number }
  >;
  const avgSog =
    withSog.length > 0
      ? withSog.reduce((acc, s) => acc + s.sog, 0) / withSog.length
      : 0;
  const overspeedShips = withSog.filter((s) => s.sog >= speedAlertKnots).length;
  const fastestShips: FastestShipEntry[] = withSog
    .slice()
    .sort((a, b) => b.sog - a.sog)
    .slice(0, 5)
    .map((s) => ({
      mmsi: s.mmsi,
      shipName: s.shipName,
      sog: s.sog,
      operatorId: s.operatorId,
      operatorLabel: s.operatorLabel,
      operatorColor: s.operatorColor,
      operatorLogoSlug: s.operatorLogoSlug,
    }));

  const portCounter = new Map<string, number>();
  for (const ship of ships) {
    const key = ship.nearestPortName || "N/A";
    portCounter.set(key, (portCounter.get(key) ?? 0) + 1);
  }
  const topPorts = [...portCounter.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, vessels]) => ({ name, vessels }));

  const shipsByMmsi = new Set(ships.map((s) => s.mmsi));
  const shipColorByMmsi = new Map(ships.map((s) => [s.mmsi, s.operatorColor]));
  const shipTracks = [...byMmsiAndTime.values()]
    .filter((p) => shipsByMmsi.has(p.mmsi) && p.latitude !== null && p.longitude !== null)
    .sort((a, b) => a.seenAt.localeCompare(b.seenAt))
    .reduce<Map<string, ShipTrack>>((acc, point) => {
      const existing =
        acc.get(point.mmsi) ??
        ({
          mmsi: point.mmsi,
          shipName: point.shipName || "N/A",
          points: [],
          operatorColor: shipColorByMmsi.get(point.mmsi) ?? "#64748b",
        } satisfies ShipTrack);
      existing.points.push({
        latitude: point.latitude as number,
        longitude: point.longitude as number,
        seenAt: point.seenAt,
        sog: point.sog,
      });
      acc.set(point.mmsi, existing);
      return acc;
    }, new Map<string, ShipTrack>());

  const normalizedTracks = [...shipTracks.values()].map((track) => ({
    ...track,
    operatorColor: shipColorByMmsi.get(track.mmsi) ?? track.operatorColor,
    points: track.points.slice(-Math.max(2, trackPointsLimit)),
  }));

  return {
    activeShips: ships.length,
    avgSog,
    overspeedShips,
    speedAlertKnots,
    stoppedThresholdKnots: Number.isFinite(stoppedThresholdKnots) ? stoppedThresholdKnots : 0.6,
    windowMinutes: 15,
    shipsLimit,
    ships,
    shipTracks: normalizedTracks,
    topPorts,
    fastestShips,
  };
}
