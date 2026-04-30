import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    project: "canary-maritime-monitor",
    phase: "4",
    checks: {
      kafka: "configured-via-docker-compose",
      spark: "streaming-ready",
      influxdb: process.env.INFLUXDB_URL ?? "http://127.0.0.1:8086",
      grafana: "http://127.0.0.1:3000",
    },
    timestamp: new Date().toISOString(),
  });
}
