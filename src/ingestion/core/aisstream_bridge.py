import json  # Serialización/deserialización JSON.
import logging  # Trazas del bridge.
import random  # Jitter en reconexión.
import threading  # Evento de parada seguro entre callbacks/hilo principal.
import time  # Esperas entre reconexiones.
from typing import Any  # Tipado flexible para callbacks.

import websocket  # Cliente WebSocket (websocket-client).

from .config import IngestionConfig  # Config tipada del módulo.
from .kafka_client import KafkaJsonProducer  # Productor Kafka JSON.
from .message_parser import is_position_report, vessel_identity  # Helpers de parseo.


class AisStreamToKafkaBridge:
    """Mantiene sesión WebSocket y reenvía PositionReport a Kafka."""

    def __init__(self, config: IngestionConfig) -> None:
        # Guardar configuración recibida.
        self.config = config
        # Logger dedicado al bridge.
        self.logger = logging.getLogger("ingestion.bridge")
        # Señal de parada para cerrar el bucle principal.
        self.stop_event = threading.Event()
        # Contador de intentos de reconexión (para backoff exponencial).
        self.reconnect_attempt = 0
        # Referencia al WebSocket activo (si existe).
        self.ws: websocket.WebSocketApp | None = None
        # Cliente Kafka listo para publicar mensajes.
        self.kafka = KafkaJsonProducer(config.kafka_bootstrap_servers)

    def run(self) -> None:
        # Trazas iniciales para verificar endpoint/topic.
        self.logger.info("Kafka bootstrap: %s", self.config.kafka_bootstrap_servers)
        self.logger.info("Kafka topic: %s", self.config.kafka_topic)
        self.logger.info("Starting AISStream bridge")

        # Bucle principal: se mantiene vivo hasta recibir stop().
        while not self.stop_event.is_set():
            # Crear objeto WebSocket y enlazar callbacks.
            self.ws = websocket.WebSocketApp(
                self.config.aisstream_url,
                on_open=self._on_open,
                on_message=self._on_message,
                on_error=self._on_error,
                on_close=self._on_close,
            )
            # Ejecutar bucle interno de websocket (bloqueante).
            self.ws.run_forever(
                ping_interval=self.config.ws_ping_interval_seconds,
                ping_timeout=self.config.ws_ping_timeout_seconds,
            )

            # Si el cierre vino por parada manual, salir sin reconectar.
            if self.stop_event.is_set():
                break

            # Si se cayó la conexión, incrementar intento y esperar.
            self.reconnect_attempt += 1
            self._sleep_with_backoff()

        # Al salir del bucle, cerrar recursos.
        self.shutdown()

    def stop(self) -> None:
        # Activar señal de parada para romper el while en run().
        self.stop_event.set()
        # Cerrar socket activo si existe para desbloquear run_forever().
        if self.ws:
            self.ws.close()

    def shutdown(self) -> None:
        # Cerrar productor Kafka con flush previo.
        self.kafka.close()
        # Confirmar parada en logs.
        self.logger.info("Bridge stopped.")

    def _on_open(self, ws: websocket.WebSocketApp) -> None:
        # Al conectar, resetear contador de reconexión.
        self.reconnect_attempt = 0
        # Enviar mensaje de suscripción (API key + bbox + tipo de mensaje).
        ws.send(json.dumps(self._subscription_message()))
        # Traza de conexión/suscripción correcta.
        self.logger.info("Connected to AISStream and subscription sent.")

    def _on_message(self, _ws: websocket.WebSocketApp, message: str) -> None:
        try:
            # Intentar parsear payload JSON del websocket.
            payload = json.loads(message)
        except json.JSONDecodeError:
            # Si llega basura/no-JSON, ignorar sin romper el proceso.
            self.logger.warning("Discarding non-JSON websocket payload")
            return

        # Procesar solo PositionReport (otros tipos se ignoran).
        if not is_position_report(payload):
            return

        # Registrar identidad del barco para observabilidad.
        self.logger.info("PositionReport received from %s", vessel_identity(payload))
        # Publicar payload en Kafka.
        self.kafka.send(self.config.kafka_topic, payload)

    def _on_error(self, _ws: websocket.WebSocketApp, error: Any) -> None:
        # Cualquier error del websocket se loguea aquí.
        self.logger.error("WebSocket error: %s", error)

    def _on_close(
        self, _ws: websocket.WebSocketApp, status_code: int | None, message: str | None
    ) -> None:
        # Callback de cierre: útil para diagnosticar cortes remotos.
        self.logger.warning(
            "WebSocket closed (status=%s, message=%s)", status_code, message
        )

    def _subscription_message(self) -> dict[str, Any]:
        # AISStream expects a list of bounding boxes:
        # BoundingBoxes = [ [[lat1, lon1], [lat2, lon2]], ... ]
        # Aquí enviamos 1 sola caja: Canarias.
        return {
            # API key para autenticar sesión.
            "APIKey": self.config.aisstream_api_key,
            # Caja geográfica (lat/lon) en formato AISStream.
            "BoundingBoxes": [self.config.bbox.to_aisstream_box()],
            # Filtrar solo mensajes de posición para reducir ruido.
            "FilterMessageTypes": ["PositionReport"],
        }

    def _sleep_with_backoff(self) -> None:
        """
        Backoff exponencial con tope y jitter para no reconectar agresivamente.
        """
        # Limitar exponente para que el tiempo no crezca sin control.
        power = min(self.reconnect_attempt, 6)
        # Tiempo base: base * 2^power.
        base = self.config.reconnect_base_seconds * (2**power)
        # Aplicar máximo configurable.
        capped = min(base, self.config.reconnect_max_seconds)
        # Jitter aleatorio para evitar sincronización con otros clientes.
        jitter = random.uniform(0.0, self.config.reconnect_jitter_seconds)
        # Espera final.
        wait_seconds = capped + jitter
        # Traza informativa de reconexión.
        self.logger.warning(
            "Reconnecting in %.1fs (attempt=%s)", wait_seconds, self.reconnect_attempt
        )
        # Dormir antes de reintentar.
        time.sleep(wait_seconds)

