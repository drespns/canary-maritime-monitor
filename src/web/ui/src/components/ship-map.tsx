"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap, LayerGroup } from "leaflet";

type ShipPoint = {
  mmsi: string;
  shipName: string;
  sog: number | null;
  latitude: number | null;
  longitude: number | null;
  nearestPortName: string;
  operatorColor: string;
  operatorLabel: string;
};

type ShipTrack = {
  mmsi: string;
  points: Array<{
    latitude: number;
    longitude: number;
    seenAt: string;
    sog: number | null;
  }>;
  operatorColor: string;
};

type Props = {
  ships: ShipPoint[];
  tracks?: ShipTrack[];
  selectedMmsi?: string | null;
  onShipSelect?: (mmsi: string) => void;
  speedAlertKnots?: number;
};

const CANARY_CENTER: [number, number] = [28.3, -15.8];

/**
 * Leaflet solo existe en el navegador: import dinámico en el efecto
 * para que la evaluación del módulo en SSR no toque `window`.
 */
export default function ShipMap({
  ships,
  tracks = [],
  selectedMmsi,
  onShipSelect,
  speedAlertKnots = 25,
}: Props) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const leafletMapRef = useRef<LeafletMap | null>(null);
  const layerGroupRef = useRef<LayerGroup | null>(null);
  const leafletLibRef = useRef<typeof import("leaflet") | null>(null);
  const onShipSelectRef = useRef(onShipSelect);

  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    onShipSelectRef.current = onShipSelect;
  }, [onShipSelect]);

  const validShips = ships.filter(
    (s) => s.latitude !== null && s.longitude !== null
  ) as Array<ShipPoint & { latitude: number; longitude: number }>;

  useEffect(() => {
    let cancelled = false;
    if (!mapRef.current || leafletMapRef.current) return;

    void import("leaflet").then((L) => {
      if (cancelled || !mapRef.current || leafletMapRef.current) return;

      leafletLibRef.current = L;
      const map = L.map(mapRef.current).setView(CANARY_CENTER, 8);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      const group = L.layerGroup().addTo(map);
      leafletMapRef.current = map;
      layerGroupRef.current = group;
      setMapReady(true);
    });

    return () => {
      cancelled = true;
      leafletMapRef.current?.remove();
      leafletMapRef.current = null;
      layerGroupRef.current = null;
      leafletLibRef.current = null;
      setMapReady(false);
    };
  }, []);

  useEffect(() => {
    if (!mapReady) return;
    const L = leafletLibRef.current;
    const group = layerGroupRef.current;
    if (!L || !group) return;

    group.clearLayers();

    for (const track of tracks) {
      if (track.points.length < 2) continue;
      const isSelectedTrack = selectedMmsi === track.mmsi;
      const latestSog = track.points.at(-1)?.sog ?? 0;
      const strokeColor = track.operatorColor;
      const overspeed = latestSog >= speedAlertKnots;
      const polyline = L.polyline(
        track.points.map((p) => [p.latitude, p.longitude] as [number, number]),
        {
          color: strokeColor,
          opacity: isSelectedTrack ? 0.88 : overspeed ? 0.55 : 0.4,
          weight: isSelectedTrack ? 4 : overspeed ? 3 : 2,
          lineCap: "round",
          lineJoin: "round",
          dashArray: isSelectedTrack ? undefined : "4 6",
        }
      );
      polyline.addTo(group);
    }

    for (const ship of validShips) {
      const speed = ship.sog ?? 0;
      const isSelected = selectedMmsi === ship.mmsi;
      const fill = ship.operatorColor || "#64748b";
      const overspeed = speed >= speedAlertKnots;
      const midSpeed = speed >= speedAlertKnots * 0.6;
      const radius = isSelected ? (overspeed ? 10 : midSpeed ? 9 : 8) : overspeed ? 8 : midSpeed ? 7 : 6;
      const borderColor = overspeed
        ? "#fecaca"
        : isSelected
          ? "#ffffff"
          : "rgba(15,23,42,0.55)";

      const marker = L.circleMarker([ship.latitude, ship.longitude], {
        radius,
        color: borderColor,
        fillColor: fill,
        fillOpacity: isSelected ? 0.95 : 0.88,
        weight: overspeed ? 3 : isSelected ? 3 : 2,
      });
      marker.bindPopup(`
        <div style="font-size:12px">
          <div><strong>${ship.shipName || "N/A"}</strong></div>
          <div style="opacity:.9">${ship.operatorLabel ?? ""}</div>
          <div>MMSI: ${ship.mmsi}</div>
          <div>SOG: ${ship.sog !== null ? ship.sog.toFixed(2) + " kn" : "N/A"}</div>
          <div>Puerto cercano: ${ship.nearestPortName}</div>
        </div>
      `);
      marker.on("click", () => {
        onShipSelectRef.current?.(ship.mmsi);
      });
      marker.addTo(group);
    }
  }, [mapReady, validShips, tracks, selectedMmsi, speedAlertKnots]);

  useEffect(() => {
    if (!mapReady || !selectedMmsi) return;
    const map = leafletMapRef.current;
    if (!map) return;
    const ship = validShips.find((s) => s.mmsi === selectedMmsi);
    if (!ship) return;
    map.flyTo([ship.latitude, ship.longitude], Math.max(map.getZoom(), 9), {
      duration: 0.45,
    });
  }, [mapReady, selectedMmsi, validShips]);

  return (
    <div
      ref={mapRef}
      className="h-[min(58vh,560px)] min-h-[320px] w-full overflow-hidden rounded-xl border border-white/15 bg-slate-900/40"
    />
  );
}
