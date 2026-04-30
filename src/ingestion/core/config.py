import os  # Acceso a variables de entorno del sistema.
from dataclasses import dataclass  # Estructuras de datos inmutables y claras.
from pathlib import Path  # Manejo seguro de rutas de archivos.


@dataclass(frozen=True)
class BoundingBox:
    """Caja geográfica en el formato esperado por AISStream: [lat, lon]."""

    lat_min: float
    lon_min: float
    lat_max: float
    lon_max: float

    def to_aisstream_box(self) -> list[list[float]]:
        # Convierte la caja a dos puntos: esquina inferior-izq y superior-der.
        return [[self.lat_min, self.lon_min], [self.lat_max, self.lon_max]]


@dataclass(frozen=True)
class IngestionConfig:
    """Configuración de ejecución del puente AISStream -> Kafka."""

    aisstream_url: str
    aisstream_api_key: str
    kafka_bootstrap_servers: str
    kafka_topic: str
    bbox: BoundingBox
    reconnect_base_seconds: float
    reconnect_max_seconds: float
    reconnect_jitter_seconds: float
    ws_ping_interval_seconds: int
    ws_ping_timeout_seconds: int
    log_level: str


def _load_env_files() -> None:
    """
    Carga variables de entorno desde archivos locales comunes.

    No sobreescribe variables ya definidas en el sistema.
    Prioridad final:
    1) Variables ya presentes en el entorno del proceso
    2) repo/.env
    3) repo/docker/.env
    """
    # Obtener la raíz del repo a partir de este archivo:
    # src/ingestion/core/config.py -> subir 3 niveles.
    repo_root = Path(__file__).resolve().parents[3]
    # Candidatos de archivo .env que queremos leer.
    candidates = [repo_root / ".env", repo_root / "docker" / ".env"]

    # Recorrer candidatos en orden.
    for env_path in candidates:
        # Si no existe, seguimos al siguiente.
        if not env_path.exists():
            continue

        # Leer archivo completo (UTF-8) línea a línea.
        for raw_line in env_path.read_text(encoding="utf-8").splitlines():
            # Limpiar espacios en los extremos.
            line = raw_line.strip()
            # Saltar líneas vacías, comentarios o líneas sin "=".
            if not line or line.startswith("#") or "=" not in line:
                continue
            # Separar clave y valor solo en el primer "=".
            key, value = line.split("=", 1)
            # Limpiar espacios extra.
            key = key.strip()
            # Limpiar espacios y posibles comillas.
            value = value.strip().strip('"').strip("'")
            # Setear solo si la variable no existe ya en el entorno.
            os.environ.setdefault(key, value)


def load_config() -> IngestionConfig:
    """Construye y valida la configuración a partir del entorno."""
    # Cargar .env locales (si existen).
    _load_env_files()

    # Leer API key obligatoria.
    api_key = os.getenv("AISSTREAM_API_KEY", "").strip()
    # Si no está, cortar ejecución con mensaje claro.
    if not api_key:
        raise ValueError("Missing AISSTREAM_API_KEY in environment or .env file.")

    # Construir bounding box de Canarias (con defaults del proyecto).
    bbox = BoundingBox(
        lat_min=float(os.getenv("AIS_BBOX_LAT_MIN", "27.0")),
        lon_min=float(os.getenv("AIS_BBOX_LON_MIN", "-19.0")),
        lat_max=float(os.getenv("AIS_BBOX_LAT_MAX", "30.0")),
        lon_max=float(os.getenv("AIS_BBOX_LON_MAX", "-13.0")),
    )

    # Devolver objeto tipado con toda la config final.
    return IngestionConfig(
        # URL del WebSocket de AISStream.
        aisstream_url=os.getenv("AISSTREAM_URL", "wss://stream.aisstream.io/v0/stream"),
        # API key ya validada.
        aisstream_api_key=api_key,
        # 127.0.0.1 avoids IPv6 localhost (::1) issues on some Windows setups.
        kafka_bootstrap_servers=os.getenv("KAFKA_BOOTSTRAP_SERVERS", "127.0.0.1:9092"),
        # Topic destino para datos crudos AIS.
        kafka_topic=os.getenv("KAFKA_TOPIC_RAW_SHIP_DATA", "raw-ship-data"),
        # Geofence que se enviará en la suscripción.
        bbox=bbox,
        # Parámetros de reconexión con backoff.
        reconnect_base_seconds=float(os.getenv("WS_RECONNECT_BASE_SECONDS", "1.0")),
        reconnect_max_seconds=float(os.getenv("WS_RECONNECT_MAX_SECONDS", "60.0")),
        reconnect_jitter_seconds=float(os.getenv("WS_RECONNECT_JITTER_SECONDS", "1.5")),
        # Parámetros de keepalive del WebSocket.
        ws_ping_interval_seconds=int(os.getenv("WS_PING_INTERVAL_SECONDS", "30")),
        ws_ping_timeout_seconds=int(os.getenv("WS_PING_TIMEOUT_SECONDS", "10")),
        # Nivel de logs (INFO por defecto).
        log_level=os.getenv("LOG_LEVEL", "INFO").upper(),
    )

