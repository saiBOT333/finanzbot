import { describe, it, expect } from "vitest";
import { computeRebalance } from "./rebalance";
import type { PortfolioBreakdown } from "./classify";

const B = (overrides: Partial<PortfolioBreakdown>): PortfolioBreakdown => ({
  riskyEuro: 0,
  safeEuro: 0,
  excludedEuro: 0,
  totalEuro: 0,
  consideredEuro: 0,
  currentEquityPercent: 0,
  ...overrides,
});

describe("computeRebalance", () => {
  it("erkennt zu viel Aktien und schlägt shift-to-safe vor", () => {
    const breakdown = B({
      riskyEuro: 7500,
      safeEuro: 2500,
      consideredEuro: 10000,
      totalEuro: 10000,
      currentEquityPercent: 75,
    });
    const r = computeRebalance(breakdown, 60);
    expect(r.currentEquityPercent).toBe(75);
    expect(r.targetEquityPercent).toBe(60);
    expect(r.deltaPercent).toBe(15);
    expect(r.deltaAmount).toBe(1500);
    expect(r.direction).toBe("shift-to-safe");
  });

  it("erkennt zu wenig Aktien und schlägt shift-to-equity vor", () => {
    const breakdown = B({
      riskyEuro: 3000,
      safeEuro: 7000,
      consideredEuro: 10000,
      totalEuro: 10000,
      currentEquityPercent: 30,
    });
    const r = computeRebalance(breakdown, 60);
    expect(r.deltaPercent).toBe(-30);
    expect(r.deltaAmount).toBe(3000);
    expect(r.direction).toBe("shift-to-equity");
  });

  it("gilt unter 1 Prozentpunkt Abweichung als balanced", () => {
    const breakdown = B({
      riskyEuro: 6050,
      safeEuro: 3950,
      consideredEuro: 10000,
      totalEuro: 10000,
      currentEquityPercent: 60.5,
    });
    const r = computeRebalance(breakdown, 60);
    expect(r.direction).toBe("balanced");
  });

  it("liefert balanced + Nullwerte, wenn consideredEuro 0 ist", () => {
    const breakdown = B({ excludedEuro: 200000, totalEuro: 200000 });
    const r = computeRebalance(breakdown, 60);
    expect(r.deltaAmount).toBe(0);
    expect(r.deltaPercent).toBe(0);
    expect(r.direction).toBe("balanced");
  });

  it("rundet deltaAmount auf ganze Euro", () => {
    const breakdown = B({
      riskyEuro: 7333.33,
      safeEuro: 2666.67,
      consideredEuro: 10000,
      totalEuro: 10000,
      currentEquityPercent: 73.3333,
    });
    const r = computeRebalance(breakdown, 60);
    expect(Number.isInteger(r.deltaAmount)).toBe(true);
  });
});
