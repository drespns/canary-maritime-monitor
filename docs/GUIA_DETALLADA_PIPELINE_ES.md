# Guía detallada: historia del laboratorio y explicación de cada script

Este documento cuenta **qué construimos**, **por qué**, y **qué hace cada archivo relevante**, en el orden en que tiene sentido aprenderlo. Está pensado para acompañar el código comentado en español del repositorio.

Para un diagrama compacto y rutas de estudio (30 min / 2 h / 1 día), ver **`docs/ARCHITECTURE_WALKTHROUGH.md`**.

---

## 1. Contexto del proyecto

**Problema de negocio (resumido):** monitorizar tráfico marítimo en Canarias con datos AIS en tiempo casi real.

**Solución técnica (pipeline):**

1. **Fuente:** Aisstream.io expone un **WebSocket** con mensajes AIS en JSON.
2. **Ingestión:** un proceso en Python se suscribe al stream y publica cada mensaje útil en **Apache Kafka** (topic `raw-ship-data`).
3. **Procesamiento:** Apache Spark Structured Streaming consume el topic, **parsea y tipa** el JSON, **normaliza** campos, aplica **geofencing** rectangular y calcula **distancia Haversine** al puerto canario más cercano (datos en `src/processing/data/canary_ports.json`).
4. **Persistencia / visualización:** Spark puede persistir micro-batches en InfluxDB y Grafana se provisiona con un dashboard base; además arrancamos una web inicial en Next.js + Tailwind.

La especificación del bbox está en `docs/PROJECT_SPEC.md`: latitud [27.0, 30.0], longitud [-19.0, -13.0].

---

## 2. Fase 1 — Infraestructura Docker (Kafka KRaft, InfluxDB, Grafana, Spark opcional)

### 2.1 Por qué pasamos de Bitnami + ZooKeeper a imágenes oficiales y KRaft

- **Bitnami** a veces publica tags que no coinciden con lo que ves en Docker Hub o con problemas de descarga; además mezcla convenciones propias.
- **Kafka “oficial”** (`apache/kafka`) y la documentación de Apache alinean variables con el broker moderno.
- **KRaft** evita ZooKeeper: el propio Kafka gestiona metadatos con quorum Raft, simplificando el Compose y el mantenimiento.

### 2.2 Archivo `docker/docker-compose.yml`

**Servicio `kafka`**

- Imagen parametrizada por `IMAGE_KAFKA` (por ejemplo `apache/kafka:4.1.2`).
- **`KAFKA_PROCESS_ROLES: broker,controller`**: un solo nodo hace de broker y de controlador (laboratorio).
- **Listeners:**
  - `PLAINTEXT_HOST` en **9092** dentro del contenedor: es el que se **mapea** al host (`KAFKA_PORT:9092`) para que tu PC se conecte como `127.0.0.1:9092`.
  - `PLAINTEXT` en **19092**: anunciado como `kafka:19092` para que **otros contenedores** hablen con el broker por la red Docker sin salir al host.
  - `CONTROLLER` en **29093**: quorum KRaft interno.
- **`CLUSTER_ID` / `KAFKA_CLUSTER_ID`**: en KRaft el cluster necesita un id; debe ser **estable** si reutilizas datos en disco (en nuestro laboratorio a veces usamos almacenamiento efímero dentro del contenedor; si más adelante montas volumen persistente, no cambies el id a la ligera).

**Por qué quitamos en su momento cierto volumen de logs de Kafka**

- En Windows/Docker aparecieron errores de permisos al escribir en rutas montadas; el broker reiniciaba y entonces **no había broker** para el producer (`NoBrokersAvailable`). La lección operativa: primero estabilidad, luego persistencia bien diseñada.

**Servicios `influxdb` y `grafana`**

- InfluxDB se inicializa con variables `DOCKER_INFLUXDB_INIT_*` cuando el volumen está vacío (org, bucket, token).
- Grafana monta volumen para datos; depende de InfluxDB en el Compose para orden de arranque lógico.

**Servicio `spark` (perfil `spark`)**

