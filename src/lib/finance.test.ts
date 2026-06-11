import { describe, it, expect } from "vitest";
import {
  compound,
  presentValueAnnuity,
  futureValueAnnuity,
  paymentForFutureValue,
  annualToMonthlyRate,
  monthlyToAnnualRate,
  presentValueGrowingAnnuity,
  weightedFutureValueAnnuity,
  weightedPresentValueAnnuity,
  weightedFutureValueAnnuityFactor,
} from "./finance";

describe("compound", () => {
  it("compounds at given rate", () => {
    expect(compound(100, 0.05, 10)).toBeCloseTo(162.8895, 3);
  });
  it("returns the principal at n=0", () => {
    expect(compound(500, 0.07, 0)).toBe(500);
  });
});

describe("presentValueAnnuity", () => {
  it("textbook 10 years of 100 at 5% ≈ 772.17", () => {
    expect(presentValueAnnuity(100, 0.05, 10)).toBeCloseTo(772.17, 1);
  });
  it("rate=0 reduces to payment * n", () => {
    expect(presentValueAnnuity(100, 0, 10)).toBe(1000);
  });
  it("n=0 yields 0", () => {
    expect(presentValueAnnuity(100, 0.05, 0)).toBe(0);
  });
});

describe("presentValueGrowingAnnuity", () => {
  it("collapses to presentValueAnnuity when growth = 0", () => {
    expect(presentValueGrowingAnnuity(100, 0.05, 0, 10)).toBeCloseTo(
      presentValueAnnuity(100, 0.05, 10),
      10,
    );
  });

  it("matches the brute-force sum of discounted growing payments", () => {
    // PV = Σ payment × (1+g)^(t−1) / (1+r)^t, nachschüssig, erste Zahlung = payment
    const payment = 100;
    const rate = 0.004;
    const growth = -0.0004; // schrumpfende Zahlung (reale Rente bei Anpassung < Inflation)
    const n = 120;
    let expected = 0;
    for (let t = 1; t <= n; t++) {
      expected += (payment * Math.pow(1 + growth, t - 1)) / Math.pow(1 + rate, t);
    }
    expect(presentValueGrowingAnnuity(payment, rate, growth, n)).toBeCloseTo(expected, 6);
  });

  it("handles rate === growth without dividing by zero", () => {
    expect(presentValueGrowingAnnuity(100, 0.02, 0.02, 10)).toBeCloseTo((100 * 10) / 1.02, 8);
  });

  it("n=0 yields 0", () => {
    expect(presentValueGrowingAnnuity(100, 0.05, 0.01, 0)).toBe(0);
  });
});

describe("futureValueAnnuity", () => {
  it("12 monthly 100 at 0% = 1200", () => {
    expect(futureValueAnnuity(100, 0, 12)).toBe(1200);
  });
  it("textbook 10 years of 100 at 5% ≈ 1257.79", () => {
    expect(futureValueAnnuity(100, 0.05, 10)).toBeCloseTo(1257.789, 2);
  });
});

describe("paymentForFutureValue", () => {
  it("inverts futureValueAnnuity", () => {
    const target = 100000;
    const rate = 0.005;
    const n = 240;
    const pmt = paymentForFutureValue(target, rate, n);
    expect(futureValueAnnuity(pmt, rate, n)).toBeCloseTo(target, 4);
  });
  it("handles rate=0", () => {
    expect(paymentForFutureValue(1200, 0, 12)).toBe(100);
  });
});

describe("weightedFutureValueAnnuity", () => {
  it("collapses to plain FV-Annuity when there is one bucket at weight 1", () => {
    const buckets = [{ weight: 1, rate: 0.05 }];
    expect(weightedFutureValueAnnuity(100, buckets, 10)).toBeCloseTo(
      futureValueAnnuity(100, 0.05, 10),
      6,
    );
  });

  it("buckets compound independently — 60/40 ETF vs cash gives more than 3 % blend", () => {
    const buckets = [
      { weight: 0.6, rate: 0.05 },
      { weight: 0.4, rate: 0.0 },
    ];
    const separate = weightedFutureValueAnnuity(100, buckets, 30);
    const blended = futureValueAnnuity(100, 0.6 * 0.05 + 0.4 * 0.0, 30);
    // Per-bucket compounding beats the weighted-average rate because the
    // 5 %-bucket compounds on its full share for the full duration.
    expect(separate).toBeGreaterThan(blended);
  });
});

describe("weightedPresentValueAnnuity", () => {
  it("collapses to plain PV-Annuity for a single-bucket allocation", () => {
    const buckets = [{ weight: 1, rate: 0.03 }];
    expect(weightedPresentValueAnnuity(100, buckets, 30)).toBeCloseTo(
      presentValueAnnuity(100, 0.03, 30),
      6,
    );
  });

  it("is the linear combination of per-bucket PV-Annuities", () => {
    const buckets = [
      { weight: 0.7, rate: 0.04 },
      { weight: 0.3, rate: 0.01 },
    ];
    const expected =
      0.7 * presentValueAnnuity(100, 0.04, 25) + 0.3 * presentValueAnnuity(100, 0.01, 25);
    expect(weightedPresentValueAnnuity(100, buckets, 25)).toBeCloseTo(expected, 6);
  });
});

describe("weightedFutureValueAnnuityFactor", () => {
  it("inverts to give the required monthly payment to hit a target FV", () => {
    const buckets = [
      { weight: 0.7, rate: 0.004074 }, // ~5 % p.a. monthly
      { weight: 0.3, rate: 0 },        // cash
    ];
    const months = 360;
    const targetFV = 250_000;
    const factor = weightedFutureValueAnnuityFactor(buckets, months);
    const monthly = targetFV / factor;
    expect(weightedFutureValueAnnuity(monthly, buckets, months)).toBeCloseTo(targetFV, 2);
  });
});

describe("rate conversion", () => {
  it("round-trips annual ↔ monthly", () => {
    const annual = 0.06;
    const monthly = annualToMonthlyRate(annual);
    expect(monthlyToAnnualRate(monthly)).toBeCloseTo(annual, 12);
  });
  it("monthly rate of 6% annual is ~0.4868%", () => {
    expect(annualToMonthlyRate(0.06)).toBeCloseTo(0.004868, 5);
  });
});
