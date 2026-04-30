"""
Fórmula de Haversine y utilidades para distancias sobre el elipsoide aproximado como esfera.

En navegación AIS suele trabajarse en **millas náuticas (NM)**; internamente usamos el radio
medio terrestre en metros (WGS84 ~ 6371008.8 m) y dividimos por 1852 m/NM.

Referencias útiles para estudiar el tema:
- Haversine: forma estable del ángulo central entre dos puntos en una esfera.
- Limitación: para distancias muy cortas o alta precisión hidrográfica habría que usar
  Vincenty u otras correcciones; aquí priorizamos claridad pedagógica y coste CPU bajo en Spark.
"""

from __future__ import annotations

import math
from typing import Any, Iterable, TypedDict


class CanaryPort(TypedDict):
    """Puerto canario conocido para cálculos de proximidad (lectura desde JSON)."""

    name: str
    lat: float
    lon: float


def haversine_distance_nm(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Distancia en millas náuticas entre dos puntos (lat/lon en grados decimales WGS84).

    Fórmula estándar:
      a = sin²(Δφ/2) + cos φ1 · cos φ2 · sin²(Δλ/2)
      c = 2 · atan2(√a, √(1−a))
      d = R · c
    con φ latitud en radianes, λ longitud en radianes, R radio medio en la unidad deseada.
    """
    # Convertimos todo a radianes: Spark usará la misma lógica vía UDF que llama aquí.
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)

    sin_dphi = math.sin(dphi / 2.0)
    sin_dlambda = math.sin(dlambda / 2.0)
    h = sin_dphi * sin_dphi + math.cos(phi1) * math.cos(phi2) * sin_dlambda * sin_dlambda
    # Protección numérica: h puede exceder 1 por errores de punto flotante.
    h = min(1.0, max(0.0, h))
    c = 2.0 * math.asin(math.sqrt(h))

    # Radio medio terrestre (m) ~ WGS84; NM = metros / 1852.
    earth_radius_m = 6371008.8
    meters = earth_radius_m * c
    return meters / 1852.0


def nearest_port_nm_and_name(
    lat: float,
    lon: float,
    ports: Iterable[CanaryPort],
) -> tuple[float | None, str | None]:
    """
    Devuelve (distancia_nm, nombre_puerto) al puerto más cercano de la lista.

    Si `ports` está vacío, devuelve (None, None). Pensado para reutilizar desde UDF Python.
    """
    best_nm: float | None = None
    best_name: str | None = None
    for p in ports:
        d = haversine_distance_nm(lat, lon, float(p["lat"]), float(p["lon"]))
        if best_nm is None or d < best_nm:
            best_nm = d
            best_name = str(p["name"])
    return best_nm, best_name


def coerce_ports(raw: Any) -> tuple[CanaryPort, ...]:
    """Validación mínima en carga: nombre + lat/lon numéricos."""
    out: list[CanaryPort] = []
    if not isinstance(raw, list):
        raise ValueError("Ports file must contain a JSON array.")
    for item in raw:
        if not isinstance(item, dict):
            raise ValueError("Each port must be an object.")
        name = item.get("name")
        lat = item.get("lat")
        lon = item.get("lon")
        if name is None or lat is None or lon is None:
            raise ValueError("Each port needs name, lat, lon.")
        out.append(CanaryPort(name=str(name), lat=float(lat), lon=float(lon)))
    return tuple(out)
