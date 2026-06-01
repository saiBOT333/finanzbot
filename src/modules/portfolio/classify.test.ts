import { describe, it, expect } from "vitest";
import { assetSplit, computeBreakdown } from "./classify";
import type { Asset } from "../../lib/assets";

const A = (overrides: Partial<Asset>): Asset => ({
  id: "a",
  name: "Test",
  type: "cash",
  amount: 0,
  ...overrides,
});

describe("assetSplit", () => {
  it("klassifiziert cash als 100 % safe", () => {
    expect(assetSplit(A({ type: "cash" }))).toEqual({ risky: 0, safe: 1, excluded: 0 });
  });

  it("klassifiziert etf-world als 100 % risky", () => {
    expect(assetSplit(A({ type: "etf-world" }))).toEqual({ risky: 1, safe: 0, excluded: 0 });
  });

  it("splittet etf-mixed in 60/40", () => {
    expect(assetSplit(A({ type: "etf-mixed" }))).toEqual({ risky: 0.6, safe: 0.4, excluded: 0 });
  });

  it("klassifiziert real-estate als excluded", () => {
    expect(assetSplit(A({ type: "real-estate" }))).toEqual({ risky: 0, safe: 0, excluded: 1 });
  });

  it("klassifiziert company-pension default als excluded", () => {
    expect(assetSplit(A({ type: "company-pension" }))).toEqual({ risky: 0, safe: 0, excluded: 1 });
  });

  it("respektiert riskClassOverride='risky' für company-pension", () => {
    expect(
      assetSplit(A({ type: "company-pension", riskClassOverride: "risky" })),
    ).toEqual({ risky: 1, safe: 0, excluded: 0 });
  });

  it("respektiert riskClassOverride='safe' für other", () => {
    expect(
      assetSplit(A({ type: "other", riskClassOverride: "safe" })),
    ).toEqual({ risky: 0, safe: 1, excluded: 0 });
  });

  it("respektiert riskClassOverride='excluded' für etf-world", () => {
    expect(
      assetSplit(A({ type: "etf-world", riskClassOverride: "excluded" })),
    ).toEqual({ risky: 0, safe: 0, excluded: 1 });
  });
});

describe("computeBreakdown", () => {
  it("gibt für leeres Portfolio Nullen zurück", () => {
    const b = computeBreakdown([]);
    expect(b).toEqual({
      riskyEuro: 0,
      safeEuro: 0,
      excludedEuro: 0,
      totalEuro: 0,
      consideredEuro: 0,
      currentEquityPercent: 0,
    });
  });

  it("rechnet 50 % etf-world + 50 % cash zu 50 % Aktienquote", () => {
    const b = computeBreakdown([
      A({ id: "1", type: "etf-world", amount: 5000 }),
      A({ id: "2", type: "cash", amount: 5000 }),
    ]);
    expect(b.riskyEuro).toBe(5000);
    expect(b.safeEuro).toBe(5000);
    expect(b.excludedEuro).toBe(0);
    expect(b.consideredEuro).toBe(10000);
    expect(b.currentEquityPercent).toBe(50);
  });

  it("splittet etf-mixed gemäß 60/40", () => {
    const b = computeBreakdown([A({ id: "m", type: "etf-mixed", amount: 10000 })]);
    expect(b.riskyEuro).toBe(6000);
    expect(b.safeEuro).toBe(4000);
    expect(b.currentEquityPercent).toBe(60);
  });

  it("zählt excluded-Assets separat und nicht in der Quote", () => {
    const b = computeBreakdown([
      A({ id: "1", type: "etf-world", amount: 6000 }),
      A({ id: "2", type: "cash", amount: 4000 }),
      A({ id: "3", type: "real-estate", amount: 200000 }),
    ]);
    expect(b.consideredEuro).toBe(10000);
    expect(b.excludedEuro).toBe(200000);
    expect(b.totalEuro).toBe(210000);
    expect(b.currentEquityPercent).toBe(60);
  });

  it("gibt 0 % zurück, wenn nur excluded-Assets vorhanden sind", () => {
    const b = computeBreakdown([
      A({ id: "1", type: "real-estate", amount: 100000 }),
      A({ id: "2", type: "other", amount: 5000 }),
    ]);
    expect(b.consideredEuro).toBe(0);
    expect(b.excludedEuro).toBe(105000);
    expect(b.currentEquityPercent).toBe(0);
  });
});