- No es “un cluster Spark” completo para producción; es un **contenedor herramienta**: imagen `spark:*-python3`, repo montado en **`/app`**, variables para que el job vea **`kafka:19092`** y el topic.
- **`user: "0:0"`** y **`HOME: /tmp`**: el usuario por defecto de muchas imágenes tiene home en `/nonexistent`; Spark con `--packages` usa **Ivy** y necesita escribir caché. Sin eso fallaba con rutas inexistentes.
- Volumen **`spark_ivy_cache`** en `/tmp/.ivy2`: persistir dependencias descargadas entre ejecuciones.
- **`command`**: crea subdirectorios de Ivy y ejecuta `sleep infinity` para poder hacer `docker compose exec` y lanzar `spark-submit` manualmente.

### 2.3 `docker/.env` y `docker/.env.example`

- Fijan versiones de imágenes reproducibles.
- **`KAFKA_BOOTSTRAP_SERVERS=127.0.0.1:9092`**: en Windows, `localhost` a veces resuelve a **IPv6** (`::1`) y el cliente Kafka acaba sin broker usable; **`127.0.0.1` fuerza IPv4** hacia el puerto publicado del contenedor.

---

## 3. Fase 2 — Ingestión (Aisstream → Kafka)

### 3.1 Rol de cada módulo

| Archivo | Responsabilidad |
|---------|-----------------|
| `src/ingestion/producer.py` | Punto de entrada: carga config, configura logs, registra señales SIGINT/SIGTERM, ejecuta el bridge. |
| `src/ingestion/core/config.py` | Lee `AISSTREAM_API_KEY`, Kafka, bbox, tiempos de reconexión, ping WebSocket; carga `.env` del repo y `docker/.env` sin pisar variables ya definidas. |
| `src/ingestion/core/logging_utils.py` | Formato unificado de logs. |
| `src/ingestion/core/message_parser.py` | Detecta mensajes `PositionReport` y construye una cadena legible (MMSI/nombre) para logs. |
| `src/ingestion/core/kafka_client.py` | Envoltorios de `KafkaProducer` / `KafkaConsumer` serializando JSON. |
| `src/ingestion/core/aisstream_bridge.py` | Ciclo de vida WebSocket, suscripción JSON a Aisstream, reconexión con backoff, envío a Kafka. |
| `src/ingestion/consumer_test.py` | Consumidor sencillo para validar que el topic recibe datos. |

### 3.2 Qué mensaje enviamos a Aisstream

Al abrir el WebSocket, el bridge envía un JSON de suscripción (en `_subscription_message`): API Key, filtros por **BoundingBoxes** y tipos de mensaje. Un error que nos costó reconexiones fue **anidar de más** las cajas; el proveedor espera una lista de cajas en el formato documentado, no listas duplicadas. Corregir eso estabilizó la conexión.

### 3.3 Por qué filtramos `PositionReport`

El stream AIS mezcla tipos de mensaje. Para el pipeline inicial solo necesitamos reportes de posición (lat/lon, COG/SOG, etc.). Ignorar el resto reduce ruido en Kafka y simplifica Spark.

### 3.4 Reconexión automática

Si el socket cae:

1. Se sale de `run_forever`.
2. Si no fue parada manual (`stop_event`), se incrementa el intento y se espera con **backoff exponencial + jitter** para no martillar el servidor ni sincronizar reconexiones en varios clientes.

### 3.5 Bootstrap del producer en el host

El producer corre en tu PC; debe usar el listener **externo** del broker: `KAFKA_BOOTSTRAP_SERVERS=127.0.0.1:9092` (véase `.env`). Eso es distinto del **`kafka:19092`** que usa Spark dentro de Docker.

---

## 4. Fase 3 — Procesamiento (Spark Structured Streaming)

### 4.1 Rol de cada módulo

