import {
  INFLATION_DEFAULT,
  PAYOUT_YEARS_DEFAULT,
  PENSION_GROSS_TO_NET_DEDUCTION,
  REAL_RETURN_PAYOUT_DEFAULT,
  REAL_RETURN_SAVING_DEFAULT,
  REPLACEMENT_RATE_DEFAULT,
  RETIREMENT_AGE_DEFAULT,
  SAFE_WITHDRAWAL_RATE,
  STATE_PENSION_FACTOR,
  TAX_BUFFER_DEFAULT,
} from "./constants";
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
  realReturn: REAL_RETURN_SAVING_DEFAULT,
  payoutRealReturn: REAL_RETURN_PAYOUT_DEFAULT,
  payoutMethod: "annuity" as PayoutMethod,
  payoutYears: PAYOUT_YEARS_DEFAULT,
  safeWithdrawalRate: SAFE_WITHDRAWAL_RATE,
  taxBufferPct: TAX_BUFFER_DEFAULT,
  /** Brutto → Netto Faktor (= 1 − Pauschalabzug). */
  grossToNetPensionFactor: 1 - PENSION_GROSS_TO_NET_DEDUCTION,
} as const;

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
    realReturn: partial.realReturn ?? PENSION_DEFAULTS.realReturn,
    payoutRealReturn: partial.payoutRealReturn ?? PENSION_DEFAULTS.payoutRealReturn,
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
