import json  # Serialización/deserialización JSON.
import logging  # Logging de errores de envío.
from typing import Any  # Tipado para payload genérico.

from kafka import KafkaConsumer, KafkaProducer  # Cliente Kafka de python.


class KafkaJsonProducer:
    """Wrapper pequeño del producer Kafka para publicar dicts JSON."""

    def __init__(self, bootstrap_servers: str) -> None:
        # Logger específico para este cliente.
        self.logger = logging.getLogger("ingestion.kafka.producer")
        # Inicializar producer con parámetros seguros para laboratorio.
        self._producer = KafkaProducer(
            # Host/puerto de bootstrap (ej. 127.0.0.1:9092).
            bootstrap_servers=bootstrap_servers,
            # Esperar confirmación de todos los replicas ISR.
            acks="all",
            # Reintentos automáticos ante errores transitorios.
            retries=5,
            # Pequeño batching para mejorar rendimiento.
            linger_ms=50,
            # Convertir dict -> bytes JSON.
            value_serializer=lambda payload: json.dumps(payload).encode("utf-8"),
        )

    def send(self, topic: str, payload: dict[str, Any]) -> None:
        # Enviar mensaje asíncrono al topic.
        future = self._producer.send(topic, payload)
        # Adjuntar callback de error.
        future.add_errback(self._on_send_error)

    def _on_send_error(self, exc: BaseException) -> None:
        # Registrar fallo de envío para diagnóstico.
        self.logger.error("Kafka send failed: %s", exc)

    def close(self) -> None:
        # Forzar envío de buffer pendiente.
        self._producer.flush(timeout=10)
        # Cerrar conexión y recursos internos del producer.
        self._producer.close()


class KafkaJsonConsumer:
    """Consumer simple JSON para pruebas manuales (smoke-test)."""

    def __init__(self, bootstrap_servers: str, topic: str, group_id: str) -> None:
        # Crear consumer suscrito al topic indicado.
        self._consumer = KafkaConsumer(
            # Topic destino.
            topic,
            # Host/puerto de bootstrap.
            bootstrap_servers=bootstrap_servers,
            # Grupo de consumo (para offsets).
            group_id=group_id,
            # Empezar en "latest" para ver solo mensajes nuevos.
            auto_offset_reset="latest",
            # Autocommit de offsets habilitado.
            enable_auto_commit=True,
            # Convertir bytes -> dict JSON.
            value_deserializer=lambda b: json.loads(b.decode("utf-8")),
        )

    def __iter__(self):
        # Permitir: for record in consumer_wrapper
        return iter(self._consumer)

    def close(self) -> None:
        # Cerrar conexiones del consumer.
        self._consumer.close()

