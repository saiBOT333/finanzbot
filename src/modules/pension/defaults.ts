import {
  INFLATION_DEFAULT,
  PLANNING_AGE_DEFAULT,
  PENSION_GROSS_TO_NET_DEDUCTION,
  REPLACEMENT_RATE_DEFAULT,
  RETIREMENT_AGE_DEFAULT,
  SAFE_WITHDRAWAL_RATE,
  STATE_PENSION_FACTOR,
  STATE_PENSION_MIN_CLAIM_AGE,
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
  /** Default-Bezugsdauer = Planungsalter − Regelaltersgrenze. Wird überschrieben durch ResultStep. */
  payoutYears: PLANNING_AGE_DEFAULT - RETIREMENT_AGE_DEFAULT,
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
 * Bezugsdauer der Auszahlphase = Planungsalter − Renteneintritt (nie negativ).
 * Fehlt das Renteneintrittsalter im Profil, gilt derselbe Default wie in
 * `withDefaults` (RETIREMENT_AGE_DEFAULT) — sonst entstünde `planningAge − 0`
 * und damit eine absurd lange Auszahlphase.
 */
export function derivePayoutYears(planningAge: number, retirementAge: number | undefined): number {
  return Math.max(0, planningAge - (retirementAge ?? RETIREMENT_AGE_DEFAULT));
}

/**
 * Project a statutory pension from "without adjustment" (DRV-Renteninfo)
 * all the way to today's purchasing power. Pipeline:
 *
 *   0. grossAdjusted = grossWithoutAdjustment × (1 − abschlag) × beitragsFaktor
 *      (Identität bei Eintritt zur Regelaltersgrenze oder ohne adjust-Optionen)
 *   1. grossNominal = grossAdjusted × (1 + raise)^years
 *   2. netNominal   = grossNominal × (1 − deductionPct)
 *   3. netReal      = netNominal / (1 + inflation)^years
 *
 * Alle vier Pipeline-Stages werden zurückgegeben, damit das UI sie auflisten
 * kann. Bei `yearsToRetirement <= 0` wird die Hochrechnung übersprungen
 * (Eintritt heute), die Korrektur greift trotzdem.
 */
export function projectedNetPensionToday(
  grossWithoutAdjustment: number,
  raise: number,
  deductionPct: number,
  inflation: number,
  yearsToRetirement: number,
  adjust?: {
    retirementAge: number;
    regelalter: number;
    contributionStartAge: number;
  },
): {
  grossBeforeAdjustment: number;
  abschlagPct: number;
  beitragsFaktor: number;
  grossAdjusted: number;
  grossNominal: number;
  netNominal: number;
  netReal: number;
} {
  const correction = adjust
    ? adjustGrossForEarlyRetirement(
        grossWithoutAdjustment,
        adjust.retirementAge,
        adjust.regelalter,
        adjust.contributionStartAge,
      )
    : { adjustedGross: grossWithoutAdjustment, abschlagPct: 0, beitragsFaktor: 1 };

  const grossAdjusted = correction.adjustedGross;

  if (yearsToRetirement <= 0) {
    const netNominal = applyPensionDeduction(grossAdjusted, deductionPct);
    return {
      grossBeforeAdjustment: grossWithoutAdjustment,
      abschlagPct: correction.abschlagPct,
      beitragsFaktor: correction.beitragsFaktor,
      grossAdjusted,
      grossNominal: grossAdjusted,
      netNominal,
      netReal: netNominal,
    };
  }
  const grossNominal = grossAdjusted * Math.pow(1 + raise, yearsToRetirement);
  const netNominal = applyPensionDeduction(grossNominal, deductionPct);
  const netReal = netNominal / Math.pow(1 + inflation, yearsToRetirement);
  return {
    grossBeforeAdjustment: grossWithoutAdjustment,
    abschlagPct: correction.abschlagPct,
    beitragsFaktor: correction.beitragsFaktor,
    grossAdjusted,
    grossNominal,
    netNominal,
    netReal,
  };
}

/** Woher die erwartete Netto-Rente stammt — fürs UI, um den Zustand zu benennen. */
export type StatePensionSource = "override" | "renteninfo" | "fallback";

/**
 * Erwartete gesetzliche Netto-Rente (heutige Kaufkraft) aus Profil + Modul-State
 * ableiten — reine Funktion, `currentYear` kommt von außen (Testbarkeit).
 *
 * Präzedenz:
 *   1. "override"   — manuell gesetzter Wert (`expectedStatePension !== null`)
 *   2. "renteninfo" — Live-Berechnung aus den persistierten Renteninfo-Rohwerten
 *                     via `projectedNetPensionToday` (mit aktuellen Werten für
 *                     Renteneintritt, Inflation, Regelalter, Beitragsbeginn)
 *   3. "fallback"   — 48-%-Faustformel vom Netto-Einkommen
 *
 * Ersetzt den früheren eingefrorenen Snapshot: Änderungen an Renteneintritt
 * oder Inflation schlagen damit automatisch auf das Ergebnis durch.
 */
export function deriveExpectedStatePension(
  profile: { age?: number; retirementAge?: number; netIncomeMonthly?: number },
  m: {
    expectedStatePension: number | null;
    pensionInfo: { grossWithoutAdjustment: number | null; raise: number; deduction: number };
    inflation: number;
    contributionStartAge: number;
  },
  currentYear: number,
): {
  monthly: number;
  source: StatePensionSource;
  projection?: ReturnType<typeof projectedNetPensionToday>;
} {
  if (m.expectedStatePension !== null) {
    return { monthly: m.expectedStatePension, source: "override" };
  }

  const gross = m.pensionInfo.grossWithoutAdjustment;
  if (gross !== null) {
    const retirementAge = profile.retirementAge ?? PENSION_DEFAULTS.retirementAge;
    const yearsToRetirement = Math.max(0, retirementAge - (profile.age ?? 0));
    // Je nach Geburtstag bis zu 1 Jahrgang daneben — kostet bei der
    // Regelaltersgrenze maximal 2 Monate, bewusst kein eigenes Eingabefeld.
    const birthYear = profile.age !== undefined ? currentYear - profile.age : undefined;
    const regelalter =
      birthYear !== undefined ? regelaltersgrenze(birthYear) : PENSION_DEFAULTS.retirementAge;
    const projection = projectedNetPensionToday(
      gross,
      m.pensionInfo.raise,
      m.pensionInfo.deduction,
      m.inflation,
      yearsToRetirement,
      { retirementAge, regelalter, contributionStartAge: m.contributionStartAge },
    );
    return { monthly: Math.round(projection.netReal), source: "renteninfo", projection };
  }

  return {
    monthly: (profile.netIncomeMonthly ?? 0) * PENSION_DEFAULTS.statePensionFactor,
    source: "fallback",
  };
}

/**
 * Regelaltersgrenze nach SGB VI § 235.
 *  - Jahrgänge bis 1946: 65
 *  - Jahrgänge 1947–1958: +1 Monat pro Jahr (65y 1m … 66y 0m)
 *  - Jahrgänge 1959–1963: +2 Monate pro Jahr (66y 2m … 66y 10m)
 *  - Jahrgänge ab 1964: 67
 *
 * Quelle: Deutsche Rentenversicherung.
 */
export function regelaltersgrenze(birthYear: number): number {
  if (birthYear <= 1946) return 65;
  if (birthYear >= 1964) return 67;
  const monthsExtra =
    birthYear <= 1958
      ? birthYear - 1946 // 1 … 12 Monate
      : 12 + (birthYear - 1958) * 2; // 14, 16, 18, 20, 22 Monate
  return 65 + monthsExtra / 12;
}

/**
 * Reduziert die Renteninfo-Brutto-Rente um:
 *  - Abschläge: 0,3 % pro Monat vorzeitig — gerechnet ab dem Anspruchsalter
 *    (claimAge = max(retirementAge, 63)), denn die gesetzliche Rente fließt
 *    frühestens ab 63. Der Cap bei 14,4 % (48 Monate × 0,3 %) bleibt als
 *    Sicherheitsnetz erhalten.
 *  - Beitragsjahre-Faktor: tatsächliche / geplante Beitragsmonate, linear —
 *    basiert auf retirementAge, weil die Beiträge mit dem Arbeitsende enden.
 *
 * Bei Eintritt zur Regelaltersgrenze oder später bleibt die Brutto-Rente
 * unverändert. Zuschläge für späteren Eintritt sind bewusst NICHT modelliert
 * (separater Scope, betrifft Edge-Case-Nutzer).
 */
export function adjustGrossForEarlyRetirement(
  grossWithoutAdjustment: number,
  retirementAge: number,
  regelalter: number,
  contributionStartAge: number,
): { adjustedGross: number; abschlagPct: number; beitragsFaktor: number } {
  if (retirementAge >= regelalter) {
    return {
      adjustedGross: grossWithoutAdjustment,
      abschlagPct: 0,
      beitragsFaktor: 1,
    };
  }
  const claimAge = Math.max(retirementAge, STATE_PENSION_MIN_CLAIM_AGE);
  const monthsEarly = Math.max(0, (regelalter - claimAge) * 12);
  const abschlagPct = Math.min(0.144, monthsEarly * 0.003);

  const plannedContributionMonths = (regelalter - contributionStartAge) * 12;
  const actualContributionMonths = (retirementAge - contributionStartAge) * 12;
  const beitragsFaktor =
    plannedContributionMonths <= 0
      ? 0
      : Math.max(0, actualContributionMonths / plannedContributionMonths);

  const adjustedGross = grossWithoutAdjustment * (1 - abschlagPct) * beitragsFaktor;
  return { adjustedGross, abschlagPct, beitragsFaktor };
}
