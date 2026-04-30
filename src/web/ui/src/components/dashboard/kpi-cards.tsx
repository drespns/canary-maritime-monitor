import { dashboardTheme } from "@/theme/dashboard-theme";

type Props = {
  activeShips: number;
  windowMinutes: number;
  avgSog: number;
  overspeedShips: number;
  speedAlertKnots: number;
};

export default function KpiCards({
  activeShips,
  windowMinutes,
  avgSog,
  overspeedShips,
  speedAlertKnots,
}: Props) {
  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <article className={`${dashboardTheme.card.elevated} p-4`}>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Buques activos</p>
        <p className="mt-1 text-3xl font-bold text-white">{activeShips}</p>
        <p className="mt-1 text-xs text-slate-400">Ventana de {windowMinutes} minutos</p>
      </article>

      <article className={`${dashboardTheme.card.elevated} p-4`}>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">SOG media</p>
        <p className="mt-1 text-3xl font-bold text-white">{avgSog.toFixed(2)} kn</p>
        <p className="mt-1 text-xs text-slate-400">Velocidad sobre el fondo</p>
      </article>

      <article className="rounded-2xl border border-rose-500/20 bg-gradient-to-br from-rose-950/30 to-slate-900/55 p-4 shadow-lg backdrop-blur-sm">
        <p className="text-xs font-medium uppercase tracking-wide text-rose-200/80">Alertas SOG</p>
        <p className="mt-1 text-3xl font-bold text-rose-200">{overspeedShips}</p>
        <p className="mt-1 text-xs text-slate-400">SOG &gt;= {speedAlertKnots} kn</p>
      </article>

      <article className="rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-950/30 to-slate-900/55 p-4 shadow-lg backdrop-blur-sm">
        <p className="text-xs font-medium uppercase tracking-wide text-cyan-100/80">Leyenda mapa</p>
        <ul className="mt-2 space-y-1 text-xs text-slate-300">
          <li>
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 align-middle" /> &lt; 15 kn
          </li>
          <li>
            <span className="inline-block h-2 w-2 rounded-full bg-amber-400 align-middle" /> 15-25 kn
          </li>
          <li>
            <span className="inline-block h-2 w-2 rounded-full bg-rose-500 align-middle" /> &gt;= 25 kn
          </li>
        </ul>
      </article>
    </section>
  );
}
