# Ingestion (AISStream -> Kafka)

Scripts de Fase 2 para ingerir datos AIS en Kafka.

## Estructura

- `producer.py`: entrypoint principal del puente WebSocket -> Kafka.
- `consumer_test.py`: consumidor de prueba para verificar que llegan mensajes.
- `core/config.py`: carga de variables de entorno y configuración.
- `core/aisstream_bridge.py`: lógica de reconexión y suscripción AISStream.
- `core/kafka_client.py`: wrappers simples para producer/consumer JSON.
- `core/message_parser.py`: utilidades para filtrar y loggear barcos.

## Variables esperadas

- `AISSTREAM_API_KEY`
- `KAFKA_BOOTSTRAP_SERVERS` (por defecto `127.0.0.1:9092`, recomendado en Windows)
- `KAFKA_TOPIC_RAW_SHIP_DATA` (por defecto `raw-ship-data`)

## Ejecución

```bash
# pip install websocket-client kafka-python
python src/ingestion/producer.py
```

Prueba de consumo:

```bash
python src/ingestion/consumer_test.py
```
