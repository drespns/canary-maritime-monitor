import { dashboardTheme } from "@/theme/dashboard-theme";

type Props = {
  generatedAtLabel: string;
  autoRefresh: boolean;
  isRefreshing: boolean;
  onToggleAutoRefresh: () => void;
};

export default function HeroHeader({
  generatedAtLabel,
  autoRefresh,
  isRefreshing,
  onToggleAutoRefresh,
}: Props) {
  return (
    <header className={`${dashboardTheme.card.base} relative overflow-hidden bg-slate-950/70 p-6 shadow-[0_20px_60px_-30px_rgba(34,211,238,0.35)]`}>
      <div className="pointer-events-none absolute -top-16 right-10 h-56 w-56 rounded-full bg-cyan-500/12 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 left-10 h-56 w-56 rounded-full bg-violet-500/10 blur-3xl" />

      <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300/90">
            Canarias · vigilancia marítima en tiempo real
          </p>
          <h1 className={`text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl ${dashboardTheme.text.title}`}>
            Centro de Situación Marítima
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-base">
            Vista operativa unificada de posiciones AIS: detección de velocidad, distribución por
            puertos de referencia y seguimiento visual de la flota activa.
          </p>
        </div>

        <div className="min-w-[220px] rounded-xl border border-white/15 bg-slate-900/70 p-3 text-xs text-slate-200 shadow-inner">
          <p>
            <span className="font-semibold text-cyan-200">Última lectura:</span> {generatedAtLabel}
          </p>
          <p className="mt-1">
            <span className="font-semibold text-cyan-200">Auto-actualización:</span>{" "}
            {autoRefresh ? "activa" : "pausada"}
            {isRefreshing ? " · sincronizando..." : ""}
          </p>
          <button
            type="button"
            className={`${dashboardTheme.card.cta} mt-2 w-full px-3 py-1.5 text-xs font-medium`}
            onClick={onToggleAutoRefresh}
          >
            {autoRefresh ? "Pausar actualización" : "Reanudar"}
          </button>
        </div>
      </div>
    </header>
  );
}
