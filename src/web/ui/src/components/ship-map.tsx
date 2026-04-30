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
};

type Props = {
  ships: ShipPoint[];
  selectedMmsi?: string | null;
  onShipSelect?: (mmsi: string) => void;
};

const CANARY_CENTER: [number, number] = [28.3, -15.8];

/**
 * Leaflet solo existe en el navegador: import dinámico en el efecto
 * para que la evaluación del módulo en SSR no toque `window`.
 */
export default function ShipMap({ ships, selectedMmsi, onShipSelect }: Props) {
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

    for (const ship of validShips) {
      const speed = ship.sog ?? 0;
      const isSelected = selectedMmsi === ship.mmsi;
      const color = speed >= 25 ? "#ef4444" : speed >= 15 ? "#f59e0b" : "#10b981";
      const radius = isSelected
        ? speed >= 25
          ? 9
          : speed >= 15
            ? 8
            : 7
        : speed >= 25
          ? 7
          : speed >= 15
            ? 6
            : 5;

      const marker = L.circleMarker([ship.latitude, ship.longitude], {
        radius,
        color: isSelected ? "#ffffff" : color,
        fillColor: color,
        fillOpacity: isSelected ? 0.95 : 0.8,
        weight: isSelected ? 3 : 2,
      });
      marker.bindPopup(`
        <div style="font-size:12px">
          <div><strong>${ship.shipName || "N/A"}</strong></div>
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
  }, [mapReady, validShips, selectedMmsi]);

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
