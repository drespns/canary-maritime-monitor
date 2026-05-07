import { dashboardTheme } from "@/theme/dashboard-theme";

type Props = {
  activeShips: number;
  windowMinutes: number;
  avgSog: number;
  overspeedShips: number;
  speedAlertKnots: number;
  stoppedHiddenCount: number;
  stoppedThresholdKnots: number;
};

export default function KpiCards({
  activeShips,
  windowMinutes,
  avgSog,
  overspeedShips,
  speedAlertKnots,
  stoppedHiddenCount,
  stoppedThresholdKnots,
}: Props) {
  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <article className={`${dashboardTheme.card.elevated} p-4`}>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Buques visibles</p>
        <p className="mt-1 text-3xl font-bold text-white">{activeShips}</p>
        <p className="mt-1 text-xs text-slate-400">Ventana de {windowMinutes} minutos</p>
      </article>

      <article className={`${dashboardTheme.card.elevated} p-4`}>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">SOG media</p>
        <p className="mt-1 text-3xl font-bold text-white">{avgSog.toFixed(2)} kn</p>
        <p className="mt-1 text-xs text-slate-400">Velocidad sobre el fondo</p>
      </article>

      <article className="rounded-2xl border border-rose-500/20 bg-linear-to-br from-rose-950/30 to-slate-900/55 p-4 shadow-lg backdrop-blur-sm">
        <p className="text-xs font-medium uppercase tracking-wide text-rose-200/80">Alertas SOG</p>
        <p className="mt-1 text-3xl font-bold text-rose-200">{overspeedShips}</p>
        <p className="mt-1 text-xs text-slate-400">SOG &gt;= {speedAlertKnots} kn</p>
      </article>

      <article className="rounded-2xl border border-cyan-500/20 bg-linear-to-br from-cyan-950/30 to-slate-900/55 p-4 shadow-lg backdrop-blur-sm">
        <p className="text-xs font-medium uppercase tracking-wide text-cyan-100/80">Parados ocultos</p>
        <p className="mt-1 text-3xl font-bold text-cyan-100">{stoppedHiddenCount}</p>
        <p className="mt-1 text-xs text-slate-400">SOG &lt; {stoppedThresholdKnots.toFixed(1)} kn</p>
      </article>
    </section>
  );
}
