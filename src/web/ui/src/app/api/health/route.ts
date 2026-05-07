import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const expectedKey = process.env.HEALTH_API_KEY;
  if (expectedKey) {
    const auth = request.headers.get("authorization") ?? "";
    const provided = auth.startsWith("Bearer ") ? auth.slice("Bearer ".length) : "";
    if (!provided || provided !== expectedKey) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  return NextResponse.json(
    {
      status: "ok",
      project: "canary-maritime-monitor",
      phase: "4",
      checks: {
        kafka: "configured-via-docker-compose",
        spark: "streaming-ready",
        influxdb: process.env.INFLUXDB_URL ? "configured" : "missing",
        grafana: "configured-via-docker-compose",
      },
      timestamp: new Date().toISOString(),
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}