| Archivo | Responsabilidad |
|---------|-----------------|
| `src/processing/spark_stream.py` | Orquesta: config → SparkSession → schema → lectura Kafka → parseo → normalización → filtros → Haversine/puerto → escritura consola con checkpoint. |
| `src/processing/core/config.py` | Igual filosofía que ingestión: `_load_env_files`, bbox en variables `AIS_BBOX_*`, Kafka, checkpoint, tuning local (`local[*]`, shuffle partitions). |
| `src/processing/core/spark_session.py` | Crea `SparkSession` con opciones coherentes para desarrollo. |
| `src/processing/core/schema.py` | Define `StructType` para `from_json`: fuerza tipos y nombres esperados del payload AISStream. |
| `src/processing/core/transforms.py` | Pipeline: `readStream` kafka → cast `value` a string → `from_json` → selección de campos → filtro coordenadas → bbox Canarias → columnas de puerto más cercano → `processed_at`. |
| `src/processing/core/geo.py` | Haversine en NM y utilidades puras Python (testeables sin Spark). |
| `src/processing/core/ports.py` | Carga `canary_ports.json` (u otra ruta vía `CANARY_PORTS_JSON_PATH`). |

### 4.2 Lectura desde Kafka

`read_kafka_stream` usa `format("kafka")`, `subscribe` al topic y `startingOffsets` (por defecto **latest** en nuestro código): solo verás mensajes nuevos tras arrancar el query; para laboratorio suele ser lo deseado si ya tienes producer funcionando.

### 4.3 Por qué schema explícito

Sin schema, Spark infiere tipos de JSON de forma frágil y los cambios en el productor rompen el job. Con schema fallamos de forma controlada y mantenemos columnas estables (`latitude`, `longitude`, etc.).

### 4.4 Geofencing

Tras normalizar campos y eliminar filas sin coordenadas, `apply_canary_geofence` compara lat/lon con los límites del bbox. Coincide con la intención del `PROJECT_SPEC` (aunque el proveedor ya filtre por suscripción, **re-filtrar en Spark** te protege si algún mensaje queda fuera o cambia el contrato).

### 4.5 Haversine y puerto más cercano

El bbox **no** usa Haversine: son cuatro comparaciones numéricas (barato en streaming). Para la **distancia sobre la esfera** entre el barco y puntos de referencia (puertos), usamos la **fórmula de Haversine** en `core/geo.py`, expresada en **millas náuticas** (unidad habitual en navegación).

La lista de puertos es **datos**, no código: `data/canary_ports.json`. Puedes sustituirla con la variable **`CANARY_PORTS_JSON_PATH`**. En `transforms.py`, `add_nearest_port_columns` registra un **UDF** Python que, para cada fila, elige el mínimo de las distancias barco–puerto; es legible para aprender y suficiente para volúmenes modestos en local. Si más adelante necesitas máximo rendimiento, se puede replantear con expresiones columnares o broadcast de una tabla de puertos.

### 4.6 Checkpoint y salida consola

`writeStream` con `checkpointLocation` permite que Spark recuerde offsets y estado de la query entre reinicios (según opciones). La salida **`console`** es para aprendizaje y depuración; en fases posteriores sustituiremos por **sink** a InfluxDB u otro almacén.

### 4.7 Ejecución recomendada en Docker

En `src/processing/README.md` está el `spark-submit` con:

- `--packages org.apache.spark:spark-sql-kafka-0-10_2.13:4.1.1` alineado a la versión de Spark.
- Ajustes Ivy (`spark.jars.ivy`, `extraJavaOptions`, `SPARK_SUBMIT_OPTS` en Compose) para que la descarga de JARs no falle por directorios no escribibles.

Rutas importantes:

- **`/app`** dentro del contenedor es el **repositorio montado**; por eso el script se invoca como `/app/src/processing/spark_stream.py`.

---

## 5. Cronología de problemas que resolvimos (y lección)

1. **Imágenes Bitnami / tags**: movimos a **oficiales** y versiones fijadas en `.env`.
2. **Kafka reiniciando**: permisos/volúmenes; priorizamos broker estable.
3. **`NoBrokersAvailable` con `localhost`**: **`127.0.0.1`** para IPv4 en Windows.
4. **WebSocket inestable**: formato correcto de **BoundingBoxes** en la suscripción.
5. **Spark Ivy en Docker**: **`HOME`**, volumen **`/tmp/.ivy2`**, flags de Ivy y usuario root en dev para crear directorios.

