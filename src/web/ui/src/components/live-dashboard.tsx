"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ShipMap from "@/components/ship-map";
import HeroHeader from "@/components/dashboard/hero-header";
import KpiCards from "@/components/dashboard/kpi-cards";
import FleetFilters from "@/components/dashboard/fleet-filters";
import FleetTable from "@/components/dashboard/fleet-table";
import ShipDetailsPanel from "@/components/dashboard/ship-details-panel";
import RankingsPanel from "@/components/dashboard/rankings-panel";
import ProjectContextSection from "@/components/dashboard/project-context-section";
import DashboardFooter from "@/components/dashboard/dashboard-footer";
import ReadmePreviewModal from "@/components/dashboard/readme-preview-modal";
import DataDictionaryModal from "@/components/dashboard/data-dictionary-modal";
import type { ShipSnapshot, ShipTrack } from "@/lib/pipeline-metrics";
import type { LiveDashboardProps, MetricsResponse } from "@/components/dashboard/types";
import { dashboardTheme } from "@/theme/dashboard-theme";

function normalize(s: string) {
  return s.trim().toLowerCase();
}

const SHIP_LIMIT_PRESETS = [40, 60, 100, 150, 200] as const;

export default function LiveDashboard({ initialMetrics }: LiveDashboardProps) {
  const [metrics, setMetrics] = useState<MetricsResponse>(initialMetrics);
  const [shipsLimit, setShipsLimit] = useState(
    initialMetrics.shipsLimit ?? SHIP_LIMIT_PRESETS[1]
  );
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [selectedMmsi, setSelectedMmsi] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [portFilter, setPortFilter] = useState<string>("__all__");
  const [showTracks, setShowTracks] = useState(true);
  const [trackDepth, setTrackDepth] = useState(5);
  const [readmeModalOpen, setReadmeModalOpen] = useState(false);
  const [dictionaryModalOpen, setDictionaryModalOpen] = useState(false);

  const shipsLimitRef = useRef(shipsLimit);

  useEffect(() => {
    shipsLimitRef.current = shipsLimit;
  }, [shipsLimit]);

  const fetchMetricsWithLimit = useCallback(async (limit: number) => {
    try {
      const res = await fetch(`/api/metrics?limit=${limit}`, { cache: "no-store" });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = (await res.json()) as MetricsResponse;
      setMetrics(data);
      setFetchError(null);
    } catch (error) {
      setFetchError(error instanceof Error ? error.message : "unknown");
    }
  }, []);

  const onShipLimitChange = useCallback(
    (next: number) => {
      setShipsLimit(next);
      void fetchMetricsWithLimit(next);
    },
    [fetchMetricsWithLimit]
  );

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(
      () => void fetchMetricsWithLimit(shipsLimitRef.current),
      5000
    );
    return () => clearInterval(interval);
  }, [autoRefresh, fetchMetricsWithLimit]);

  const portOptions = useMemo(() => {
    const names = new Set<string>();
    for (const s of metrics.ships) {
      if (s.nearestPortName) names.add(s.nearestPortName);
    }
    return [...names].sort((a, b) => a.localeCompare(b, "es"));
  }, [metrics.ships]);

  const filteredShips = useMemo(() => {
    const q = normalize(searchQuery);
    return metrics.ships.filter((s) => {
      if (portFilter !== "__all__" && s.nearestPortName !== portFilter) {
        return false;
      }
      if (!q) return true;
      const name = normalize(s.shipName ?? "");
      const mmsi = normalize(s.mmsi ?? "");
      return name.includes(q) || mmsi.includes(q);
    });
  }, [metrics.ships, portFilter, searchQuery]);

  const selectedShip: ShipSnapshot | null = useMemo(() => {
    if (!selectedMmsi) return null;
    return metrics.ships.find((s) => s.mmsi === selectedMmsi) ?? null;
  }, [metrics.ships, selectedMmsi]);

  const selectedIsFilteredOut = useMemo(() => {
    if (!selectedShip) return false;
    return !filteredShips.some((s) => s.mmsi === selectedShip.mmsi);
  }, [filteredShips, selectedShip]);

  const shipsForMap = useMemo(() => {
    const byMmsi = new Map(filteredShips.map((s) => [s.mmsi, s]));
    if (selectedMmsi) {
      const full = metrics.ships.find((s) => s.mmsi === selectedMmsi);
      if (full) byMmsi.set(full.mmsi, full);
    }
    return [...byMmsi.values()];
  }, [filteredShips, selectedMmsi, metrics.ships]);

  const tracksForMap = useMemo(() => {
    const visibleMmsi = new Set(shipsForMap.map((s) => s.mmsi));
    return metrics.shipTracks
      .filter((t) => visibleMmsi.has(t.mmsi))
      .map((t) => ({
        ...t,
        points: t.points.slice(-trackDepth),
      })) as ShipTrack[];
  }, [metrics.shipTracks, shipsForMap, trackDepth]);

  const operatorLegend = useMemo(() => {
    const byId = new Map<
      string,
      { id: string; label: string; color: string }
    >();
    for (const s of metrics.ships) {
      if (!byId.has(s.operatorId)) {
        byId.set(s.operatorId, {
          id: s.operatorId,
          label: s.operatorLabel,
          color: s.operatorColor,
        });
      }
    }
    return [...byId.values()].sort((a, b) =>
      a.label.localeCompare(b.label, "es")
    );
  }, [metrics.ships]);

  const shipLimitOptions = useMemo(() => {
    const set = new Set<number>(SHIP_LIMIT_PRESETS);
    set.add(shipsLimit);
    return [...set].sort((a, b) => a - b);
  }, [shipsLimit]);

  const onShipSelect = useCallback((mmsi: string) => {
    setSelectedMmsi(mmsi);
  }, []);
  const onToggleAutoRefresh = useCallback(() => {
    setAutoRefresh((v) => !v);
  }, []);
  const onOpenReadme = useCallback(() => {
    setReadmeModalOpen(true);
  }, []);
  const onOpenDictionary = useCallback(() => {
    setDictionaryModalOpen(true);
  }, []);

  return (
    <main className={dashboardTheme.layout.page}>
      <div className={dashboardTheme.layout.bubbleLayer}>
        <div className={dashboardTheme.layout.bubblePrimary} />
        <div className={dashboardTheme.layout.bubbleSecondary} />
      </div>

      <div className={dashboardTheme.layout.container}>
        <HeroHeader
          autoRefresh={autoRefresh}
          onToggleAutoRefresh={onToggleAutoRefresh}
          onOpenReadme={onOpenReadme}
          onOpenDictionary={onOpenDictionary}
        />

        <KpiCards
          activeShips={metrics.activeShips}
          windowMinutes={metrics.windowMinutes}
          avgSog={metrics.avgSog}
          overspeedShips={metrics.overspeedShips}
          speedAlertKnots={metrics.speedAlertKnots}
        />

        {fetchError ? (
          <div className="rounded-xl border border-amber-400/40 bg-amber-950/40 px-4 py-3 text-sm text-amber-100">
            No se pudo refrescar la API: {fetchError}
          </div>
        ) : null}

        {metrics.warning ? (
          <div className="rounded-xl border border-amber-400/40 bg-amber-950/40 px-4 py-3 text-sm text-amber-100">
            {metrics.warning}
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-12 xl:items-stretch">
          <section className="flex flex-col gap-3 xl:col-span-4 xl:min-h-0">
            <div className="rounded-2xl border border-white/10 bg-slate-900/45 px-4 py-3 backdrop-blur-sm">
              <label className="flex flex-col gap-1 text-xs text-slate-300 sm:flex-row sm:items-center sm:justify-between">
                <span className="font-medium text-slate-200">Buques en el panel (API)</span>
                <select
                  value={shipsLimit}
                  onChange={(e) => onShipLimitChange(Number(e.target.value))}
                  className="mt-1 w-full rounded-md border border-white/15 bg-slate-900 px-2 py-1.5 text-xs text-slate-100 sm:mt-0 sm:w-auto"
                >
                  {shipLimitOptions.map((n) => (
                    <option key={n} value={n}>
                      Hasta {n} buques
                    </option>
                  ))}
                </select>
              </label>
              <p className="mt-2 text-[11px] leading-snug text-slate-500">
                El backend recorta entre 10 y 200 MMSI tras filtrar nombres inválidos. Valores altos implican más
                marcadores en Leaflet y más filas; suele ser fluido hasta ~150 en escritorio.
              </p>
            </div>
            <FleetFilters
              searchQuery={searchQuery}
              portFilter={portFilter}
              portOptions={portOptions}
              onSearchChange={setSearchQuery}
              onPortChange={setPortFilter}
            />
            <FleetTable
              ships={filteredShips}
              totalShips={metrics.ships.length}
              selectedMmsi={selectedMmsi}
              onShipSelect={onShipSelect}
            />
          </section>

          <section className="flex flex-col gap-3 xl:col-span-5">
            <div className={`${dashboardTheme.card.base} p-4`}>
              <h2 className={`text-sm font-semibold ${dashboardTheme.text.title}`}>Mapa</h2>
              <p className={`text-xs ${dashboardTheme.text.muted}`}>
                Cada refresco reposiciona los puntos con la última posición conocida (sin animación continua entre lecturas).
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-white/10 bg-slate-950/35 p-2">
                <button
                  type="button"
                  onClick={() => setShowTracks((v) => !v)}
                  className={`rounded-md border px-2 py-1 text-xs transition ${
                    showTracks
                      ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-100"
                      : "border-white/15 text-slate-300 hover:bg-white/10"
                  }`}
                >
                  {showTracks ? "Estelas activas" : "Mostrar estelas"}
                </button>
                <label className="text-xs text-slate-300">
                  Puntos por estela:
                  <select
                    value={trackDepth}
                    onChange={(e) => setTrackDepth(Number(e.target.value))}
                    className="ml-2 rounded-md border border-white/15 bg-slate-900 px-2 py-1 text-xs text-slate-100"
                    disabled={!showTracks}
                  >
                    <option value={3}>3</option>
                    <option value={5}>5</option>
                    <option value={8}>8</option>
                    <option value={12}>12</option>
                  </select>
                </label>
              </div>
              {operatorLegend.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-1.5 rounded-lg border border-white/10 bg-slate-950/35 px-2 py-2">
                  <span className="w-full text-[10px] uppercase tracking-wide text-slate-500">
                    Color por operador (estimado)
                  </span>
                  {operatorLegend.map((o) => (
                    <span
                      key={o.id}
                      className="inline-flex max-w-[140px] items-center gap-1 truncate rounded-full border border-white/10 bg-slate-900/80 px-2 py-0.5 text-[10px] text-slate-200"
                      title={o.label}
                    >
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: o.color }}
                      />
                      <span className="truncate">{o.label}</span>
                    </span>
                  ))}
                </div>
              ) : null}
              <div className="mt-3">
                <ShipMap
                  ships={shipsForMap}
                  tracks={showTracks ? tracksForMap : []}
                  selectedMmsi={selectedMmsi}
                  onShipSelect={onShipSelect}
                  speedAlertKnots={metrics.speedAlertKnots}
                />
              </div>
            </div>
          </section>

          <aside className="flex flex-col gap-3 xl:col-span-3">
            <ShipDetailsPanel
              selectedShip={selectedShip}
              selectedIsFilteredOut={selectedIsFilteredOut}
            />
            <RankingsPanel
              topPorts={metrics.topPorts}
              fastestShips={metrics.fastestShips}
              onShipSelect={onShipSelect}
            />
          </aside>
        </div>

        <ProjectContextSection />
        <DashboardFooter />
      </div>
      <ReadmePreviewModal open={readmeModalOpen} onClose={() => setReadmeModalOpen(false)} />
      <DataDictionaryModal
        open={dictionaryModalOpen}
        onClose={() => setDictionaryModalOpen(false)}
      />
    </main>
  );
}
