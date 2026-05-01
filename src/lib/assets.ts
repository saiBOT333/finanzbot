/**
 * Cross-module asset taxonomy. Lives next to the profile because every
 * finance module that cares about existing capital reads from `Profile.assets`.
 *
 * Default real returns are conservative long-term estimates (after inflation),
 * meant as a sensible starting point — every entry can be overridden per asset.
 */

export type AssetType =
  | "cash"
  | "bonds"
  | "etf-world"
  | "etf-mixed"
  | "real-estate"
  | "other";

export type AssetTypeDef = {
  id: AssetType;
  label: string;
  hint: string;
  /** Erwartete reale Jahresrendite, langfristiger Durchschnitt. */
  defaultRealReturn: number;
};

export const ASSET_TYPES: AssetTypeDef[] = [
  {
    id: "cash",
    label: "Tagesgeld / Sparbuch",
    hint: "Liquide, jederzeit verfügbar, real meist nahe 0 % nach Inflation.",
    defaultRealReturn: 0,
  },
  {
    id: "bonds",
    label: "Festgeld / Anleihen-ETF",
    hint: "Festverzinslich, geringe Schwankung. Real ca. 1 % langfristig.",
    defaultRealReturn: 0.01,
  },
  {
    id: "etf-world",
    label: "Welt-ETF (Aktien)",
    hint: "MSCI World / FTSE All-World. Langfristig real ~5 % bei breiter Streuung.",
    defaultRealReturn: 0.05,
  },
  {
    id: "etf-mixed",
    label: "Gemischtes Depot 60/40",
    hint: "60 % Aktien-ETF + 40 % Anleihen. Real ~3 %.",
    defaultRealReturn: 0.03,
  },
  {
    id: "real-estate",
    label: "Immobilie (ohne Mieteinnahmen)",
    hint: "Reine Wertsteigerung selbstgenutzter Immobilien — real ~2 %.",
    defaultRealReturn: 0.02,
  },
  {
    id: "other",
    label: "Sonstiges",
    hint: "Konservativ angesetzt mit 0 %, anpassbar.",
    defaultRealReturn: 0,
  },
];

export function getAssetTypeDef(type: AssetType): AssetTypeDef {
  return ASSET_TYPES.find((t) => t.id === type) ?? ASSET_TYPES[ASSET_TYPES.length - 1]!;
}

export type Asset = {
  id: string;
  name: string;
  type: AssetType;
  /** Aktueller Wert in heutigen Euro. */
  amount: number;
  /** Optional: überschreibt den Default-Realwert des Typs. */
  realReturnOverride?: number;
};

export function effectiveRealReturn(asset: Asset): number {
  return asset.realReturnOverride ?? getAssetTypeDef(asset.type).defaultRealReturn;
}

export function totalAmount(assets: readonly Asset[]): number {
  return assets.reduce((sum, a) => sum + a.amount, 0);
}

let nextLocalId = 0;
/** Stable enough for client-only use without a UUID dependency. */
export function newAssetId(): string {
  nextLocalId += 1;
  return `asset-${Date.now().toString(36)}-${nextLocalId}`;
}
