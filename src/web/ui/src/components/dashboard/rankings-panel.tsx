import type { RankingsProps } from "@/components/dashboard/types";

export default function RankingsPanel({
  topPorts,
  fastestShips,
  onShipSelect,
}: RankingsProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-1">
      <div className="rounded-2xl border border-white/10 bg-slate-900/45 p-4 backdrop-blur-sm">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Puertos frecuentes</h3>
        <ul className="mt-2 space-y-1.5 text-sm">
          {topPorts.map((p) => (
            <li
              key={p.name}
              className="flex justify-between gap-2 border-b border-white/5 pb-1 text-slate-200 last:border-0"
            >
              <span className="truncate">{p.name}</span>
              <span className="shrink-0 text-cyan-300">{p.vessels}</span>
            </li>
          ))}
          {topPorts.length === 0 ? <li className="text-slate-500">Sin datos</li> : null}
        </ul>
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900/45 p-4 backdrop-blur-sm">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Mayores SOG</h3>
        <ul className="mt-2 space-y-1.5 text-sm">
          {fastestShips.map((s) => (
            <li
              key={s.mmsi}
              className="flex justify-between gap-2 border-b border-white/5 pb-1 last:border-0"
            >
              <button
                type="button"
                onClick={() => onShipSelect(s.mmsi)}
                className="truncate text-left text-cyan-200 underline-offset-2 hover:underline"
              >
                {s.shipName}
              </button>
              <span className="shrink-0 text-slate-200">{s.sog.toFixed(1)} kn</span>
            </li>
          ))}
          {fastestShips.length === 0 ? <li className="text-slate-500">Sin datos</li> : null}
        </ul>
      </div>
    </div>
  );
}
