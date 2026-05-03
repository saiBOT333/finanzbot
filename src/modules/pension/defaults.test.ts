import { describe, it, expect } from "vitest";
import { applyPensionDeduction, projectedNetPensionToday } from "./defaults";

describe("applyPensionDeduction", () => {
  it("applies the 20 % flat deduction (Finanztip rule of thumb)", () => {
    expect(applyPensionDeduction(1000, 0.2)).toBe(800);
  });

  it("supports a custom deduction (e. g. 12 % for low pensions, only social contributions)", () => {
    expect(applyPensionDeduction(1000, 0.12)).toBe(880);
  });

  it("supports a high deduction (e. g. 30 % for high pensions with side income)", () => {
    expect(applyPensionDeduction(1000, 0.3)).toBe(700);
  });
});

describe("projectedNetPensionToday — Finanztip Daniela cross-check", () => {
  // From the Finanztip video transcript, Daniela:
  //   Renteninfo "ohne Anpassung" ≈ 1.988 € (back-derived from 2.800/4.000 split)
  //   1,5 % raise · 35 years · 2 % inflation · 20 % deduction
  //   → grossNominal ≈ 3.347 € · netNominal ≈ 2.677 € · netReal ≈ 1.339 €
  // Saidi's approximation "1.360 €" is within ~ 1,5 % of the exact result.
  it("reproduces the four-stage pipeline for Daniela", () => {
    const r = projectedNetPensionToday(1988, 0.015, 0.2, 0.02, 35);
    expect(r.grossNominal).toBeGreaterThan(3300);
    expect(r.grossNominal).toBeLessThan(3400);
    expect(r.netNominal).toBeGreaterThan(2640);
    expect(r.netNominal).toBeLessThan(2720);
    expect(r.netReal).toBeGreaterThan(1320);
    expect(r.netReal).toBeLessThan(1360);
  });

  it("returns netReal === netNominal when there are no remaining years", () => {
    const r = projectedNetPensionToday(2000, 0.02, 0.2, 0.02, 0);
    expect(r.netReal).toBe(r.netNominal);
    expect(r.grossNominal).toBe(2000);
  });

  it("higher raise leads to a larger nominal but inflation cancels most of it", () => {
    const slow = projectedNetPensionToday(1988, 0.005, 0.2, 0.02, 35);
    const fast = projectedNetPensionToday(1988, 0.025, 0.2, 0.02, 35);
    expect(fast.grossNominal).toBeGreaterThan(slow.grossNominal);
    // Higher raise still wins in real terms (above inflation), but only mildly.
    expect(fast.netReal).toBeGreaterThan(slow.netReal);
    expect(fast.netReal / slow.netReal).toBeLessThan(2);
  });

  it("higher deduction lowers both nominal and real net", () => {
    const low = projectedNetPensionToday(1988, 0.015, 0.12, 0.02, 35);
    const high = projectedNetPensionToday(1988, 0.015, 0.3, 0.02, 35);
    expect(high.netReal).toBeLessThan(low.netReal);
    expect(high.netNominal).toBeLessThan(low.netNominal);
    expect(high.grossNominal).toBe(low.grossNominal); // gross is identical
  });
});
