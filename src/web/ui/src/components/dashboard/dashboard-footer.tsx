import { dashboardTheme } from "@/theme/dashboard-theme";

export default function DashboardFooter() {
  return (
    <footer
      className={`${dashboardTheme.card.base} bg-linear-to-r from-slate-900/85 via-slate-900/70 to-cyan-950/45 p-6 text-sm text-slate-300`}
    >
      <div className="grid gap-4 md:grid-cols-2 md:items-center">
        <div>
          <p className="text-sm font-semibold text-white">Canary Maritime Monitor</p>
          <p className="mt-1 text-xs text-slate-400">
            Demo técnica: ingestión AIS → Kafka → Spark → InfluxDB → dashboard web.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 md:justify-end">
          <a
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-slate-950/30 px-3 py-1.5 text-xs text-slate-200 hover:bg-white/5"
            href="https://github.com/drespns/canary-maritime-monitor"
            target="_blank"
            rel="noreferrer"
          >
            Repo (GitHub)
          </a>
          <a
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-slate-950/30 px-3 py-1.5 text-xs text-slate-200 hover:bg-white/5"
            href="https://linkedin.com/in/drespns/"
            target="_blank"
            rel="noreferrer"
          >
            LinkedIn
          </a>
          <a
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-slate-950/30 px-3 py-1.5 text-xs text-slate-200 hover:bg-white/5"
            href="mailto:drespns@gmail.com"
          >
            drespns@gmail.com
          </a>
        </div>
      </div>
    </footer>
  );
}
