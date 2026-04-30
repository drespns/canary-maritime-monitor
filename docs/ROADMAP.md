# Hoja de Ruta - Fase a Fase

## Fase 1: El Laboratorio (Infraestructura)
- [x] Configurar `docker-compose.yml` con Kafka (KRaft), InfluxDB y Grafana.
- [x] Verificar conectividad entre contenedores.

## Fase 2: Ingestión (La Tubería)
- [x] Crear el `producer.py` para conectar con Aisstream.io.
- [x] Implementar manejo de errores y reconexión del WebSocket.

## Fase 3: Inteligencia (Spark)
- [x] Crear el `spark_stream.py` (Structured Streaming + consola de depuración).
- [x] Geocercado con **bounding box** (descarte rectangular de Canarias) y **Haversine** para distancia al puerto canario más cercano (`src/processing/data/canary_ports.json`).

## Fase 4: El Escaparate (Web & Influx)
- [x] Persistir datos en InfluxDB (sink Spark `foreachBatch`).
- [x] Crear un Dashboard básico en Grafana (provisioning inicial).
- [x] **Extra:** Iniciar la web base con Next.js + React + Tailwind (`src/web/ui`).
