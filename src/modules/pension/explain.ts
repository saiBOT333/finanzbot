import { formatEUR, formatNumber, formatPercent } from "../../lib/format";
import { PENSION_DEFAULTS } from "./defaults";
import type { PensionInputs, PensionResult } from "./types";

function describeBuckets(buckets: Array<{ weight: number; rate: number }>): string {
  return buckets
    .filter((b) => b.weight > 0)
    .map((b) => `${formatPercent(b.weight)} @ ${formatPercent(b.rate)}`)
    .join(" + ");
}

export type ExplanationInput = {
  label: string;
  symbol: string;
  value: string;
  isDefault: boolean;
};

export type ExplanationStep = {
  index: number;
  title: string;
  formula: string;
  substituted: string;
  result: string;
  note?: string;
};

export type Explanation = {
  inputs: ExplanationInput[];
  steps: ExplanationStep[];
  closing: string;
};

/**
 * Builds a step-by-step trace of the pension calculation. Mirrors
 * calculations.ts exactly so users can audit every number on screen.
 */
export function explainPension(
  inputs: PensionInputs,
  result: Extract<PensionResult, { kind: "ok" }>,
): Explanation {
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

  const r = result.effectiveSavingReturn;
  const rPay = result.effectivePayoutReturn;
  const rMonthly = Math.pow(1 + r, 1 / 12) - 1;
  const rPayMonthly = Math.pow(1 + rPay, 1 / 12) - 1;
  const months = result.yearsToRetirement * 12;
  const useAnnuity = payoutMethod === "annuity";
  const payoutMonths = payoutYears * 12;
  const rPayMonthlyStr = `${(rPayMonthly * 100).toFixed(4).replace(".", ",")} %`;

  const inputsTable: ExplanationInput[] = [
    { label: "Aktuelles Alter", symbol: "a", value: `${formatNumber(currentAge)} Jahre`, isDefault: false },
    {
      label: "Renteneintritt",
      symbol: "a₊",
      value: `${formatNumber(retirementAge)} Jahre`,
      isDefault: retirementAge === PENSION_DEFAULTS.retirementAge,
    },
    {
      label: "Netto-Einkommen / Monat",
      symbol: "N",
      value: formatEUR(netIncomeMonthly),
      isDefault: false,
    },
    {
      label: "Bedarfsquote",
      symbol: "q",
      value: formatPercent(replacementRate),
      isDefault: replacementRate === PENSION_DEFAULTS.replacementRate,
    },
    {
      label: "Erwartete gesetzl. Netto-Rente (heute)",
      symbol: "R",
      value: formatEUR(expectedStatePension),
      isDefault:
        Math.abs(expectedStatePension - netIncomeMonthly * PENSION_DEFAULTS.statePensionFactor) <
        0.5,
    },
    {
      label: "Inflation",
      symbol: "i",
      value: formatPercent(inflation),
      isDefault: inflation === PENSION_DEFAULTS.inflation,
    },
    {
      label: "Reale Rendite Sparphase (gewichtet)",
      symbol: "r",
      value: `${formatPercent(r)}    [${describeBuckets(savingsBuckets)}]`,
      isDefault: false,
    },
    {
      label: "Reale Rendite Auszahlphase (gewichtet)",
      symbol: "rₐ",
      value: `${formatPercent(rPay)}    [${describeBuckets(payoutBuckets)}]`,
      isDefault: false,
    },
    {
      label: "Bestehendes Vorsorge-Vermögen (Summe)",
      symbol: "K₀ᵥ",
      value: formatEUR(existingAssets.reduce((s, a) => s + a.amount, 0)),
      isDefault: existingAssets.length === 0,
    },
    {
      label: "Methode Auszahlphase",
      symbol: "M",
      value: useAnnuity ? "Annuität" : "Sichere Entnahmerate",
      isDefault: payoutMethod === PENSION_DEFAULTS.payoutMethod,
    },
    useAnnuity
      ? {
          label: "Rentenbezugsdauer",
          symbol: "T",
          value: `${formatNumber(payoutYears)} Jahre`,
          isDefault: payoutYears === PENSION_DEFAULTS.payoutYears,
        }
      : {
          label: "Sichere Entnahmerate",
          symbol: "w",
          value: formatPercent(safeWithdrawalRate),
          isDefault: safeWithdrawalRate === PENSION_DEFAULTS.safeWithdrawalRate,
        },
    {
      label: "Steuer-Puffer auf Kapital",
      symbol: "τ",
      value: formatPercent(taxBufferPct),
      isDefault: taxBufferPct === PENSION_DEFAULTS.taxBufferPct,
    },
  ];

  const capitalStep: ExplanationStep = useAnnuity
    ? {
        index: 4,
        title: "Kapitalbedarf vor Steuer (Annuität)",
        formula: "K₀ = L × (1 − (1 + rₐₘ)^−m) / rₐₘ",
        substituted: `K₀ = ${formatEUR(result.gapToday)} × (1 − (1 + ${rPayMonthlyStr})^−${payoutMonths}) / ${rPayMonthlyStr}`,
        result: `K₀ = ${formatEUR(result.capitalNeededBeforeTax)}`,
        note: `Barwert einer monatlich entnommenen Rente L über T Jahre. rₐₘ ist die monatliche reale Auszahlrendite — (1 + rₐ)^(1/12) − 1 — und m = T × 12 = ${payoutMonths} Monate. Damit ist das Kapital am Ende von T Jahren genau aufgebraucht — Finanztip-Methode.`,
      }
    : {
        index: 4,
        title: "Kapitalbedarf vor Steuer (Sichere Entnahmerate)",
        formula: "K₀ = L × 12 / w",
        substituted: `K₀ = ${formatEUR(result.gapToday)} × 12 / ${formatPercent(safeWithdrawalRate)}`,
        result: `K₀ = ${formatEUR(result.capitalNeededBeforeTax)}`,
        note: "Mit jährlich entnommenen w des Anfangsvermögens und realer Rendite ≥ w bleibt das Vermögen voraussichtlich unbegrenzt erhalten — Finanzfluss-Methode (Trinity-Studie).",
      };

  const steps: ExplanationStep[] = [
    {
      index: 1,
      title: "Bedarf im Ruhestand (heute)",
      formula: "B = N × q",
      substituted: `B = ${formatEUR(netIncomeMonthly)} × ${formatPercent(replacementRate)}`,
      result: `B = ${formatEUR(result.needToday)} pro Monat`,
      note: "Faustformel Finanztip/Finanzfluss: ca. 80 % des heutigen Netto-Einkommens reichen im Ruhestand, weil Pendelkosten, Sparraten und i. d. R. die Tilgung wegfallen.",
    },
    {
      index: 2,
      title: "Rentenlücke pro Monat (heute)",
      formula: "L = B − R",
      substituted: `L = ${formatEUR(result.needToday)} − ${formatEUR(expectedStatePension)}`,
      result: `L = ${formatEUR(result.gapToday)} pro Monat`,
      note: "Was die gesetzliche Rente nicht abdeckt — der Teil, den du selbst aufbauen musst. Heutige Kaufkraft.",
    },
    {
      index: 3,
      title: "Jahre bis zum Renteneintritt",
      formula: "n = a₊ − a",
      substituted: `n = ${formatNumber(retirementAge)} − ${formatNumber(currentAge)}`,
      result: `n = ${formatNumber(result.yearsToRetirement)} Jahre`,
    },
    capitalStep,
    {
      index: 5,
      title: "Steuer-Puffer auf das Kapital",
      formula: "K = K₀ × (1 + τ)",
      substituted: `K = ${formatEUR(result.capitalNeededBeforeTax)} × (1 + ${formatPercent(taxBufferPct)})`,
      result: `K = ${formatEUR(result.capitalNeeded)}    (Puffer: ${formatEUR(result.taxBufferAmount)})`,
      note: "Aufschlag für die Kapitalertragssteuer von 26,375 %. Bewusste Vereinfachung: die Steuer fällt real nur auf die Gewinne an, der Puffer wird hier als pauschaler Prozentsatz auf das Gesamtkapital gerechnet — Finanzfluss-Faustformel: 10–15 % zusätzliches Vermögen einplanen.",
    },
    {
      index: 6,
      title: "Heutiges Vermögen, je Bucket real aufgezinst",
      formula: "K₀ₙ = Σ K₀ᵢ × (1 + rᵢ)^n",
      substituted:
        existingAssets.length === 0
          ? "K₀ₙ = 0"
          : existingAssets
              .map(
                (a, i) =>
                  `${i === 0 ? "K₀ₙ = " : "      + "}${formatEUR(a.amount)} × (1 + ${formatPercent(a.realReturn)})^${result.yearsToRetirement}`,
              )
              .join("\n"),
      result: `K₀ₙ = ${formatEUR(result.existingFV)}`,
      note:
        existingAssets.length === 0
          ? "Du hast bisher kein Vermögen erfasst — daher ist dieser Beitrag 0."
          : "Jede Position wächst mit ihrer eigenen realen Rendite. Tagesgeld stagniert, ETF wächst kräftig — die Summe ergibt das voraussichtliche Vermögen bei Renteneintritt.",
    },
    {
      index: 7,
      title: "Verbleibender Kapitalbedarf",
      formula: "K* = max(0; K − K₀ₙ)",
      substituted: `K* = max(0; ${formatEUR(result.capitalNeeded)} − ${formatEUR(result.existingFV)})`,
      result: `K* = ${formatEUR(result.remainingCapital)}`,
      note: "Den Teil, den du noch durch monatliches Sparen aufbauen musst.",
    },
    {
      index: 8,
      title: "Monatliche reale Rendite und Sparmonate",
      formula: "rₘ = (1 + r)^(1/12) − 1   ·   m = n × 12",
      substituted: `rₘ = (1 + ${formatPercent(r)})^(1/12) − 1   ·   m = ${result.yearsToRetirement} × 12`,
      result: `rₘ ≈ ${(rMonthly * 100).toFixed(4).replace(".", ",")} %   ·   m = ${formatNumber(months)} Monate`,
      note: "Wir rechnen die jährliche Rendite in eine monatliche um, damit Sparrate und Rendite im selben Takt laufen.",
    },
    {
      index: 9,
      title: "Empfohlene monatliche Sparrate",
      formula: "S = K* / (((1 + rₘ)^m − 1) / rₘ)",
      substituted: `S = ${formatEUR(result.remainingCapital)} / (((1 + rₘ)^${formatNumber(months)} − 1) / rₘ)`,
      result: `S = ${formatEUR(result.monthlySavings, true)} pro Monat`,
      note: "Umkehrung der Formel für den Endwert eines Sparplans: welche monatliche Rate ergibt nach m Monaten genau K*?",
    },
    {
      index: 10,
      title: "Sparrate als Anteil deines Netto-Einkommens",
      formula: "s = S / N",
      substituted: `s = ${formatEUR(result.monthlySavings, true)} / ${formatEUR(netIncomeMonthly)}`,
      result: `s = ${formatPercent(result.savingsRatePct / 100)}`,
      note: "Zum Vergleich: deutscher Durchschnitt ~11 %. Für eine ausreichende Altersvorsorge gelten 15–20 % als realistisch (Finanzfluss).",
    },
    {
      index: 11,
      title: "Lücke umgerechnet in nominale Euro bei Renteneintritt",
      formula: "Lₙ = L × (1 + i)^n",
      substituted: `Lₙ = ${formatEUR(result.gapToday)} × (1 + ${formatPercent(inflation)})^${result.yearsToRetirement}`,
      result: `Lₙ ≈ ${formatEUR(result.gapAtRetirementNominal)} pro Monat`,
      note: "Nur als Plausibilitäts-Anker: in 'echten' Euro bei Renteneintritt. Die Hauptrechnung läuft real, damit Inflation und Rendite nicht doppelt verrechnet werden.",
    },
  ];

  const closing =
    "Alle Geldbeträge in der Hauptrechnung sind in heutiger Kaufkraft. Reale Rendite r heißt: Rendite NACH Abzug der Inflation. So lassen sich Sparrate und Rentenlücke direkt vergleichen, ohne Inflation doppelt zu berücksichtigen.";

  // The weighted payout return rₐ only feeds the annuity capital step. Under
  // the safe-withdrawal method it is unused — drop it so the trace shows no
  // input that doesn't influence a result.
  const visibleInputs = useAnnuity
    ? inputsTable
    : inputsTable.filter((i) => i.symbol !== "rₐ");

  return { inputs: visibleInputs, steps, closing };
}
