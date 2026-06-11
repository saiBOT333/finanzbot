import {
  annualToMonthlyRate,
  compound,
  presentValueAnnuity,
  presentValueGrowingAnnuity,
  weightedFutureValueAnnuityFactor,
} from "../../lib/finance";
import { STATE_PENSION_MIN_CLAIM_AGE } from "./constants";
import type { PensionInputs, PensionResult } from "./types";

function weightedAverage(buckets: Array<{ weight: number; rate: number }>): number {
  const total = buckets.reduce((s, b) => s + b.weight, 0);
  if (total === 0) return 0;
  return buckets.reduce((s, b) => s + (b.weight / total) * b.rate, 0);
}

/**
 * Gewichteter Barwert einer VORSCHÜSSIGEN Entnahme: je Bucket wird der
 * nachschüssige Phasen-Barwert `pvAtRate(rate)` mit dem Faktor (1 + rate)
 * auf Zahlung am Monatsanfang umgestellt (der Rentenbedarf fällt am
 * Monatsanfang an, nicht am Monatsende).
 */
function weightedPresentValueDue(
  buckets: Array<{ weight: number; rate: number }>,
  pvAtRate: (rate: number) => number,
): number {
  const totalWeight = buckets.reduce((s, b) => s + b.weight, 0);
  if (totalWeight === 0) return 0;
  return buckets.reduce(
    (sum, b) => sum + (b.weight / totalWeight) * pvAtRate(b.rate) * (1 + b.rate),
    0,
  );
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
 *   ρ    Nominale jährliche Rentenanpassung           inputs.statePensionRaise
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
 *   2.  L  = max(0; B − R)               Rentenlücke monatlich heute
 *   3.  n  = a₊ − a                      Jahre bis Rente
 *   3b. Frühverrentungs-Brücke: die gesetzliche Rente fließt frühestens ab 63
 *       (STATE_PENSION_MIN_CLAIM_AGE). Bei a₊ < 63 zerfällt die Auszahlphase:
 *         Brücke (a₊ → 63):   voller Bedarf B als Annuität über b = 63 − a₊ Jahre
 *         Hauptphase (63 → Planungsalter): nur noch die Lücke L
 *       Bei a₊ ≥ 63 ist b = 0 und alles kollabiert exakt auf die Formeln 4a/4b.
 *   3c. Sinkende Realrente: die Anpassung ρ liegt typischerweise unter der
 *       Inflation i, die Rente schrumpft real während des Bezugs mit
 *         g = (1 + ρ) / (1 + i) − 1        (Default ≈ −0,5 % p. a.)
 *       Die Hauptphasen-Lücke ist daher keine konstante Annuität, sondern die
 *       Differenz "konstanter Bedarf B − wachsende (schrumpfende) Rente R".
 *       Bei ρ = i ist g = 0 und alles kollabiert auf die konstante Lücke L.
 *   3d. Entnahme-Timing: der Rentenbedarf fällt am MONATSANFANG an, die
 *       Auszahl-Annuitäten sind daher vorschüssig (Faktor × (1 + rₐₘ)).
 *       Die Sparseite bleibt nachschüssig — konservativ.
 *   4a. Annuität:        K₀ = K_B + K_H
 *         K_B = B × (1 − (1 + rₐₘ)^−(b·12)) / rₐₘ × (1 + rₐₘ)
 *         K_H = max(0; B × aₘ − R × aᵍₘ) × (1 + rₐₘ) / (1 + rₐₘ)^(b·12)
 *           aₘ  = (1 − (1 + rₐₘ)^−((T−b)·12)) / rₐₘ              (konstanter Bedarf)
 *           aᵍₘ = (1 − ((1+gₘ)/(1+rₐₘ))^((T−b)·12)) / (rₐₘ − gₘ)  (schrumpfende Rente)
 *       (K_H ist der Barwert zum Rentenanspruch, abgezinst auf den Renteneintritt;
 *       die Klemme auf 0 greift, wenn die Rente den Bedarf durchgehend deckt)
 *   4b. Safe-Withdrawal: K₀ = K_B + L × 12 / w
 *       (SWR-Kapital bewusst NICHT um die Brückenjahre abgezinst — konservativ,
 *       weil die SWR-Logik "ewiges" Kapital unterstellt, kein Verzehr-Enddatum.
 *       Die sinkende Realrente fließt hier ebenfalls bewusst nicht ein: die
 *       SWR-Methode arbeitet mit der heutigen Lücke L als Daumenwert)
 *   5.  K  = K₀ × (1 + τ)                Steuer-Puffer auf Kapital
 *   6.  K₀ₙ = K₀ᵥ × (1 + r)^n            heutiges Vermögen, real aufgezinst
 *   7.  K* = max(0, K − K₀ₙ)             noch zu sparendes Kapital
 *   8.  rₘ = (1 + r)^(1/12) − 1          monatliche reale Rendite
 *       m  = n × 12                      Sparmonate
 *   9.  S  = K* / (((1 + rₘ)^m − 1) / rₘ)    monatliche Sparrate
 *   10. s  = S / N                       Sparquote (Anteil des Netto)
 *   11. Lₙ = L × (1 + i)^n               Lücke nominal bei Renteneintritt (Anzeige)
 *
 * Annahme Rebalancing: die Per-Bucket-Aufzinsung (Schritte 6 und 9 sowie die
 * Auszahl-Buckets) heißt implizit KEIN Rebalancing — jede Position bzw.
 * Allokations-Scheibe läuft über die gesamte Laufzeit mit ihrer eigenen
 * Rendite weiter, Umschichtungen zwischen Anlageklassen sind nicht modelliert.
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
    statePensionRaise,
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
    return {
      kind: "invalid",
      reason:
        "Die Rentenbezugsdauer muss positiv sein. Setze das Planungsalter (Schritt 04, Auszahlung) über den Renteneintritt.",
    };
  }
  if (payoutMethod === "safe-withdrawal" && safeWithdrawalRate <= 0) {
    return { kind: "invalid", reason: "Die Entnahmerate muss positiv sein." };
  }

  const yearsToRetirement = retirementAge - currentAge;
  const needToday = netIncomeMonthly * replacementRate;
  // Lücke nie negativ: deckt die Rente den Bedarf, bleibt für die Hauptphase
  // schlicht nichts zu finanzieren (Brückenbedarf kann trotzdem bestehen).
  const gapToday = Math.max(0, needToday - expectedStatePension);

  // Frühverrentungs-Brücke: gesetzliche Rente frühestens ab 63. Bei der
  // Annuität auf die Bezugsdauer gedeckelt (Planungsalter < 63 ist absurd,
  // aber nicht verboten).
  const rawBridgeYears = Math.max(0, STATE_PENSION_MIN_CLAIM_AGE - retirementAge);
  const bridgeYears =
    payoutMethod === "annuity" ? Math.min(rawBridgeYears, payoutYears) : rawBridgeYears;

  if (gapToday <= 0 && bridgeYears === 0) {
    return { kind: "no-gap", needToday, expectedStatePension };
  }

  // Annuity capital uses a MONTHLY annuity (payment, rate and periods all
  // monthly) so the withdrawal timing matches reality. An annual annuity
  // treats the whole year's gap as a single year-end payment and understates
  // the capital need by ~0.5–1.5 %. Die Annuitäten sind VORSCHÜSSIG
  // (Bedarf am Monatsanfang, Faktor 1 + rₐₘ) — die Sparseite bleibt
  // nachschüssig, konservativ.
  const monthlyPayoutBuckets = payoutBuckets.map((b) => ({
    weight: b.weight,
    rate: annualToMonthlyRate(b.rate),
  }));
  const bridgeMonths = bridgeYears * 12;
  const mainMonths = (payoutYears - bridgeYears) * 12;
  // Sinkende Realrente: Anpassung ρ < Inflation i ⇒ die gesetzliche Rente
  // schrumpft real während des Bezugs mit g = (1+ρ)/(1+i) − 1.
  const pensionRealGrowthMonthly = annualToMonthlyRate(
    (1 + statePensionRaise) / (1 + inflation) - 1,
  );
  // Brückenphase: voller Bedarf B, weil noch keine gesetzliche Rente fließt.
  const bridgeCapital = weightedPresentValueDue(monthlyPayoutBuckets, (rate) =>
    presentValueAnnuity(needToday, rate, bridgeMonths),
  );
  // Hauptphase ab Rentenanspruch: Lücke als Differenz "konstanter Bedarf B −
  // real schrumpfende Rente R" (wachsende Annuität; bei ρ = i kollabiert das
  // auf die konstante Lücke L). Bei der Annuität wird der Barwert um die
  // Brückenmonate auf den Renteneintritt abgezinst; das SWR-Kapital bewusst
  // nicht (konservativ — die SWR-Logik unterstellt "ewiges" Kapital ohne
  // Verzehr-Enddatum) und ohne Schrumpf-Modell (Daumenwert auf Basis der
  // heutigen Lücke L). Klemme auf 0: deckt die Rente den Bedarf durchgehend,
  // bleibt für die Hauptphase nichts zu finanzieren. Vereinfachung: kippt
  // B − R(t) erst mitten in der Hauptphase ins Positive, verrechnet die
  // Differenz Überschüsse und Lücken miteinander.
  const mainCapital =
    payoutMethod === "annuity"
      ? Math.max(
          0,
          weightedPresentValueDue(
            monthlyPayoutBuckets,
            (rate) =>
              (presentValueAnnuity(needToday, rate, mainMonths) -
                presentValueGrowingAnnuity(
                  expectedStatePension,
                  rate,
                  pensionRealGrowthMonthly,
                  mainMonths,
                )) /
              Math.pow(1 + rate, bridgeMonths),
          ),
        )
      : (gapToday * 12) / safeWithdrawalRate;
  const capitalNeededBeforeTax = bridgeCapital + mainCapital;

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
    bridgeYears,
    bridgeCapital,
    mainCapital,
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
