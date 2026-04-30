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

## Nota sobre puertos

- Grafana usa `localhost:3000` en Docker.
- Si vas a levantar Next en local al mismo tiempo, usa:

```powershell
npm run dev -- -p 3001
```