---

## 6. Fase 4 — Persistencia (Influx), dashboard (Grafana) y web base (Next.js)

### 6.1 Persistencia Spark -> InfluxDB

Cambios clave:

- `src/processing/core/influx_sink.py`: define `write_batch_to_influx` y transforma cada fila Spark a `Point` de Influx (`_row_to_point`).
- `src/processing/core/config.py`: añade variables de sink:
  - `SPARK_OUTPUT_MODE` (`console`, `influx`, `both`)
  - `INFLUXDB_URL`, `INFLUX_ORG`, `INFLUX_BUCKET`, `INFLUX_ADMIN_TOKEN`
  - `INFLUX_MEASUREMENT`, `INFLUX_BATCH_SIZE`, `INFLUX_FLUSH_INTERVAL_MS`
- `src/processing/spark_stream.py`: crea queries condicionadas por modo de salida:
  - consola para debug
  - `foreachBatch` para persistencia en Influx
  - checkpoints separados (`.../console` y `.../influx`) para evitar conflictos.

**Por qué `foreachBatch`:** ofrece control fino de serialización y batching en Python, ideal para una fase formativa. Más adelante, si el volumen crece mucho, se puede estudiar una ruta JVM nativa o un writer optimizado.

### 6.2 Grafana básico con provisioning

Se añadieron archivos en `docker/grafana/provisioning`:

- `datasources/influxdb.yml`: datasource InfluxDB v2 (Flux) usando variables de entorno.
- `dashboards/default.yml`: proveedor de dashboards por archivos.
- `dashboards/json/canary-overview.json`: dashboard inicial con:
  - stat de recuento de mensajes SOG (ventana corta),
  - serie temporal de velocidad media SOG por minuto.

Y en `docker/docker-compose.yml`:

- montajes de provisioning dentro de `/etc/grafana/provisioning/...`
- variables `INFLUX_*` expuestas al contenedor de Grafana para interpolación.

### 6.3 Web base con Next.js + Tailwind

Se inicializó frontend en `src/web/ui` con `create-next-app` (TypeScript + Tailwind + App Router).

Archivos clave:

- `src/web/ui/src/app/page.tsx`: landing técnica del proyecto (estado pipeline + accesos rápidos).
- `src/web/ui/src/app/api/health/route.ts`: endpoint de health para validar que la app está viva.
- `src/web/README.md` y `src/web/ui/README.md`: comandos y orientación.

En Compose se añadió servicio opcional:

- `web` (perfil `web`) con Node 22 Alpine, montando repo y publicando `3001:3000`.

### 6.4 Verificación rápida de persistencia

Archivo nuevo:

- `src/storage/influx_smoke_test.py`: consulta Influx de los últimos 15 minutos para confirmar escritura.

Uso típico:

1. Producer activo (`src/ingestion/producer.py`).
2. Spark con `SPARK_OUTPUT_MODE=both` o `influx`.
3. Ejecutar `python src/storage/influx_smoke_test.py`.
4. Abrir Grafana y revisar dashboard provisionado.

### 6.5 Iteración web con datos reales (métricas + tabla + alerta)

En esta iteración dejamos de usar solo contenido estático en la UI y pasamos a consumir InfluxDB de verdad.

Cambios:

- `src/web/ui/src/lib/pipeline-metrics.ts`:
  - consulta Flux a los últimos 15 minutos (`sog`, `nearest_port_nm`, `latitude`, `longitude`),
  - agrupa por `mmsi`,
  - calcula resumen (`activeShips`, `avgSog`, `overspeedShips`) y snapshot de barcos.
- `src/web/ui/src/app/api/metrics/route.ts`:
  - endpoint JSON para inspección rápida y para futuras integraciones.
- `src/web/ui/src/app/page.tsx`:
  - server component dinámico (`force-dynamic`) que pinta:
    - tarjetas de KPI,
    - alerta visual por umbral de velocidad (`WEB_SPEED_ALERT_KNOTS`),
    - tabla de barcos activos.

