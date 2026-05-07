# Web (Fase 4)

Base del escaparate en Next.js + React + Tailwind:

- App: `src/web/ui`
- Página principal: `src/web/ui/src/app/page.tsx`
- Health endpoint: `src/web/ui/src/app/api/health/route.ts`
- Metrics endpoint real (Influx): `src/web/ui/src/app/api/metrics/route.ts`
- Lógica de consulta y agregación: `src/web/ui/src/lib/pipeline-metrics.ts`

## Arranque rápido

```powershell
cd src/web/ui
npm run dev
```

Abrir: `http://localhost:3000`

## Variables útiles para la UI

- `INFLUXDB_URL`
- `INFLUX_ORG`
- `INFLUX_BUCKET`
- `INFLUX_ADMIN_TOKEN`
- `INFLUX_MEASUREMENT`
- `WEB_SPEED_ALERT_KNOTS` (umbral de alerta visual en nudos)
- `WEB_STOPPED_SOG_KNOTS` (umbral para ocultar buques parados en la UI)

## Endpoints protegibles (recomendado en Vercel)

Los endpoints API pueden protegerse con una API key por entorno. Si defines la variable, el endpoint exige:

- Header `Authorization: Bearer <API_KEY>`

Variables disponibles:

- `METRICS_API_KEY` (protege `/api/metrics`)
- `README_API_KEY` (protege `/api/readme`)
- `HEALTH_API_KEY` (protege `/api/health`)

## Nota sobre puertos

- Grafana usa `localhost:3000` en Docker.
- Si vas a levantar Next en local al mismo tiempo, usa:

```powershell
npm run dev -- -p 3001
```

## Deploy rápido (Vercel + InfluxDB Cloud)

1. **InfluxDB Cloud**
   - Crea/elige: **Organization** y **Bucket** (ej. `ship-metrics`).
   - Crea un API token con permisos mínimos:
     - **Read** del bucket (para la web)
     - **Write** solo si también vas a usar el token para ingesta (no recomendado; mejor un token distinto)
   - Copia: `INFLUXDB_URL`, `INFLUX_ORG`, `INFLUX_BUCKET`, `INFLUX_ADMIN_TOKEN` (token), `INFLUX_MEASUREMENT`.

2. **Vercel**
   - Importa el repo.
   - Configura **Root Directory**: `src/web/ui`.
   - Añade variables de entorno (Production):
     - `INFLUXDB_URL`, `INFLUX_ORG`, `INFLUX_BUCKET`, `INFLUX_ADMIN_TOKEN`, `INFLUX_MEASUREMENT`
     - opcional: `METRICS_API_KEY`, `README_API_KEY`, `HEALTH_API_KEY`
   - Deploy.
