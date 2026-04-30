# Canary Maritime Web UI

Frontend base del proyecto para la Fase 4.

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## Rutas actuales

- `/` -> dashboard técnico con métricas reales desde Influx (barcos activos, SOG media, alerta de velocidad y tabla snapshot).
- `/api/health` -> endpoint simple de comprobación del frontend.
- `/api/metrics` -> API JSON con resumen + barcos activos (últimos 15 minutos).

## Variables de entorno esperadas

- `INFLUXDB_URL`
- `INFLUX_ORG`
- `INFLUX_BUCKET`
- `INFLUX_ADMIN_TOKEN`
- `INFLUX_MEASUREMENT`
- `WEB_SPEED_ALERT_KNOTS`

## Siguiente objetivo

- añadir mapa de posiciones
- filtros temporales en UI
- endpoint backend dedicado (si separamos frontend y API)
