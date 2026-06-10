import { describe, it, expect } from "vitest";
import { calculatePension } from "./calculations";
import { withDefaults } from "./defaults";
import { annualToMonthlyRate, presentValueAnnuity } from "../../lib/finance";
import type { PensionInputs } from "./types";

const baseInputs: PensionInputs = withDefaults({
  currentAge: 35,
  netIncomeMonthly: 3000,
});

describe("calculatePension — happy path with default Finanztip/Finanzfluss settings", () => {
  it("returns 'ok' with plausible numbers for the textbook 35-year-old, 3000 € net case", () => {
    const r = calculatePension(baseInputs);
    expect(r.kind).toBe("ok");
    if (r.kind !== "ok") return;

    expect(r.yearsToRetirement).toBe(32);
    // Bedarf 80 % von 3000 = 2400; gesetzliche Rente 48 % von 3000 = 1440 → Lücke 960 €/Monat
    expect(r.needToday).toBe(2400);
    expect(r.gapToday).toBe(960);
    // With 30 J payout @ 3 % real and 12 % tax buffer the savings rate should be >> 8 %
    expect(r.savingsRatePct).toBeGreaterThan(8);
    expect(r.savingsRatePct).toBeLessThan(25);
  });

  it("having existing savings reduces the required monthly contribution", () => {
    const withSavings = calculatePension(
      withDefaults({ currentAge: 35, netIncomeMonthly: 3000, existingAssets: [{ amount: 50_000, realReturn: 0.05 }] }),
    );
    const without = calculatePension(baseInputs);
    if (withSavings.kind !== "ok" || without.kind !== "ok") throw new Error("expected ok");
    expect(withSavings.monthlySavings).toBeLessThan(without.monthlySavings);
  });

  it("a higher real return reduces the required monthly contribution", () => {
    const high = calculatePension(
      withDefaults({ currentAge: 35, netIncomeMonthly: 3000, savingsBuckets: [{ weight: 1, rate: 0.07 }] }),
    );
    const base = calculatePension(baseInputs);
    if (high.kind !== "ok" || base.kind !== "ok") throw new Error("expected ok");
    expect(high.monthlySavings).toBeLessThan(base.monthlySavings);
  });

  it("tax buffer increases the required capital", () => {
    const noTax = calculatePension(withDefaults({ ...baseInputs, taxBufferPct: 0 }));
    if (noTax.kind !== "ok" || calculatePension(baseInputs).kind !== "ok") throw new Error("ok");
    const withTax = calculatePension(baseInputs);
    if (withTax.kind !== "ok") throw new Error("ok");
    expect(withTax.capitalNeeded).toBeGreaterThan(noTax.capitalNeeded);
    expect(withTax.taxBufferAmount).toBeGreaterThan(0);
  });

  it("fixedNominalSavings is higher than monthlySavings (compensates for static contribution)", () => {
    const r = calculatePension(baseInputs);
    if (r.kind !== "ok") throw new Error("expected ok");
    // Constant nominal payment must start higher because later years lose to inflation —
    // the early years have to over-fund what the late years under-fund.
    expect(r.fixedNominalSavings).toBeGreaterThan(r.monthlySavings);
  });

  it("fixedNominalSavings === monthlySavings when inflation is 0", () => {
    const r = calculatePension(withDefaults({ ...baseInputs, inflation: 0 }));
    if (r.kind !== "ok") throw new Error("expected ok");
    expect(r.fixedNominalSavings).toBeCloseTo(r.monthlySavings, 2);
  });
});

