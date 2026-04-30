import LiveDashboard from "@/components/live-dashboard";
import { getPipelineMetrics } from "@/lib/pipeline-metrics";

export const dynamic = "force-dynamic";

export default async function Home() {
  const initialMetrics = await getPipelineMetrics();
  return <LiveDashboard initialMetrics={initialMetrics} />;
}
