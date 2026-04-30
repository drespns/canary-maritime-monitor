"""Tests unitarios del núcleo geográfico (sin Spark)."""

import unittest
from pathlib import Path

from processing.core.geo import (
    CanaryPort,
    coerce_ports,
    haversine_distance_nm,
    nearest_port_nm_and_name,
)
from processing.core.ports import load_canary_ports


class TestHaversine(unittest.TestCase):
    """Comprobaciones básicas de la fórmula de Haversine."""

    def test_same_point_is_near_zero_nm(self) -> None:
        d = haversine_distance_nm(28.1447, -15.4167, 28.1447, -15.4167)
        self.assertLess(d, 1e-6)

    def test_short_distance_same_order_of_magnitude_as_known_route(self) -> None:
        # Las Palmas ~ Santa Cruz de Tenerife: del orden de decenas de NM (referencia burda).
        las_palmas = (28.1447, -15.4167)
        santa_cruz = (28.4604, -16.2502)
        d = haversine_distance_nm(*las_palmas, *santa_cruz)
        self.assertGreater(d, 40.0)
        self.assertLess(d, 120.0)


class TestNearestPort(unittest.TestCase):
    """Selección del puerto más cercano sobre una lista mínima."""

    def test_picks_exact_port(self) -> None:
        ports: tuple[CanaryPort, ...] = (
            CanaryPort(name="A", lat=28.0, lon=-16.0),
            CanaryPort(name="B", lat=29.0, lon=-14.0),
        )
        nm, name = nearest_port_nm_and_name(28.0, -16.0, ports)
        self.assertAlmostEqual(nm or 0.0, 0.0, places=3)
        self.assertEqual(name, "A")


class TestPortsLoader(unittest.TestCase):
    """Carga del JSON empaquetado."""

    def test_default_json_loads(self) -> None:
        ports = load_canary_ports()
        self.assertGreater(len(ports), 0)

    def test_coerce_ports_rejects_bad_payload(self) -> None:
        with self.assertRaises(ValueError):
            coerce_ports({"not": "a list"})


class TestPortsLoaderExplicitPath(unittest.TestCase):
    """Override de ruta para tests aislados."""

    def test_explicit_path(self) -> None:
        fixture = Path(__file__).resolve().parent / "fixtures" / "mini_ports.json"
        ports = load_canary_ports(explicit_path_str=str(fixture))
        self.assertEqual(len(ports), 2)


if __name__ == "__main__":
    unittest.main()
