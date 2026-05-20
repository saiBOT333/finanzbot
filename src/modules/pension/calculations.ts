import {
  annualToMonthlyRate,
  compound,
  weightedFutureValueAnnuityFactor,
  weightedPresentValueAnnuity,
} from "../../lib/finance";
import type { PensionInputs, PensionResult } from "./types";

function weightedAverage(buckets: Array<{ weight: number; rate: number }>): number {
  const total = buckets.reduce((s, b) => s + b.weight, 0);
  if (total === 0) return 0;
  return buckets.reduce((s, b) => s + (b.weight / total) * b.rate, 0);
}

/* ─────────────────────────────────────────────────────────────────────────────
 *                     FORMEL-STAMMTISCH (Renten-Modul)
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Alles Geld in HEUTIGER KAUFKRAFT, alle Renditen REAL (nach Inflation).
 * So vermeiden wir, Inflation und Rendite doppelt zu verrechnen — der häufigste
 * Fehler in Rentenrechnungen.
 *
 * Eingangsgrößen
 *   N    Netto-Einkommen pro Monat (heute)            inputs.netIncomeMonthly
 *   q    Bedarfsquote                                 inputs.replacementRate
 *   R    Erwartete Netto-Rente (heute, Monat)         inputs.expectedStatePension
 *   a    Aktuelles Alter                              inputs.currentAge
 *   a₊   Renteneintrittsalter                         inputs.retirementAge
 *   r    Reale Rendite Sparphase                      inputs.realReturn
 *   rₐ   Reale Rendite Auszahlphase                   inputs.payoutRealReturn
 *   T    Rentenbezugsdauer (Jahre, nur Annuität)      inputs.payoutYears
 *   w    Sichere Entnahmerate (nur SWR-Methode)       inputs.safeWithdrawalRate
 *   τ    Steuer-Puffer auf das Kapital                inputs.taxBufferPct
 *   K₀ᵥ  Bestehendes Vermögen (heute)                 inputs.existingSavings
 *   i    Inflation (nur als Anzeige-Hilfe)            inputs.inflation
 *
 * Schritte
 *   1.  B  = N × q                       Bedarf monatlich heute
 *   2.  L  = B − R                       Rentenlücke monatlich heute
 *   3.  n  = a₊ − a                      Jahre bis Rente
 *   4a. Annuität:        K₀ = L × (1 − (1 + rₐₘ)^−(T·12)) / rₐₘ   (rₐₘ = monatl. rₐ)
 *   4b. Safe-Withdrawal: K₀ = L × 12 / w
 *   5.  K  = K₀ × (1 + τ)                Steuer-Puffer auf Kapital
 *   6.  K₀ₙ = K₀ᵥ × (1 + r)^n            heutiges Vermögen, real aufgezinst
 *   7.  K* = max(0, K − K₀ₙ)             noch zu sparendes Kapital
 *   8.  rₘ = (1 + r)^(1/12) − 1          monatliche reale Rendite
 *       m  = n × 12                      Sparmonate
 *   9.  S  = K* / (((1 + rₘ)^m − 1) / rₘ)    monatliche Sparrate
 *   10. s  = S / N                       Sparquote (Anteil des Netto)
 *   11. Lₙ = L × (1 + i)^n               Lücke nominal bei Renteneintritt (Anzeige)
 *
 * Quellen
 *   - Finanztip "Rentenlücke berechnen" (Beispiel Daniela)        Schritte 1–4a, 11
 *   - Finanzfluss "Sparquote – wie viel musst du sparen?" (Carlotta)
 *                                                                 Schritte 1, 2, 4b
 *   - Trinity-Studie (Bengen 1994 / Cooley et al. 1998)            Konstante w = 3,5 %
 *   - Faustformel-Konstanten siehe `constants.ts`
 *   - Cross-Check-Tests: `calculations.test.ts` (Daniela & Carlotta reproduzierbar)
 *
 * Magic-Numbers leben in `constants.ts` — Defaults zentral schraubbar.
 * Vorgegebene Profile (Konservativ / Standard / Investor) in `presets.ts`.
 * Erklär-Trace fürs UI in `explain.ts`.
 * ──────────────────────────────────────────────────────────────────────────── */