describe("calculatePension — asset buckets grow individually", () => {
  it("a 50k€ ETF bucket reduces savings more than the same 50k€ on Tagesgeld", () => {
    const cash = calculatePension(
      withDefaults({
        currentAge: 35,
        netIncomeMonthly: 3000,
        existingAssets: [{ amount: 50_000, realReturn: 0 }],
      }),
    );
    const etf = calculatePension(
      withDefaults({
        currentAge: 35,
        netIncomeMonthly: 3000,
        existingAssets: [{ amount: 50_000, realReturn: 0.05 }],
      }),
    );
    if (cash.kind !== "ok" || etf.kind !== "ok") throw new Error("expected ok");
    expect(etf.existingFV).toBeGreaterThan(cash.existingFV);
    expect(etf.monthlySavings).toBeLessThan(cash.monthlySavings);
  });

  it("multiple buckets are summed correctly with their individual growth", () => {
    const r = calculatePension(
      withDefaults({
        currentAge: 35,
        netIncomeMonthly: 3000,
        existingAssets: [
          { amount: 30_000, realReturn: 0 },     // Tagesgeld
          { amount: 20_000, realReturn: 0.05 },  // ETF
        ],
      }),
    );
    if (r.kind !== "ok") throw new Error("expected ok");
    // 32 J: 30k stays 30k, 20k * 1.05^32 ≈ 95.5k → total ≈ 125.5k
    expect(r.existingFV).toBeGreaterThan(120_000);
    expect(r.existingFV).toBeLessThan(130_000);
  });

  it("an empty asset list yields existingFV of 0", () => {
    const r = calculatePension(
      withDefaults({ currentAge: 35, netIncomeMonthly: 3000, existingAssets: [] }),
    );
    if (r.kind !== "ok") throw new Error("expected ok");
    expect(r.existingFV).toBe(0);
  });
});

describe("calculatePension — edge cases", () => {
  it("flags 'already-retired' when retirementAge ≤ currentAge", () => {
    const r = calculatePension(withDefaults({ currentAge: 70, netIncomeMonthly: 3000 }));
    expect(r.kind).toBe("already-retired");
  });

  it("flags 'no-gap' when expected pension already covers the need", () => {
    const r = calculatePension(
      withDefaults({ currentAge: 35, netIncomeMonthly: 3000, expectedStatePension: 3000 }),
    );
    expect(r.kind).toBe("no-gap");
  });

  it("returns 'invalid' for missing essentials", () => {
    const r = calculatePension(withDefaults({}));
    expect(r.kind).toBe("invalid");
  });

  it("returns monthlySavings=0 when existing savings already cover the need", () => {
    const r = calculatePension(
      withDefaults({ currentAge: 35, netIncomeMonthly: 3000, existingAssets: [{ amount: 1_000_000, realReturn: 0.05 }] }),
    );
    if (r.kind !== "ok") throw new Error("expected ok");
    expect(r.monthlySavings).toBe(0);
    expect(r.remainingCapital).toBe(0);
  });

  it("nominal gap at retirement grows with inflation", () => {
    const r = calculatePension(baseInputs);
    if (r.kind !== "ok") throw new Error("expected ok");
    // 960 € today × 1.02^32 ≈ 1812 €
    expect(r.gapAtRetirementNominal).toBeGreaterThan(1700);
    expect(r.gapAtRetirementNominal).toBeLessThan(1900);
  });
});

describe("calculatePension — Finanztip cross-check (Daniela)", () => {
  // Source: Finanztip-Video "Rentenlücke berechnen", Beispiel Daniela.
  // 32 J, 4000 € brutto / 2600 € netto, Bedarf 2200 € heute, Netto-Rente 1360 € heute.
  // Methodik: 30 J Bezugsdauer, 5 % nominal Anspar / 3 % nominal Auszahl
  // (≈ 3 % real Anspar / 1 % real Auszahl). Keine Steuern berücksichtigt.
  // Erwartete Sparrate: ~360 €/Monat ≈ 14 % vom Netto.
  it("reproduces Daniela's ~360 €/month recommendation within ±10 %", () => {
    const r = calculatePension(
      withDefaults({
        currentAge: 32,
        retirementAge: 67,
        netIncomeMonthly: 2600,
        replacementRate: 2200 / 2600,
        expectedStatePension: 1360,
        savingsBuckets: [{ weight: 1, rate: 0.03 }], // 5 % nominal − 2 % inflation
        payoutBuckets: [{ weight: 1, rate: 0.01 }], // 3 % nominal − 2 % inflation
        payoutYears: 30,
        taxBufferPct: 0, // Finanztip ignores capital gains tax in this example
      }),
    );
    if (r.kind !== "ok") throw new Error("expected ok");
    expect(r.monthlySavings).toBeGreaterThan(320);
    expect(r.monthlySavings).toBeLessThan(400);
    expect(r.savingsRatePct).toBeGreaterThan(12);
    expect(r.savingsRatePct).toBeLessThan(16);
  });
});

