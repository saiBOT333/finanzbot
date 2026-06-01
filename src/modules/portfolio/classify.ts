import type { Asset, AssetType } from "../../lib/assets";

export type Split = {
  /** Anteil 0..1, der als riskant gewertet wird. */
  risky: number;
  /** Anteil 0..1, der als Sicherheitsbaustein gewertet wird. */
  safe: number;
  /** Anteil 0..1, der gar nicht in die Quote einfließt. */
  excluded: number;
};

const TYPE_DEFAULT_SPLIT: Record<AssetType, Split> = {
  "cash":            { risky: 0,   safe: 1,   excluded: 0 },
  "bonds":           { risky: 0,   safe: 1,   excluded: 0 },
  "bonds-etf":       { risky: 0,   safe: 1,   excluded: 0 },
  "money-market":    { risky: 0,   safe: 1,   excluded: 0 },
  "etf-world":       { risky: 1,   safe: 0,   excluded: 0 },
  "etf-mixed":       { risky: 0.6, safe: 0.4, excluded: 0 },
  "stocks":          { risky: 1,   safe: 0,   excluded: 0 },
  "crypto":          { risky: 1,   safe: 0,   excluded: 0 },
  "commodities":     { risky: 1,   safe: 0,   excluded: 0 },
  "real-estate":     { risky: 0,   safe: 0,   excluded: 1 },
  "company-pension": { risky: 0,   safe: 0,   excluded: 1 },
  "other":           { risky: 0,   safe: 0,   excluded: 1 },
};

export function assetSplit(asset: Asset): Split {
  if (asset.riskClassOverride) {
    return {
      risky:    asset.riskClassOverride === "risky"    ? 1 : 0,
      safe:     asset.riskClassOverride === "safe"     ? 1 : 0,
      excluded: asset.riskClassOverride === "excluded" ? 1 : 0,
    };
  }
  return TYPE_DEFAULT_SPLIT[asset.type];
}

export type PortfolioBreakdown = {
  riskyEuro: number;
  safeEuro: number;
  excludedEuro: number;
  /** Summe aller drei Töpfe. */
  totalEuro: number;
  /** Bezugsgröße für die Quote: risky + safe. */
  consideredEuro: number;
  /** riskyEuro / consideredEuro * 100, 0 falls considered === 0. */
  currentEquityPercent: number;
};

export function computeBreakdown(assets: readonly Asset[]): PortfolioBreakdown {
  let riskyEuro = 0;
  let safeEuro = 0;
  let excludedEuro = 0;

  for (const asset of assets) {
    const split = assetSplit(asset);
    riskyEuro    += asset.amount * split.risky;
    safeEuro     += asset.amount * split.safe;
    excludedEuro += asset.amount * split.excluded;
  }

  const consideredEuro = riskyEuro + safeEuro;
  const totalEuro = consideredEuro + excludedEuro;
  const currentEquityPercent =
    consideredEuro > 0 ? (riskyEuro / consideredEuro) * 100 : 0;

  return {
    riskyEuro,
    safeEuro,
    excludedEuro,
    totalEuro,
    consideredEuro,
    currentEquityPercent,
  };
}
