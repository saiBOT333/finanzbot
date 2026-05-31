import type { PortfolioBreakdown } from "./classify";

/** Unter diesem Schwellwert (in Prozentpunkten) gilt das Portfolio als balanced. */
export const BALANCED_TOLERANCE_PP = 1;

export type RebalanceDirection = "shift-to-safe" | "shift-to-equity" | "balanced";

export type RebalanceResult = {
  currentEquityPercent: number;
  targetEquityPercent: number;
  /** current - target, in Prozentpunkten. Positiv = zu viel Aktien. */
  deltaPercent: number;
  /** Absoluter Euro-Betrag, der verschoben werden müsste. Auf ganze Euro gerundet. */
  deltaAmount: number;
  direction: RebalanceDirection;
};

export function computeRebalance(
  breakdown: PortfolioBreakdown,
  targetEquityPercent: number,
): RebalanceResult {
  if (breakdown.consideredEuro <= 0) {
    return {
      currentEquityPercent: 0,
      targetEquityPercent,
      deltaPercent: 0,
      deltaAmount: 0,
      direction: "balanced",
    };
  }

  const deltaPercent = breakdown.currentEquityPercent - targetEquityPercent;
  const rawAmount = (deltaPercent / 100) * breakdown.consideredEuro;
  const deltaAmount = Math.round(Math.abs(rawAmount));

  let direction: RebalanceDirection;
  if (Math.abs(deltaPercent) < BALANCED_TOLERANCE_PP) {
    direction = "balanced";
  } else if (deltaPercent > 0) {
    direction = "shift-to-safe";
  } else {
    direction = "shift-to-equity";
  }

  return {
    currentEquityPercent: breakdown.currentEquityPercent,
    targetEquityPercent,
    deltaPercent,
    deltaAmount,
    direction,
  };
}
