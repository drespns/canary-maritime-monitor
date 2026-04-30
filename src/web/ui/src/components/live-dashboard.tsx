"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import ShipMap from "@/components/ship-map";
import HeroHeader from "@/components/dashboard/hero-header";
import KpiCards from "@/components/dashboard/kpi-cards";
import FleetFilters from "@/components/dashboard/fleet-filters";
import FleetTable from "@/components/dashboard/fleet-table";
import ShipDetailsPanel from "@/components/dashboard/ship-details-panel";
import RankingsPanel from "@/components/dashboard/rankings-panel";
import ProjectContextSection from "@/components/dashboard/project-context-section";
import DashboardFooter from "@/components/dashboard/dashboard-footer";
import type { ShipSnapshot } from "@/lib/pipeline-metrics";
import type { LiveDashboardProps, MetricsResponse } from "@/components/dashboard/types";
import { dashboardTheme } from "@/theme/dashboard-theme";

function normalize(s: string) {
  return s.trim().toLowerCase();
}

export default function LiveDashboard({ initialMetrics }: LiveDashboardProps) {
  const [metrics, setMetrics] = useState<MetricsResponse>(initialMetrics);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [selectedMmsi, setSelectedMmsi] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [portFilter, setPortFilter] = useState<string>("__all__");

  useEffect(() => {
    if (!autoRefresh) return;

    let cancelled = false;

    const refresh = async () => {
      try {
        setIsRefreshing(true);
        const res = await fetch("/api/metrics", { cache: "no-store" });
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const data = (await res.json()) as MetricsResponse;
        if (!cancelled) {
          setMetrics(data);
          setFetchError(null);
        }
      } catch (error) {
        if (!cancelled) {
          setFetchError(error instanceof Error ? error.message : "unknown");
        }
      } finally {
        if (!cancelled) {
          setIsRefreshing(false);
        }
      }
    };

    const interval = setInterval(refresh, 5000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [autoRefresh]);

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

  const onShipSelect = useCallback((mmsi: string) => {
    setSelectedMmsi(mmsi);
  }, []);

  const generatedAtLabel = useMemo(() => {
    if (!metrics.generatedAt) return "-";
    return new Date(metrics.generatedAt).toLocaleTimeString("es-ES");
  }, [metrics.generatedAt]);

  return (
    <main className={dashboardTheme.layout.page}>
      <div className={dashboardTheme.layout.bubbleLayer}>
        <div className={dashboardTheme.layout.bubblePrimary} />
        <div className={dashboardTheme.layout.bubbleSecondary} />
      </div>

      <div className={dashboardTheme.layout.container}>
        <HeroHeader
          generatedAtLabel={generatedAtLabel}
          autoRefresh={autoRefresh}
          isRefreshing={isRefreshing}
          onToggleAutoRefresh={() => setAutoRefresh((v) => !v)}
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
              <div className="mt-3">
                <ShipMap
                  ships={shipsForMap}
                  selectedMmsi={selectedMmsi}
                  onShipSelect={onShipSelect}
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
    </main>
  );
}
