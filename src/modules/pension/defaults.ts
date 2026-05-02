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

/** Convert a *gross* statutory pension to net using Finanztip's 20 % rule of thumb. */
export function grossPensionToNet(grossMonthly: number): number {
  return grossMonthly * PENSION_DEFAULTS.grossToNetPensionFactor;
}

/**
 * Average two gross pension projections from the German "Renteninformation" letter
 * (one at 1 % and one at 2 % yearly raise). Result is the mid-case in nominal Euro
 * at the time of retirement.
 */
export function midGrossFromRenteninfo(low: number, high: number): number {
  return (low + high) / 2;
}

/**
 * Full Finanztip pipeline: average two gross projections, deduct 20 % for taxes
 * and health/long-term-care, then discount back to today's purchasing power
 * using the inflation assumption.
 *
 * Reproduces the Daniela example from the Finanztip video:
 *   midGross 3.400 € · yearsToRetirement 35 · inflation 2 %
 *   → 2.720 € net nominal · ≈ 1.360 € net in today's purchasing power.
 */
export function realNetPensionFromGross(
  grossMonthly: number,
  inflation: number,
  yearsToRetirement: number,
): { netNominal: number; netReal: number } {
  const netNominal = grossPensionToNet(grossMonthly);
  if (yearsToRetirement <= 0) return { netNominal, netReal: netNominal };
  const netReal = netNominal / Math.pow(1 + inflation, yearsToRetirement);
  return { netNominal, netReal };
}
