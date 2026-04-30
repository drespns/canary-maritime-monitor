"""Punto de entrada de ingestión: AISStream -> Kafka."""

# logging: para registrar eventos del arranque/parada.
import logging
# signal: para capturar Ctrl+C y apagar de forma limpia.
import signal
# Any: tipo genérico para el frame de la señal.
from typing import Any

# Clase principal del puente WebSocket -> Kafka.
from core.aisstream_bridge import AisStreamToKafkaBridge
# Carga y validación de configuración desde variables de entorno.
from core.config import load_config
# Configuración unificada del formato de logs.
from core.logging_utils import configure_logging


def main() -> None:
    # 1) Cargar toda la configuración (API key, Kafka, bbox, etc.).
    config = load_config()
    # 2) Configurar nivel/formato de logging según config.
    configure_logging(config.log_level)

    # 3) Crear la instancia del bridge que hará el trabajo real.
    bridge = AisStreamToKafkaBridge(config)

    # Handler para señales del sistema (p. ej. Ctrl+C en terminal).
    def handle_signal(signum: int, _frame: Any) -> None:
        # Dejar traza del motivo de parada.
        logging.getLogger("ingestion.producer").info("Signal %s received", signum)
        # Solicitar parada controlada del bridge.
        bridge.stop()

    # Registrar captura de SIGINT (Ctrl+C).
    signal.signal(signal.SIGINT, handle_signal)
    # Registrar captura de SIGTERM (parada del proceso).
    signal.signal(signal.SIGTERM, handle_signal)

    # 4) Ejecutar el bucle principal (con reconexión automática).
    bridge.run()


# Ejecutar main solo si este archivo se lanza directamente.
if __name__ == "__main__":
    main()
