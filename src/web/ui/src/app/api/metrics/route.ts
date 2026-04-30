import { NextResponse } from "next/server";
import { getPipelineMetrics } from "@/lib/pipeline-metrics";

export async function GET() {
  try {
    const metrics = await getPipelineMetrics();
    return NextResponse.json({
      ...metrics,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "metrics_unavailable",
        detail: error instanceof Error ? error.message : "unknown",
      },
      { status: 500 }
    );
  }
}
