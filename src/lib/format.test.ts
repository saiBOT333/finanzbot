import { describe, it, expect } from "vitest";
import { formatEUR, formatPercent, formatNumber, parseLocalNumber } from "./format";

describe("formatEUR", () => {
  it("formats integer Euro amounts in de-DE", () => {
    expect(formatEUR(1234)).toBe("1.234 €");
  });

  it("supports two decimals when precise=true", () => {
    expect(formatEUR(12.5, true)).toBe("12,50 €");
  });

  it("returns dash for non-finite", () => {
    expect(formatEUR(Number.NaN)).toBe("—");
    expect(formatEUR(Number.POSITIVE_INFINITY)).toBe("—");
  });
});

describe("formatPercent", () => {
  it("formats fractions as percent", () => {
    expect(formatPercent(0.05)).toBe("5 %");
    expect(formatPercent(0.123)).toBe("12,3 %");
  });
});

describe("formatNumber", () => {
  it("formats with German thousand separators", () => {
    expect(formatNumber(12345)).toBe("12.345");
  });
});

describe("parseLocalNumber", () => {
  it("parses simple integer", () => {
    expect(parseLocalNumber("1234")).toBe(1234);
  });

  it("parses German decimal comma", () => {
    expect(parseLocalNumber("12,5")).toBe(12.5);
  });

  it("parses German thousand separators", () => {
    expect(parseLocalNumber("1.234,50")).toBe(1234.5);
  });

  it("strips currency symbol", () => {
    expect(parseLocalNumber("1.234,50 €")).toBe(1234.5);
  });

  it("returns null for empty/invalid input", () => {
    expect(parseLocalNumber("")).toBeNull();
    expect(parseLocalNumber("abc")).toBeNull();
  });
});
