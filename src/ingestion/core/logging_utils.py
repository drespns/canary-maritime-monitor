import logging  # Módulo estándar de logs en Python.


def configure_logging(level: str = "INFO") -> None:
    """Configura logging compartido para scripts de ingestión."""
    logging.basicConfig(
        # Nivel mínimo de salida (DEBUG/INFO/WARNING/ERROR).
        level=level,
        # Formato uniforme: fecha + nivel + logger + mensaje.
        format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
    )

