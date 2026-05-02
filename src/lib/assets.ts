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

export function effectiveRealReturn(asset: Asset | AllocationEntry): number {
  return asset.realReturnOverride ?? getAssetTypeDef(asset.type).defaultRealReturn;
}

/**
 * One slice of an allocation (% of the portfolio in this bucket).
 * Re-uses AssetType so that the savings allocation and the existing-assets
 * list speak the same vocabulary.
 */
export type AllocationEntry = {
  id: string;
  type: AssetType;
  /** 0..100 — share of the portfolio in this bucket. */
  percent: number;
  /** Optional: overrides the type's default real return. */
  realReturnOverride?: number;
};

export type Allocation = AllocationEntry[];

export function allocationTotalPercent(allocation: Allocation): number {
  return allocation.reduce((sum, a) => sum + a.percent, 0);
}

export function isAllocationValid(allocation: Allocation): boolean {
  if (allocation.length === 0) return false;
  if (allocation.some((a) => a.percent < 0)) return false;
  return Math.abs(allocationTotalPercent(allocation) - 100) < 0.01;
}

/**
 * Effective real return of a portfolio (weighted average of bucket returns).
 * Useful as a display value; the actual capital projection uses per-bucket
 * compounding (see lib/finance.ts) for accuracy when bucket returns differ.
 */
export function weightedRealReturn(allocation: Allocation): number {
  if (allocation.length === 0) return 0;
  const total = allocationTotalPercent(allocation);
  if (total === 0) return 0;
  return (
    allocation.reduce((sum, a) => sum + (a.percent / 100) * effectiveRealReturn(a), 0) *
    (100 / total)
  );
}

let nextAllocId = 0;
export function newAllocationId(): string {
  nextAllocId += 1;
  return `alloc-${Date.now().toString(36)}-${nextAllocId}`;
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
