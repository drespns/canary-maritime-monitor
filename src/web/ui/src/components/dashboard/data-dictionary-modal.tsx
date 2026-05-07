"use client";

import { useMemo, useState } from "react";
import InfoModal from "@/components/dashboard/info-modal";

type Props = {
  open: boolean;
  onClose: () => void;
};

const entries: Array<{ term: string; meaning: string; usage: string }> = [
  {
    term: "MMSI",
    meaning: "Maritime Mobile Service Identity, identificador único del buque.",
    usage: "Clave principal para agrupar lecturas y construir el snapshot por barco.",
  },
  {
    term: "SOG (kn)",
    meaning: "Speed Over Ground en nudos náuticos.",
    usage: "Se usa para promedio, ranking de velocidad y alertas por umbral.",
  },
  {
    term: "kn (knot / nudo)",
    meaning: "Unidad de velocidad marítima. 1 kn = 1 milla náutica por hora (1.852 km/h).",
    usage: "Todas las velocidades del dashboard se muestran en kn por estándar náutico.",
  },
  {
    term: "Milla náutica (NM)",
    meaning: "Unidad de distancia en navegación basada en la circunferencia terrestre.",
    usage: "La distancia al puerto más cercano se expresa en NM (nearest_port_nm).",
  },
  {
    term: "Lat/Lon",
    meaning: "Coordenadas geográficas de posición AIS.",
    usage: "Se dibujan en el mapa y permiten filtrar ubicaciones válidas.",
  },
  {
    term: "Bounding Box",
    meaning: "Rectángulo geográfico definido por min/max latitud y longitud.",
    usage: "Filtro primario para limitar ingestión y procesamiento a la zona de Canarias.",
  },
  {
    term: "Geofencing",
    meaning: "Técnica para detectar si una posición cae dentro/fuera de una zona geográfica.",
    usage: "Se aplica en Spark para conservar datos dentro del marco operativo.",
  },
  {
    term: "nearest_port_name",
    meaning: "Puerto canario más cercano al punto AIS.",
    usage: "Se muestra en tabla/detalle y alimenta el ranking de puertos frecuentes.",
  },
  {
    term: "nearest_port_nm",
    meaning: "Distancia al puerto más cercano, en millas náuticas.",
    usage: "Campo enriquecido por Spark usando Haversine.",
  },
  {
    term: "seenAt",
    meaning: "Timestamp de última observación disponible para el MMSI.",
    usage: "Marca de frescura del dato para panel y validaciones operativas.",
  },
  {
    term: "ETA",
    meaning: "Estimated Time of Arrival: estimación de llegada.",
    usage: "Idea de siguiente iteración usando distancia al puerto + velocidad SOG.",
  },
  {
    term: "DLQ",
    meaning: "Dead Letter Queue para eventos inválidos o corruptos.",
    usage: "Propuesta de robustez para separar y auditar datos descartados.",
  },
  {
    term: "windowMinutes",
    meaning: "Ventana temporal de consulta para métricas en la UI.",
    usage: "Define el período de datos recientes (actualmente 15 min).",
  },
  {
    term: "overspeedShips",
    meaning: "Cantidad de barcos que superan el umbral de velocidad.",
    usage: "KPI de alerta temprana para operación en vivo.",
  },
];

export default function DataDictionaryModal({ open, onClose }: Props) {
  const [query, setQuery] = useState("");
  const filteredEntries = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter(
      (e) =>
        e.term.toLowerCase().includes(q) ||
        e.meaning.toLowerCase().includes(q) ||
        e.usage.toLowerCase().includes(q)
    );
  }, [query]);

  return (
    <InfoModal
      open={open}
      onClose={onClose}
      title="Glosario de datos marítimos"
      subtitle="Campos operativos que maneja el pipeline y cómo se interpretan"
    >
      <div className="mb-3 rounded-xl border border-white/10 bg-slate-900/50 p-3">
        <label className="mb-1 block text-xs font-medium text-slate-300">Buscar término o concepto</label>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ej: nudo, MMSI, geofencing, DLQ..."
          className="w-full rounded-lg border border-white/15 bg-slate-950/60 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400/60 focus:outline-none focus:ring-1 focus:ring-cyan-400/40"
        />
      </div>
      <div className="space-y-3">
        {filteredEntries.map((entry) => (
          <article key={entry.term} className="rounded-xl border border-white/10 bg-slate-900/50 p-3">
            <h4 className="text-sm font-semibold text-cyan-200">{entry.term}</h4>
            <p className="mt-1 text-sm text-slate-300">{entry.meaning}</p>
            <p className="mt-1 text-xs text-slate-400">
              <span className="font-medium text-slate-300">Uso en la app:</span> {entry.usage}
            </p>
          </article>
        ))}
        {filteredEntries.length === 0 ? (
          <p className="rounded-xl border border-amber-400/30 bg-amber-950/20 px-3 py-2 text-sm text-amber-100">
            No hay coincidencias para esa búsqueda.
          </p>
        ) : null}
      </div>
    </InfoModal>
  );
}