describe("calculatePension — Finanzfluss cross-check (Carlotta)", () => {
  // Source: Finanzfluss-Video "Sparquote", Beispiel Carlotta.
  // 32 J, 2300 € netto, Lücke 1150 € heute (50 % vom Netto), 5 % real Rendite,
  // 35 J Anspardauer, 3,5 % Safe-Withdrawal, ohne Steuer-Puffer.
  // Erwartete Sparrate: ~356 €/Monat ≈ 15 % vom Netto.
  it("reproduces Carlotta's ~356 €/month recommendation (no-tax case) within ±10 %", () => {
    const r = calculatePension(
      withDefaults({
        currentAge: 32,
        retirementAge: 67,
        netIncomeMonthly: 2300,
        replacementRate: 0.8,
        expectedStatePension: 2300 * 0.3, // 30 % gesetzliche Rente
        savingsBuckets: [{ weight: 1, rate: 0.05 }],
        payoutBuckets: [{ weight: 1, rate: 0.05 }],
        payoutMethod: "safe-withdrawal",
        safeWithdrawalRate: 0.035,
        taxBufferPct: 0,
      }),
    );
    if (r.kind !== "ok") throw new Error("expected ok");
    expect(r.monthlySavings).toBeGreaterThan(320);
    expect(r.monthlySavings).toBeLessThan(390);
    expect(r.savingsRatePct).toBeGreaterThan(13);
    expect(r.savingsRatePct).toBeLessThan(17);
  });

  it("reproduces Carlotta's ~395 €/month recommendation with 11 % tax buffer", () => {
    const r = calculatePension(
      withDefaults({
        currentAge: 32,
        retirementAge: 67,
        netIncomeMonthly: 2300,
        replacementRate: 0.8,
        expectedStatePension: 2300 * 0.3,
        savingsBuckets: [{ weight: 1, rate: 0.05 }],
        payoutBuckets: [{ weight: 1, rate: 0.05 }],
        payoutMethod: "safe-withdrawal",
        safeWithdrawalRate: 0.035,
        taxBufferPct: 0.11,
      }),
    );
    if (r.kind !== "ok") throw new Error("expected ok");
    expect(r.monthlySavings).toBeGreaterThan(360);
    expect(r.monthlySavings).toBeLessThan(420);
  });

  it("safe-withdrawal needs more capital than annuity (everything else equal)", () => {
    const annuity = calculatePension(
      withDefaults({
        currentAge: 32,
        netIncomeMonthly: 2300,
        replacementRate: 0.8,
        expectedStatePension: 2300 * 0.3,
        payoutMethod: "annuity",
        payoutYears: 30,
        taxBufferPct: 0,
      }),
    );
    const safe = calculatePension(
      withDefaults({
        currentAge: 32,
        netIncomeMonthly: 2300,
        replacementRate: 0.8,
        expectedStatePension: 2300 * 0.3,
        payoutMethod: "safe-withdrawal",
        safeWithdrawalRate: 0.035,
        taxBufferPct: 0,
      }),
    );
    if (annuity.kind !== "ok" || safe.kind !== "ok") throw new Error("expected ok");
    expect(safe.capitalNeeded).toBeGreaterThan(annuity.capitalNeeded);
  });
});

