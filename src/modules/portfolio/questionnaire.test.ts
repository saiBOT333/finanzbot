import { describe, it, expect } from "vitest";
import { recommendEquityPercent, QUESTIONS } from "./questionnaire";
import type { FragebogenAntworten } from "./types";

const A = (overrides: Partial<FragebogenAntworten> = {}): FragebogenAntworten => ({
  horizont: 0,
  schwankung: 0,
  notgroschen: 0,
  erfahrung: 0,
  einkommen: 0,
  ...overrides,
});

describe("recommendEquityPercent", () => {
  it("gibt 20 % bei Score 0", () => {
    expect(recommendEquityPercent(A())).toBe(20);
  });

  it("gibt 20 % an der oberen Grenze von Bucket 1 (Score 3)", () => {
    expect(recommendEquityPercent(A({ horizont: 3 }))).toBe(20);
  });

  it("springt bei Score 4 auf 50 %", () => {
    expect(recommendEquityPercent(A({ horizont: 3, schwankung: 1 }))).toBe(50);
  });

  it("gibt 70 % bei Score 7", () => {
    expect(recommendEquityPercent(A({ horizont: 3, schwankung: 3, notgroschen: 1 }))).toBe(70);
  });

  it("gibt 90 % bei maximalem Score 12", () => {
    expect(
      recommendEquityPercent(A({
        horizont: 3, schwankung: 3, notgroschen: 2, erfahrung: 2, einkommen: 2,
      })),
    ).toBe(90);
  });
});

describe("QUESTIONS", () => {
  it("enthält genau 5 Fragen", () => {
    expect(QUESTIONS).toHaveLength(5);
  });

  it("jede Frage hat mindestens 2 Antwortoptionen", () => {
    for (const q of QUESTIONS) {
      expect(q.options.length).toBeGreaterThanOrEqual(2);
    }
  });
});
