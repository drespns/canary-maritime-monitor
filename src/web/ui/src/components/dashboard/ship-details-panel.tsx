import type { ShipDetailsProps } from "@/components/dashboard/types";

export default function ShipDetailsPanel({
  selectedShip,
  selectedIsFilteredOut,
}: ShipDetailsProps) {
  return (
    <div className="flex min-h-[280px] flex-1 flex-col rounded-2xl border border-cyan-500/25 bg-gradient-to-b from-slate-900/65 to-cyan-950/20 p-4 shadow-lg backdrop-blur-sm">
      <h2 className="text-sm font-semibold text-cyan-100">Detalle del buque</h2>
      {selectedShip && selectedIsFilteredOut ? (
        <p className="mt-2 rounded-lg border border-amber-400/30 bg-amber-950/30 px-2 py-1.5 text-xs text-amber-100/90">
          Este buque no coincide con el filtro actual; sigue visible en el mapa y aquí por si lo elegiste desde el ranking o el mapa.
        </p>
      ) : null}

      {selectedShip ? (
        <dl className="mt-3 space-y-2 text-sm">
          <div>
            <dt className="text-xs uppercase text-slate-500">Nombre</dt>
            <dd className="font-medium text-white">{selectedShip.shipName}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-slate-500">MMSI</dt>
            <dd className="font-mono text-slate-200">{selectedShip.mmsi}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-slate-500">SOG</dt>
            <dd className="text-slate-100">{selectedShip.sog !== null ? `${selectedShip.sog.toFixed(2)} kn` : "-"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-slate-500">Puerto cercano</dt>
            <dd className="text-slate-100">{selectedShip.nearestPortName}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-slate-500">Distancia</dt>
            <dd className="text-slate-100">{selectedShip.nearestPortNm !== null ? `${selectedShip.nearestPortNm.toFixed(2)} NM` : "-"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-slate-500">Posición</dt>
            <dd className="font-mono text-xs text-slate-300">
              {selectedShip.latitude !== null && selectedShip.longitude !== null
                ? `${selectedShip.latitude.toFixed(4)}, ${selectedShip.longitude.toFixed(4)}`
                : "-"}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-slate-500">Último avistamiento</dt>
            <dd className="text-slate-300">{new Date(selectedShip.seenAt).toLocaleString("es-ES")}</dd>
          </div>
        </dl>
      ) : (
        <p className="mt-4 text-sm leading-relaxed text-slate-400">
          Elige un buque en la tabla o pulsa un punto en el mapa. Aquí verás MMSI, velocidad, puerto de referencia y coordenadas.
        </p>
      )}
    </div>
  );
}
