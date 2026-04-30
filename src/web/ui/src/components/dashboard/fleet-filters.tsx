import type { FleetFiltersProps } from "@/components/dashboard/types";

export default function FleetFilters({
  searchQuery,
  portFilter,
  portOptions,
  onSearchChange,
  onPortChange,
}: FleetFiltersProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/45 p-4 backdrop-blur-sm">
      <h2 className="text-sm font-semibold text-white">Filtros</h2>
      <p className="mt-1 text-xs text-slate-400">MMSI o nombre parcial; puerto por cercanía calculada.</p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar MMSI o nombre..."
          className="w-full flex-1 rounded-lg border border-white/15 bg-slate-950/60 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400/60 focus:outline-none focus:ring-1 focus:ring-cyan-400/40"
        />
        <select
          value={portFilter}
          onChange={(e) => onPortChange(e.target.value)}
          className="w-full rounded-lg border border-white/15 bg-slate-950/60 px-3 py-2 text-sm text-white focus:border-cyan-400/60 focus:outline-none focus:ring-1 focus:ring-cyan-400/40 sm:w-56"
        >
          <option value="__all__">Todos los puertos</option>
          {portOptions.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
