"""Consumidor de humo para validar que llegan mensajes a Kafka."""

# Cargar configuración centralizada del proyecto.
from core.config import load_config
# Cliente consumer JSON (wrapper simple sobre kafka-python).
from core.kafka_client import KafkaJsonConsumer
# Configurar logs de la misma forma que producer.py.
from core.logging_utils import configure_logging
# Extraer identidad legible del barco para mostrar por pantalla.
from core.message_parser import vessel_identity


def main() -> None:
    # 1) Cargar variables (bootstrap/topic/log level/etc.).
    config = load_config()
    # 2) Aplicar configuración de logging.
    configure_logging(config.log_level)

    # 3) Crear consumer contra el topic de datos crudos.
    consumer = KafkaJsonConsumer(
        bootstrap_servers=config.kafka_bootstrap_servers,
        topic=config.kafka_topic,
        # group_id fijo para esta prueba manual.
        group_id="raw-ship-data-smoke-test",
    )

    # Mensaje de arranque para confirmar conexión objetivo.
    print(
        "Listening on topic",
        config.kafka_topic,
        "via",
        config.kafka_bootstrap_servers,
    )

    try:
        # 4) Consumir mensajes indefinidamente.
        for record in consumer:
            # record.value ya viene deserializado como dict JSON.
            payload = record.value
            # Mostrar offset + barco para ver actividad en tiempo real.
            print(f"[offset={record.offset}] {vessel_identity(payload)}")
    except KeyboardInterrupt:
        # Salida limpia al pulsar Ctrl+C.
        pass
    finally:
        # Cerrar el consumer para liberar socket/recursos.
        consumer.close()


# Ejecutar main solo cuando el archivo se lanza directamente.
if __name__ == "__main__":
    main()

