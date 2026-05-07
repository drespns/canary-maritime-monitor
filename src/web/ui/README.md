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
- `/api/readme` -> API JSON con el `README.md` del repo (usado para vista de documentación en UI).

## Variables de entorno esperadas

- `INFLUXDB_URL`
- `INFLUX_ORG`
- `INFLUX_BUCKET`
- `INFLUX_ADMIN_TOKEN`
- `INFLUX_MEASUREMENT`
- `WEB_SPEED_ALERT_KNOTS`

## Endpoints protegibles (recomendado en Vercel)

Los endpoints API pueden protegerse con una API key por entorno. Si defines la variable, el endpoint exige:

- Header `Authorization: Bearer <API_KEY>`

Variables disponibles:

- `METRICS_API_KEY` (protege `/api/metrics`)
- `README_API_KEY` (protege `/api/readme`)
- `HEALTH_API_KEY` (protege `/api/health`)

## Deploy (Vercel)

- Root directory del proyecto: `src/web/ui`
- Variables a configurar (Server-side): `INFLUXDB_URL`, `INFLUX_ORG`, `INFLUX_BUCKET`, `INFLUX_ADMIN_TOKEN`, `INFLUX_MEASUREMENT` (y opcionalmente las `*_API_KEY`).
