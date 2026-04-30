"""Carga de puertos referencia desde JSON (editable sin tocar código)."""

from __future__ import annotations

import json
import os
from pathlib import Path

from .geo import CanaryPort, coerce_ports


def _default_ports_path() -> Path:
    # core/ports.py -> processing/data/canary_ports.json
    return Path(__file__).resolve().parent.parent / "data" / "canary_ports.json"


def load_canary_ports(
    path: Path | None = None,
    *,
    explicit_path_str: str | None = None,
) -> tuple[CanaryPort, ...]:
    """
    Lee la lista de puertos desde JSON.

    Prioridad:
    1) Variable de entorno `CANARY_PORTS_JSON_PATH` (ruta absoluta o relativa al cwd).
    2) Argumento `explicit_path_str` (principalmente tests).
    3) `path` si se pasa explícitamente.
    4) Ruta por defecto empaquetada junto al módulo (`src/processing/data/canary_ports.json`).
    """
    if explicit_path_str:
        resolved = Path(explicit_path_str).expanduser()
        if not resolved.is_file():
            raise FileNotFoundError(explicit_path_str)
        raw = json.loads(resolved.read_text(encoding="utf-8"))
        return coerce_ports(raw)

    env_path = os.getenv("CANARY_PORTS_JSON_PATH", "").strip()
    if env_path:
        resolved = Path(env_path).expanduser()
        if not resolved.is_file():
            raise FileNotFoundError(env_path)
        raw = json.loads(resolved.read_text(encoding="utf-8"))
        return coerce_ports(raw)

    use_path = path or _default_ports_path()
    if not use_path.is_file():
        raise FileNotFoundError(use_path)
    raw = json.loads(use_path.read_text(encoding="utf-8"))
    return coerce_ports(raw)
