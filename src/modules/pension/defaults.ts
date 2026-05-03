import {
  INFLATION_DEFAULT,
  PAYOUT_YEARS_DEFAULT,
  PENSION_GROSS_TO_NET_DEDUCTION,
  REPLACEMENT_RATE_DEFAULT,
  RETIREMENT_AGE_DEFAULT,
  SAFE_WITHDRAWAL_RATE,
  STATE_PENSION_FACTOR,
  TAX_BUFFER_DEFAULT,
} from "./constants";
import { effectiveRealReturn, type Allocation } from "../../lib/assets";
import type { PayoutMethod, PensionInputs } from "./types";

/**
 * Defaults aligned with the Finanztip and Finanzfluss methodology.
 * All magic-numbers live in `constants.ts` — change them there.
 */
export const PENSION_DEFAULTS = {
  retirementAge: RETIREMENT_AGE_DEFAULT,
  replacementRate: REPLACEMENT_RATE_DEFAULT,
  statePensionFactor: STATE_PENSION_FACTOR,
  inflation: INFLATION_DEFAULT,
  payoutMethod: "annuity" as PayoutMethod,
  payoutYears: PAYOUT_YEARS_DEFAULT,
  safeWithdrawalRate: SAFE_WITHDRAWAL_RATE,
  taxBufferPct: TAX_BUFFER_DEFAULT,
  /** Brutto → Netto Faktor (= 1 − Pauschalabzug). */
  grossToNetPensionFactor: 1 - PENSION_GROSS_TO_NET_DEDUCTION,
} as const;

/**
 * Convert an allocation into normalised weighted buckets used by calculations.ts.
 * Weights sum to 1. Falls back to a single-bucket "etf-mixed" default when the
 * allocation is empty — keeps `calculatePension` total even with bad inputs.
 */
export function allocationToBuckets(allocation: Allocation): Array<{ weight: number; rate: number }> {
  if (allocation.length === 0) {
    return [{ weight: 1, rate: 0.03 }];
  }
  const total = allocation.reduce((s, a) => s + a.percent, 0);
  if (total <= 0) {
    return [{ weight: 1, rate: 0.03 }];
  }
  return allocation.map((entry) => ({
    weight: entry.percent / total,
    rate: effectiveRealReturn(entry),
  }));
}

/** Build a complete inputs object, applying defaults to missing fields. */
export function withDefaults(partial: Partial<PensionInputs>): PensionInputs {
  const netIncomeMonthly = partial.netIncomeMonthly ?? 0;
  return {
    currentAge: partial.currentAge ?? 0,
    retirementAge: partial.retirementAge ?? PENSION_DEFAULTS.retirementAge,
    netIncomeMonthly,
    replacementRate: partial.replacementRate ?? PENSION_DEFAULTS.replacementRate,
    expectedStatePension:
      partial.expectedStatePension ?? netIncomeMonthly * PENSION_DEFAULTS.statePensionFactor,
    inflation: partial.inflation ?? PENSION_DEFAULTS.inflation,
    savingsBuckets: partial.savingsBuckets ?? [{ weight: 1, rate: 0.03 }],
    payoutBuckets: partial.payoutBuckets ?? [{ weight: 1, rate: 0.01 }],
    existingAssets: partial.existingAssets ?? [],
    payoutMethod: partial.payoutMethod ?? PENSION_DEFAULTS.payoutMethod,
    payoutYears: partial.payoutYears ?? PENSION_DEFAULTS.payoutYears,
    safeWithdrawalRate: partial.safeWithdrawalRate ?? PENSION_DEFAULTS.safeWithdrawalRate,
    taxBufferPct: partial.taxBufferPct ?? PENSION_DEFAULTS.taxBufferPct,
  };
}

/** Apply a percentage deduction to a gross pension amount. */
export function applyPensionDeduction(grossMonthly: number, deductionPct: number): number {
  return grossMonthly * (1 - deductionPct);
}

/**
 * Project a statutory pension from "without adjustment" (the value the DRV
 * prints when assuming the current pension value stays put) all the way to
 * today's purchasing power. All four pipeline stages are returned so the UI
 * can show each one.
 *
 *   1. grossNominal = grossWithoutAdjustment × (1 + raise)^years
 *   2. netNominal   = grossNominal × (1 − deductionPct)
 *   3. netReal      = netNominal / (1 + inflation)^years
 *
 * Cross-check with Daniela (Finanztip):
 *   grossWithoutAdjustment ~1.988 € · raise 1.5 % · 35 years
 *   → grossNominal ~3.347 € · netNominal ~2.677 € (20 % deduction)
 *   → netReal ~1.339 € (within ~1 % of Saidi's "1.360 €" approximation)
 */
export function projectedNetPensionToday(
  grossWithoutAdjustment: number,
  raise: number,
  deductionPct: number,
  inflation: number,
  yearsToRetirement: number,
): { grossNominal: number; netNominal: number; netReal: number } {
  if (yearsToRetirement <= 0) {
    const netNominal = applyPensionDeduction(grossWithoutAdjustment, deductionPct);
    return { grossNominal: grossWithoutAdjustment, netNominal, netReal: netNominal };
  }
  const grossNominal = grossWithoutAdjustment * Math.pow(1 + raise, yearsToRetirement);
  const netNominal = applyPensionDeduction(grossNominal, deductionPct);
  const netReal = netNominal / Math.pow(1 + inflation, yearsToRetirement);
  return { grossNominal, netNominal, netReal };
}
