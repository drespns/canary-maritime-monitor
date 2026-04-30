import type { FleetTableProps } from "@/components/dashboard/types";

export default function FleetTable({
  ships,
  totalShips,
  selectedMmsi,
  onShipSelect,
}: FleetTableProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-900/45 backdrop-blur-sm">
      <div className="border-b border-white/10 px-4 py-3">
        <h2 className="text-sm font-semibold text-white">Flota filtrada</h2>
        <p className="text-xs text-slate-400">{ships.length} de {totalShips} · clic en fila para detalle</p>
      </div>
      <div className="max-h-[min(52vh,520px)] overflow-auto">
        <table className="min-w-full text-left text-xs sm:text-sm">
          <thead className="sticky top-0 z-10 bg-slate-950/95 text-[11px] uppercase tracking-wide text-slate-400 backdrop-blur">
            <tr className="border-b border-white/10">
              <th className="px-3 py-2">MMSI</th>
              <th className="px-3 py-2">Buque</th>
              <th className="px-3 py-2">SOG</th>
              <th className="hidden lg:table-cell px-3 py-2">Puerto</th>
            </tr>
          </thead>
          <tbody>
            {ships.map((ship) => {
              const active = ship.mmsi === selectedMmsi;
              return (
                <tr
                  key={ship.mmsi}
                  role="button"
                  tabIndex={0}
                  onClick={() => onShipSelect(ship.mmsi)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onShipSelect(ship.mmsi);
                    }
                  }}
                  className={`cursor-pointer border-b border-white/5 transition ${
                    active ? "bg-cyan-500/15 ring-1 ring-inset ring-cyan-400/40" : "hover:bg-white/5"
                  }`}
                >
                  <td className="px-3 py-2 font-mono text-[11px] text-slate-200">{ship.mmsi}</td>
                  <td className="max-w-[140px] truncate px-3 py-2 text-slate-100">{ship.shipName}</td>
                  <td className="px-3 py-2 text-slate-200">{ship.sog !== null ? `${ship.sog.toFixed(1)}` : "-"}</td>
                  <td className="hidden max-w-[120px] truncate px-3 py-2 text-slate-400 lg:table-cell">{ship.nearestPortName}</td>
                </tr>
              );
            })}
            {ships.length === 0 ? (
              <tr>
                <td className="px-3 py-6 text-slate-500" colSpan={4}>
                  Sin coincidencias. Ajusta filtros o espera a que lleguen datos.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
