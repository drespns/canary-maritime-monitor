import { dashboardTheme } from "@/theme/dashboard-theme";

export default function DashboardFooter() {
  return (
    <footer className={`${dashboardTheme.card.base} bg-gradient-to-r from-slate-900/80 via-slate-900/70 to-cyan-950/40 p-5 text-sm text-slate-300`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-semibold text-white">Construido por dresp</p>
          <p className="text-xs text-slate-400">Proyecto portfolio · seguimiento marítimo en tiempo real</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <a className="rounded-md border border-white/15 px-3 py-1.5 hover:bg-white/5" href="https://github.com/dresp" target="_blank" rel="noreferrer">GitHub</a>
          <a className="rounded-md border border-white/15 px-3 py-1.5 hover:bg-white/5" href="https://www.linkedin.com/in/dresp" target="_blank" rel="noreferrer">LinkedIn</a>
          <a className="rounded-md border border-white/15 px-3 py-1.5 hover:bg-white/5" href="mailto:dresp.dev@gmail.com">Contacto</a>
        </div>
      </div>
    </footer>
  );
}