**Decisión de diseño (pedagógica):**

- Consultar Influx desde servidor Next evita exponer el token en navegador.
- Mantener lógica en `src/lib` permite reutilizarla entre API y página.
- En local es suficiente; si luego separas backend/frontend, esta lógica se mueve a un servicio API dedicado.

### 6.6 Automatización de arranque y mejora visual de web

Para reducir fricción diaria se añadieron scripts:

- `scripts/start-all.sh` / `scripts/stop-all.sh` (Bash)
- `scripts/start-all.ps1` / `scripts/stop-all.ps1` (PowerShell)

Estos scripts levantan/cierran infraestructura y procesos de desarrollo con logs en `tmp/dev-logs`.

Además, la UI web añadió dos bloques “más de producto”:

- Top puertos cercanos (distribución por recuento de barcos).
- Top velocidad SOG (ranking de barcos más rápidos en la ventana).

Los cálculos viven en `src/web/ui/src/lib/pipeline-metrics.ts`, así la página y la API comparten lógica.

### 6.7 Qué datos maneja la web (API -> UI) al detalle

Endpoint principal: `GET /api/metrics` (`src/web/ui/src/app/api/metrics/route.ts`)

Pipeline interno:

1. La ruta llama a `getPipelineMetrics()` en `src/lib/pipeline-metrics.ts`.
2. Esa función consulta Influx (Flux) en ventana de 15 minutos y measurement actual.
3. Agrupa por `mmsi` y construye un snapshot por barco.
4. Devuelve agregados + lista de barcos + metadatos de actualización (`generatedAt`).

Campos y dónde se muestran:

- `activeShips`: contador de barcos en ventana (`card "Barcos activos"`).
- `avgSog`: media de velocidad SOG (`card "Velocidad media SOG"`).
- `overspeedShips`: número de barcos por encima de `WEB_SPEED_ALERT_KNOTS` (`card "Alerta velocidad"`).
- `speedAlertKnots`: umbral aplicado (texto de la card de alerta).
- `windowMinutes`: ventana temporal para toda la vista (texto de snapshot).
- `ships[]`:
  - `mmsi`, `shipName`, `sog`, `nearestPortName`, `nearestPortNm`, `latitude`, `longitude`, `seenAt`
  - se pintan en la tabla principal.
- `topPorts[]`: ranking por puerto cercano (bloque de barras).
- `fastestShips[]`: ranking de velocidad (tabla Top SOG).
- `warning` (opcional): aparece como banner si falta token/config.
- `generatedAt`: hora en que el servidor generó la respuesta (header live).

Actualización “tiempo casi real”:

- `src/components/live-dashboard.tsx` hace polling cada 5s contra `/api/metrics`.
- Mantiene carga inicial SSR para abrir rápido y luego refresca sin recargar página.

Mapa en vivo:

- `src/components/ship-map.tsx` renderiza un mapa Leaflet con puntos por barco.
- Se colorean por velocidad:
  - verde: `< 15 kn`
  - naranja: `15-25 kn`
  - rojo: `>= 25 kn`

---

## 7. Orden sugerido de lectura del código

1. `docs/PROJECT_SPEC.md`
2. `docker/docker-compose.yml` + `docker/.env.example`
3. `src/ingestion/producer.py` → `core/config.py` → `core/aisstream_bridge.py`
4. `src/ingestion/consumer_test.py`
5. `src/processing/spark_stream.py` → `core/transforms.py` → `core/geo.py` → `core/schema.py`
6. `src/processing/core/influx_sink.py` + `src/storage/influx_smoke_test.py`
7. `docker/grafana/provisioning/*` + `src/web/ui/src/app/page.tsx`
8. `src/web/ui/src/lib/pipeline-metrics.ts` + `src/web/ui/src/app/api/metrics/route.ts`

Con eso cubres **infraestructura**, **ingesta**, **validación** y **stream processing** del estado actual del proyecto.
