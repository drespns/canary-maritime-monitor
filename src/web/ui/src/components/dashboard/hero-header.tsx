import { dashboardTheme } from "@/theme/dashboard-theme";
import { memo, useEffect, useState } from "react";

type Props = {
  autoRefresh: boolean;
  onToggleAutoRefresh: () => void;
  onOpenReadme: () => void;
  onOpenDictionary: () => void;
};

function HeroHeader({
  autoRefresh,
  onToggleAutoRefresh,
  onOpenReadme,
  onOpenDictionary,
}: Props) {
  const [clockLabel, setClockLabel] = useState(() =>
    new Date().toLocaleTimeString("es-ES")
  );

  useEffect(() => {
    const id = window.setInterval(() => {
      setClockLabel(new Date().toLocaleTimeString("es-ES"));
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

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
            <span className="font-semibold text-cyan-200">Última lectura:</span> {clockLabel}
          </p>
          <p className="mt-1">
            <span className="font-semibold text-cyan-200">Auto-actualización:</span>{" "}
            {autoRefresh ? "activa" : "pausada"}
          </p>
          <button
            type="button"
            className={`${dashboardTheme.card.cta} mt-2 w-full px-3 py-1.5 text-xs font-medium`}
            onClick={onToggleAutoRefresh}
          >
            {autoRefresh ? "Pausar actualización" : "Reanudar"}
          </button>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onOpenReadme}
              className="rounded-md border border-cyan-400/30 bg-gradient-to-r from-cyan-600/30 to-blue-600/30 px-2 py-1 text-[11px] font-semibold text-cyan-100 shadow-[0_6px_20px_-10px_rgba(34,211,238,0.7)] transition hover:from-cyan-500/40 hover:to-blue-500/40"
            >
              Ver README
            </button>
            <button
              type="button"
              onClick={onOpenDictionary}
              className="rounded-md border border-violet-400/30 bg-gradient-to-r from-violet-600/30 to-fuchsia-600/30 px-2 py-1 text-[11px] font-semibold text-violet-100 shadow-[0_6px_20px_-10px_rgba(168,85,247,0.7)] transition hover:from-violet-500/40 hover:to-fuchsia-500/40"
            >
              Glosario de datos
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

export default memo(HeroHeader);