export function calculatePension(inputs: PensionInputs): PensionResult {
  const {
    currentAge,
    retirementAge,
    netIncomeMonthly,
    replacementRate,
    expectedStatePension,
    inflation,
    savingsBuckets,
    payoutBuckets,
    existingAssets,
    payoutMethod,
    payoutYears,
    safeWithdrawalRate,
    taxBufferPct,
  } = inputs;

  const effectiveSavingReturn = weightedAverage(savingsBuckets);
  const effectivePayoutReturn = weightedAverage(payoutBuckets);

  if (currentAge <= 0 || retirementAge <= 0 || netIncomeMonthly <= 0) {
    return { kind: "invalid", reason: "Bitte Alter, Renteneintritt und Netto-Einkommen angeben." };
  }
  if (retirementAge <= currentAge) {
    return { kind: "already-retired" };
  }
  if (payoutMethod === "annuity" && payoutYears <= 0) {
    return { kind: "invalid", reason: "Die Rentenbezugsdauer muss positiv sein." };
  }
  if (payoutMethod === "safe-withdrawal" && safeWithdrawalRate <= 0) {
    return { kind: "invalid", reason: "Die Entnahmerate muss positiv sein." };
  }

  const yearsToRetirement = retirementAge - currentAge;
  const needToday = netIncomeMonthly * replacementRate;
  const gapToday = needToday - expectedStatePension;

  if (gapToday <= 0) {
    return { kind: "no-gap", needToday, expectedStatePension };
  }

  // Annuity capital uses a MONTHLY annuity (payment, rate and periods all
  // monthly) so the withdrawal timing matches reality. An annual annuity
  // treats the whole year's gap as a single year-end payment and understates
  // the capital need by ~0.5–1.5 %.
  const monthlyPayoutBuckets = payoutBuckets.map((b) => ({
    weight: b.weight,
    rate: annualToMonthlyRate(b.rate),
  }));
  const capitalNeededBeforeTax =
    payoutMethod === "annuity"
      ? weightedPresentValueAnnuity(gapToday, monthlyPayoutBuckets, payoutYears * 12)
      : (gapToday * 12) / safeWithdrawalRate;

  const taxBufferAmount = capitalNeededBeforeTax * taxBufferPct;
  const capitalNeeded = capitalNeededBeforeTax + taxBufferAmount;
  // Same figure expressed in nominal euros at retirement — display anchor only,
  // so the user can reconcile the real number with a back-of-envelope estimate.
  const capitalNeededNominal = capitalNeeded * Math.pow(1 + inflation, yearsToRetirement);

  // Each existing asset compounds at its own real return — Tagesgeld stagniert,
  // ETF wächst kräftig. Summe ergibt das gesamte zukünftige Vermögen.
  const existingFV = existingAssets.reduce(
    (sum, a) => sum + compound(a.amount, a.realReturn, yearsToRetirement),
    0,
  );
  const existingFVNominal = existingFV * Math.pow(1 + inflation, yearsToRetirement);
  const remainingCapital = Math.max(0, capitalNeeded - existingFV);

  // Each savings bucket compounds independently at its own monthly real rate.
  // Sum of per-bucket FV-Annuities for a 1 € payment gives the inverse factor
  // used to derive the required monthly contribution.
  const months = yearsToRetirement * 12;
  const monthlyBuckets = savingsBuckets.map((b) => ({
    weight: b.weight,
    rate: annualToMonthlyRate(b.rate),
  }));
  const fvFactor = weightedFutureValueAnnuityFactor(monthlyBuckets, months);
  const monthlySavings =
    remainingCapital === 0 || fvFactor === 0 ? 0 : remainingCapital / fvFactor;

  // Fixed nominal savings: constant nominal monthly payment (no annual inflation adjustment needed).
  // Each bucket's real rate is converted to nominal: r_nom = (1+r_real)(1+inflation) - 1.
  // The remaining capital target is also scaled to nominal euros at retirement.
  const nominalMonthlyBuckets = savingsBuckets.map((b) => ({
    weight: b.weight,
    rate: annualToMonthlyRate((1 + b.rate) * (1 + inflation) - 1),
  }));
  const nominalFvFactor = weightedFutureValueAnnuityFactor(nominalMonthlyBuckets, months);
  const remainingCapitalNominal = remainingCapital * Math.pow(1 + inflation, yearsToRetirement);
  const fixedNominalSavings =
    remainingCapital === 0 || nominalFvFactor === 0
      ? 0
      : remainingCapitalNominal / nominalFvFactor;

  const savingsRatePct = (monthlySavings / netIncomeMonthly) * 100;
  const gapAtRetirementNominal = gapToday * Math.pow(1 + inflation, yearsToRetirement);

  return {
    kind: "ok",
    yearsToRetirement,
    needToday,
    gapToday,
    capitalNeededBeforeTax,
    taxBufferAmount,
    capitalNeeded,
    capitalNeededNominal,
    existingFV,
    existingFVNominal,
    remainingCapital,
    monthlySavings,
    fixedNominalSavings,
    savingsRatePct,
    gapAtRetirementNominal,
    effectiveSavingReturn,
    effectivePayoutReturn,
  };
}
