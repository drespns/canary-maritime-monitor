# Operadores en Canarias y logos en la UI

La aplicación **no** recibe un campo «armador» desde Influx: la UI infiere un **operador estimado** a partir del **nombre AIS** (20 caracteres, a veces abreviado) y del **MMSI** (MID de bandera). Es orientativo para colorear mapa/tabla y enlazar logos; no sustituye al registro oficial.

## Identificadores (`operatorId`)

| `operatorId`       | Etiqueta UI                     | Fichero logo sugerido (`public/operators/`) |
|--------------------|----------------------------------|---------------------------------------------|
| `fred_olsen`       | Fred. Olsen Express              | `fred-olsen-express.png` o `.svg`         |
| `naviera_armas`    | Naviera Armas / Trasmediterránea | `naviera-armas.png` o `.svg`              |
| `balearia`         | Baleària                         | `balearia.png` o `.svg`                     |
| `lineas_romero`    | Líneas Romero                    | `lineas-romero.png` o `.svg`               |
| `grafil_mid`       | Grafilur / Mid                   | `grafil-mid.png` o `.svg`                   |
| `other_canary`     | Otro (Canarias)                  | `other-canary.png` o `.svg`                |
| `international`    | Internacional / otro MID         | `international.png` o `.svg`               |
| `unknown`          | Sin clasificar                   | `unknown.png` o `.svg`                      |

Reglas de nombre (orden de evaluación) están en `src/web/ui/src/lib/ship-operator.ts`. Ajusta patrones si ves falsos positivos/negativos con datos reales.

## Buques excluidos (N/A)

No entran en el ranking ni en el límite de buques: MMSI inválido, nombre vacío, «N/A», o nombres solo con `@` (huecos AIS típicos).

## Límite de buques

- Variable de entorno: `WEB_SHIPS_LIMIT` (10–200, por defecto en código 60 si no se define).
- La API acepta `GET /api/metrics?limit=100` para sobrescribir en sesión sin tocar `.env`.
- Más buques ⇒ más puntos Leaflet y más filas; suele ser razonable hasta ~150 en escritorio.

## Logos y derechos

Coloca imágenes **con permiso de uso** (marca registrada). Tamaño recomendado: cuadrado ~64–128 px, fondo transparente si es PNG. Ver `public/operators/README.md`.
