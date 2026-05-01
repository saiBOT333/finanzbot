import { describe, it, expect } from "vitest";
import {
  compound,
  presentValueAnnuity,
  futureValueAnnuity,
  paymentForFutureValue,
  annualToMonthlyRate,
  monthlyToAnnualRate,
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