describe("calculatePension — Frühverrentungs-Brücke", () => {
  // Bezugsfall: 40-Jähriger, 3.000 € Netto, 1.500 € erwartete gesetzliche
  // Rente (ab Anspruchsalter 63), einheitliche Auszahlrendite 1 % real.
  const base = withDefaults({
    currentAge: 40,
    netIncomeMonthly: 3000,
    expectedStatePension: 1500,
  });

  it("Renteneintritt 67: keine Brücke, Ergebnis kollabiert exakt auf die einphasige Formel", () => {
    const r = calculatePension({ ...base, retirementAge: 67, payoutYears: 23 });
    if (r.kind !== "ok") throw new Error("expected ok");
    expect(r.bridgeYears).toBe(0);
    expect(r.bridgeCapital).toBe(0);
    // Einphasige Referenzrechnung: PV der Lücke über die volle Bezugsdauer
    const rM = annualToMonthlyRate(0.01);
    const expected = presentValueAnnuity(900, rM, 23 * 12);
    expect(r.mainCapital).toBeCloseTo(expected, 6);
    expect(r.capitalNeededBeforeTax).toBeCloseTo(expected, 6);
  });

  it("Renteneintritt 55 (Handrechnung): Brücke voller Bedarf + abgezinste Hauptphase", () => {
    // Planungsalter 90 → payoutYears 35; Brücke 55→63 = 8 Jahre, Hauptphase 27 Jahre.
    const r = calculatePension({ ...base, retirementAge: 55, payoutYears: 35 });
    if (r.kind !== "ok") throw new Error("expected ok");
    expect(r.bridgeYears).toBe(8);

    const rM = annualToMonthlyRate(0.01);
    // Brückenphase: voller Bedarf B = 2400 als Annuität über 96 Monate
    const bridge = presentValueAnnuity(2400, rM, 8 * 12);
    // Hauptphase: Lücke L = 900 über 27 Jahre, Barwert auf Rentenbeginn abgezinst
    const main = presentValueAnnuity(900, rM, 27 * 12) / Math.pow(1 + rM, 8 * 12);
    expect(r.bridgeCapital).toBeCloseTo(bridge, 4);
    expect(r.mainCapital).toBeCloseTo(main, 4);
    expect(r.capitalNeededBeforeTax).toBeCloseTo(bridge + main, 4);
  });

  it("SWR-Variante: Brücken-Annuität zusätzlich zum (nicht abgezinsten) SWR-Kapital", () => {
    const r = calculatePension({
      ...base,
      retirementAge: 55,
      payoutMethod: "safe-withdrawal",
      safeWithdrawalRate: 0.035,
    });
    if (r.kind !== "ok") throw new Error("expected ok");
    const rM = annualToMonthlyRate(0.01);
    const bridge = presentValueAnnuity(2400, rM, 8 * 12);
    const swr = (900 * 12) / 0.035;
    expect(r.bridgeCapital).toBeCloseTo(bridge, 4);
    expect(r.mainCapital).toBeCloseTo(swr, 4);
    expect(r.capitalNeededBeforeTax).toBeCloseTo(bridge + swr, 4);
  });

  it("volle Rentendeckung ab 63, aber Frührente mit 55: kein 'no-gap', Kapitalbedarf = Brücke", () => {
    const r = calculatePension({
      ...base,
      retirementAge: 55,
      payoutYears: 35,
      expectedStatePension: 3000, // deckt den Bedarf (2400) ab Anspruchsalter voll
    });
    if (r.kind !== "ok") throw new Error("expected ok — Brückenbedarf besteht trotz gedeckter Lücke");
    const rM = annualToMonthlyRate(0.01);
    expect(r.mainCapital).toBe(0);
    expect(r.capitalNeededBeforeTax).toBeCloseTo(presentValueAnnuity(2400, rM, 8 * 12), 4);
  });

  it("ohne Brücke bleibt 'no-gap' bei gedeckter Lücke erhalten (Regression)", () => {
    const r = calculatePension({
      ...base,
      retirementAge: 67,
      payoutYears: 23,
      expectedStatePension: 3000,
    });
    expect(r.kind).toBe("no-gap");
  });
});

describe("Wunschrentenalter wirkt korrekt aufs Ergebnis", () => {
  // Fester Bezugsfall: 36-Jähriger, 3.000 € Netto, 1.500 € erwartete
  // gesetzliche Rente (heute), Standard-Annahmen.
  const baseInputs = withDefaults({
    currentAge: 36,
    netIncomeMonthly: 3000,
    expectedStatePension: 1500,
  });

  it("Default-Rentenalter 67 ergibt eine endliche, positive Sparrate", () => {
    const r = calculatePension({ ...baseInputs, retirementAge: 67, payoutYears: 23 });
    expect(r.kind).toBe("ok");
    if (r.kind !== "ok") return;
    expect(r.monthlySavings).toBeGreaterThan(0);
  });

  it("Renteneintritt mit 63 statt 67 (gleiche Rente, payoutYears +4) erhöht Sparrate und Kapitalbedarf", () => {
    const a = calculatePension({ ...baseInputs, retirementAge: 67, payoutYears: 23 });
    const b = calculatePension({ ...baseInputs, retirementAge: 63, payoutYears: 27 });
    if (a.kind !== "ok" || b.kind !== "ok") throw new Error("setup");
    expect(b.capitalNeeded).toBeGreaterThan(a.capitalNeeded);
    expect(b.monthlySavings).toBeGreaterThan(a.monthlySavings);
  });
});
