import { describe, it, expect } from "vitest";
import {
  grossPensionToNet,
  midGrossFromRenteninfo,
  realNetPensionFromGross,
} from "./defaults";

describe("grossPensionToNet", () => {
  it("applies the 20 % flat deduction (Finanztip rule of thumb)", () => {
    expect(grossPensionToNet(1000)).toBe(800);
  });
});

describe("midGrossFromRenteninfo", () => {
  it("averages the two projections (≈ 1.5 % yearly raise)", () => {
    expect(midGrossFromRenteninfo(2800, 4000)).toBe(3400);
  });
});

describe("realNetPensionFromGross — Finanztip Daniela cross-check", () => {
  // From the Finanztip video transcript, Daniela:
  //   Renteninfo: 2.800 € (1 % raise) and 4.000 € (2 % raise)
  //   → mid 3.400 € gross
  //   → net nominal 2.720 €
  //   → discounted 35 years at 2 % inflation ≈ 1.360 € in today's purchasing power
  it("reproduces 2.720 € net nominal from 3.400 € gross mid", () => {
    const r = realNetPensionFromGross(3400, 0.02, 35);
    expect(r.netNominal).toBe(2720);
  });

  it("reproduces ~1.360 € real (today's purchasing power) within ±10 €", () => {
    const r = realNetPensionFromGross(3400, 0.02, 35);
    expect(r.netReal).toBeGreaterThan(1350);
    expect(r.netReal).toBeLessThan(1370);
  });

  it("returns netReal === netNominal when there are no remaining years", () => {
    const r = realNetPensionFromGross(2000, 0.02, 0);
    expect(r.netReal).toBe(r.netNominal);
  });

  it("higher inflation discounts more aggressively", () => {
    const low = realNetPensionFromGross(3400, 0.01, 35);
    const high = realNetPensionFromGross(3400, 0.04, 35);
    expect(high.netReal).toBeLessThan(low.netReal);
  });
});
