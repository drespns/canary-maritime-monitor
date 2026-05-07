/**
 * Clasificación heurística de operador naviero a partir del nombre AIS y MMSI.
 * Los nombres AIS son cortos (20 chars) y a veces abreviados; las reglas se ordenan
 * de más específicas a más genéricas. No sustituye a datos oficiales de flota.
 */

export type ShipOperatorId =
  | "fred_olsen"
  | "naviera_armas"
  | "balearia"
  | "lineas_romero"
  | "grafil_mid"
  | "other_canary"
  | "international"
  | "unknown";

export type ShipOperatorMeta = {
  id: ShipOperatorId;
  label: string;
  /** Color principal para mapa / badges (hex) */
  color: string;
  /** Nombre sugerido del fichero en public/operators/ (sin extensión) */
  logoSlug: string;
};

const META: Record<ShipOperatorId, Omit<ShipOperatorMeta, "id">> = {
  fred_olsen: {
    label: "Fred. Olsen Express",
    color: "#06b6d4",
    logoSlug: "fred-olsen-express",
  },
  naviera_armas: {
    label: "Naviera Armas / Trasmediterránea",
    color: "#ea580c",
    logoSlug: "naviera-armas",
  },
  balearia: {
    label: "Baleària",
    color: "#22c55e",
    logoSlug: "balearia",
  },
  lineas_romero: {
    label: "Líneas Romero",
    color: "#a855f7",
    logoSlug: "lineas-romero",
  },
  grafil_mid: {
    label: "Grafilur / Mid",
    color: "#eab308",
    logoSlug: "grafil-mid",
  },
  other_canary: {
    label: "Otro (Canarias)",
    color: "#64748b",
    logoSlug: "other-canary",
  },
  international: {
    label: "Internacional / otro MID",
    color: "#94a3b8",
    logoSlug: "international",
  },
  unknown: {
    label: "Sin clasificar",
    color: "#475569",
    logoSlug: "unknown",
  },
};

type PatternRule = {
  id: ShipOperatorId;
  test: (name: string) => boolean;
};

const NAME_RULES: PatternRule[] = [
  {
    id: "fred_olsen",
    test: (n) =>
      /\bBENCHIJ|\bBAJAMAR|\bBENTAGO|\bBOCAYNA|\bBUGANVILL|\bBETANCUR|\bBAÑADER|\bBENCOMO|\bBENCHI|\bVOLCAN\b|\bMARIE\s+CURIE|\bBUENAVISTA/i.test(
        n
      ),
  },
  {
    id: "naviera_armas",
    test: (n) => /\bARMAS\b|\bTRASME|\bTRASMED|\bCHICHARR/i.test(n),
  },
  {
    id: "balearia",
    test: (n) => /\bBALEAR|\bBALEÀR|\bHYPAT|\bABEL\s+MAT/i.test(n),
  },
  {
    id: "lineas_romero",
    test: (n) => /\bROMERO\b|\bLINEAS\s+ROM|\bLÍNEAS\s+ROM/i.test(n),
  },
  {
    id: "grafil_mid",
    test: (n) => /\bGRAFMID|\bGRAFIL|\bMID\s+SHIP/i.test(n),
  },
];

function normalizeAisName(raw: string): string {
  return raw.replace(/@+/g, " ").replace(/\s+/g, " ").trim();
}

function spanishMid(mmsi: string): boolean {
  if (!/^\d{9}$/.test(mmsi)) return false;
  const mid = Number(mmsi.slice(0, 3));
  return mid >= 224 && mid <= 229;
}

export function isDisplayableShip(mmsi: string, shipName: string): boolean {
  if (!mmsi || mmsi === "unknown" || !/^\d{9}$/.test(mmsi)) return false;
  const n = normalizeAisName(shipName);
  if (!n || /^n\/?a$/i.test(n)) return false;
  if (/^@+$/.test(shipName.replace(/\s/g, ""))) return false;
  return true;
}

export function classifyShipOperator(mmsi: string, shipName: string): ShipOperatorMeta {
  const name = normalizeAisName(shipName).toUpperCase();

  for (const rule of NAME_RULES) {
    if (rule.test(name)) {
      const m = META[rule.id];
      return { id: rule.id, ...m };
    }
  }

  if (spanishMid(mmsi)) {
    const m = META.other_canary;
    return { id: "other_canary", ...m };
  }

  if (/^\d{9}$/.test(mmsi)) {
    const m = META.international;
    return { id: "international", ...m };
  }

  const m = META.unknown;
  return { id: "unknown", ...m };
}

/** @deprecated usar classifyShipOperator */
export function enrichOperator(mmsi: string, shipName: string): ShipOperatorMeta {
  return classifyShipOperator(mmsi, shipName);
}
