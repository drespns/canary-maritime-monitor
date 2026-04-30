# Especificación Técnica: Monitor Marítimo de Canarias

## El Problema
Fred. Olsen y otras navieras necesitan monitorizar su flota y la competencia en tiempo real para optimizar rutas y detectar anomalías en la velocidad.

## La Solución (Data Pipeline)
1. **Source:** API de Aisstream.io vía WebSockets (Datos AIS de barcos).
2. **Ingestión (Kafka):** Un "Producer" captura los mensajes JSON y los envía al topic `raw-ship-data`.
3. **Procesamiento (Spark Streaming):** - Limpieza de datos (Schema enforcement).
   - **Geofencing:** Filtrar barcos en coordenadas de Canarias (**bounding box** rectangular: rápido y suficiente para acotar el área).
   - **Lógica de Valor:** Distancia **Haversine** al **puerto canario más cercano** (lista editable en JSON); más adelante: exceso de velocidad respecto a límites por zona.
4. **Almacenamiento (InfluxDB):** Base de datos de series temporales para análisis histórico de trayectorias (sink inicial implementado desde Spark).
5. **Visualización:**
   - **Grafana:** Dashboard base provisionado para validar que llegan datos al bucket.
   - **Web Custom:** Frontend base en Next.js + React + Tailwind para evolucionar hacia producto final.

## Geofencing de Canarias
- Bounding Box: Lat [27.0, 30.0], Lon [-19.0, -13.0]
- **Nota:** El bbox no usa Haversine (son comparaciones de lat/lon). La **Haversine** se aplica después, en columnas como `nearest_port_nm`, para medir distancias sobre la esfera entre el barco y puntos de referencia (puertos).
