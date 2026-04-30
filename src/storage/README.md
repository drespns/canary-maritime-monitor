# Storage (InfluxDB)

Fase 4: persistencia de métricas de navegación en InfluxDB.

## Script de verificación

- `influx_smoke_test.py`: consulta los últimos 15 minutos del measurement para confirmar que Spark está escribiendo.

## Uso

```powershell
python src/storage/influx_smoke_test.py
```

Requisitos:

- InfluxDB levantado en Docker.
- Spark ejecutándose con `SPARK_OUTPUT_MODE=influx` o `SPARK_OUTPUT_MODE=both`.
- Dependencia Python `influxdb-client` instalada en el entorno donde ejecutas el script.
