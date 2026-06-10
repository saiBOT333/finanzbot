import { describe, it, expect } from "vitest";
import {
  adjustGrossForEarlyRetirement,
  applyPensionDeduction,
  deriveExpectedStatePension,
  derivePayoutYears,
  projectedNetPensionToday,
  regelaltersgrenze,
} from "./defaults";
import {
  PENSION_GROSS_TO_NET_DEDUCTION,
  PENSION_RAISE_DEFAULT,
  RETIREMENT_AGE_DEFAULT,
  STATE_PENSION_FACTOR,
} from "./constants";

describe("deriveExpectedStatePension — Präzedenz-Matrix", () => {
  const CURRENT_YEAR = 2026;
  const baseProfile = { age: 35, retirementAge: 67, netIncomeMonthly: 3000 };
  const pensionInfo = {
    grossWithoutAdjustment: 1988,
    raise: PENSION_RAISE_DEFAULT,
    deduction: PENSION_GROSS_TO_NET_DEDUCTION,
  };
  const baseModule = {
    expectedStatePension: null,
    pensionInfo,
    inflation: 0.02,
    contributionStartAge: 20,
  };

  it("manueller Override gewinnt über Renteninfo und Faustformel", () => {
    const r = deriveExpectedStatePension(
      baseProfile,
      { ...baseModule, expectedStatePension: 1500 },
      CURRENT_YEAR,
    );
    expect(r.source).toBe("override");
    expect(r.monthly).toBe(1500);
  });

  it("Renteninfo-Ableitung greift, wenn kein Override gesetzt ist", () => {
    const r = deriveExpectedStatePension(baseProfile, baseModule, CURRENT_YEAR);
    expect(r.source).toBe("renteninfo");
    // Identisch zur direkten Pipeline (Eintritt zur Regelaltersgrenze → keine Korrektur).
    const direct = projectedNetPensionToday(1988, PENSION_RAISE_DEFAULT, PENSION_GROSS_TO_NET_DEDUCTION, 0.02, 32);
    expect(r.monthly).toBe(Math.round(direct.netReal));
    expect(r.projection).toBeDefined();
  });

  it("Faustformel (48 % vom Netto) als letzter Fallback", () => {
    const r = deriveExpectedStatePension(
      baseProfile,
      { ...baseModule, pensionInfo: { ...pensionInfo, grossWithoutAdjustment: null } },
      CURRENT_YEAR,
    );
    expect(r.source).toBe("fallback");
    expect(r.monthly).toBe(3000 * STATE_PENSION_FACTOR);
  });

  it("Regression: Renteneintritt ändern → abgeleitete Rente ändert sich mit", () => {
    // Genau das war der Snapshot-Bug: die übernommene Zahl blieb eingefroren.
    const at67 = deriveExpectedStatePension(baseProfile, baseModule, CURRENT_YEAR);
    const at63 = deriveExpectedStatePension(
      { ...baseProfile, retirementAge: 63 },
      baseModule,
      CURRENT_YEAR,
    );
    expect(at63.monthly).not.toBe(at67.monthly);
    // Früherer Eintritt → Abschlag + weniger Beitragsjahre → niedrigere Rente.
    expect(at63.monthly).toBeLessThan(at67.monthly);
  });

  it("Regression: Inflation ändern → abgeleitete Rente ändert sich mit", () => {
    const low = deriveExpectedStatePension(baseProfile, { ...baseModule, inflation: 0.01 }, CURRENT_YEAR);
    const high = deriveExpectedStatePension(baseProfile, { ...baseModule, inflation: 0.03 }, CURRENT_YEAR);
    expect(high.monthly).toBeLessThan(low.monthly);
  });

  it("fehlendes Rentenalter fällt auf den Default (67) zurück", () => {
    const r = deriveExpectedStatePension(
      { age: 35, netIncomeMonthly: 3000 },
      baseModule,
      CURRENT_YEAR,
    );
    expect(r.source).toBe("renteninfo");
    const direct = projectedNetPensionToday(1988, PENSION_RAISE_DEFAULT, PENSION_GROSS_TO_NET_DEDUCTION, 0.02, RETIREMENT_AGE_DEFAULT - 35);
    expect(r.monthly).toBe(Math.round(direct.netReal));
  });
});

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

describe("derivePayoutYears", () => {
  it("zieht das Rentenalter vom Planungsalter ab", () => {
    expect(derivePayoutYears(90, 67)).toBe(23);
  });

  it("fehlendes Rentenalter fällt auf RETIREMENT_AGE_DEFAULT zurück (nicht auf 0)", () => {
    // Regression: ein fehlendes profile.retirementAge darf NICHT planningAge − 0
    // ergeben — das blähte die Auszahldauer auf ~90 Jahre und alle Folgesummen
    // um Faktor ~2,5 auf.
    expect(derivePayoutYears(90, undefined)).toBe(90 - RETIREMENT_AGE_DEFAULT);
  });

  it("nie negativ, wenn das Rentenalter über dem Planungsalter liegt", () => {
    expect(derivePayoutYears(65, 67)).toBe(0);
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

describe("regelaltersgrenze", () => {
  it("Jahrgang 1946 und früher: 65", () => {
    expect(regelaltersgrenze(1946)).toBe(65);
    expect(regelaltersgrenze(1900)).toBe(65);
  });

  it("Jahrgänge 1947–1958: + 1 Monat pro Jahr", () => {
    expect(regelaltersgrenze(1947)).toBeCloseTo(65 + 1 / 12, 6);
    expect(regelaltersgrenze(1958)).toBeCloseTo(66, 6);
  });

  it("Jahrgänge 1959–1963: + 2 Monate pro Jahr", () => {
    expect(regelaltersgrenze(1959)).toBeCloseTo(66 + 2 / 12, 6);
    expect(regelaltersgrenze(1963)).toBeCloseTo(66 + 10 / 12, 6);
  });

  it("Jahrgang 1964 und später: 67", () => {
    expect(regelaltersgrenze(1964)).toBe(67);
    expect(regelaltersgrenze(2000)).toBe(67);
  });
});

describe("adjustGrossForEarlyRetirement", () => {
  it("Eintritt zur Regelaltersgrenze: keine Korrektur", () => {
    const r = adjustGrossForEarlyRetirement(2000, 67, 67, 20);
    expect(r.adjustedGross).toBe(2000);
    expect(r.abschlagPct).toBe(0);
    expect(r.beitragsFaktor).toBe(1);
  });

  it("Eintritt nach Regelaltersgrenze: keine Korrektur (Zuschläge sind Out-of-Scope)", () => {
    const r = adjustGrossForEarlyRetirement(2000, 70, 67, 20);
    expect(r.adjustedGross).toBe(2000);
    expect(r.abschlagPct).toBe(0);
    expect(r.beitragsFaktor).toBe(1);
  });

  it("4 Jahre vorzeitig (63 vs 67), Beitragsbeginn 20: Abschlag 14,4 %, Beitragsfaktor 43/47", () => {
    const r = adjustGrossForEarlyRetirement(2000, 63, 67, 20);
    expect(r.abschlagPct).toBeCloseTo(0.144, 6);
    expect(r.beitragsFaktor).toBeCloseTo(43 / 47, 6);
    expect(r.adjustedGross).toBeCloseTo(2000 * (1 - 0.144) * (43 / 47), 4);
  });

  it("Abschlag wird bei mehr als 4 Jahren vorzeitig auf 14,4 % gedeckelt", () => {
    const r = adjustGrossForEarlyRetirement(2000, 60, 67, 20);
    expect(r.abschlagPct).toBe(0.144);
  });

  it("Abschlag basiert auf dem Anspruchsalter 63, nicht auf dem Renteneintritt (Regelalter 66)", () => {
    // Eintritt 60, Regelalter 66: Rente fließt frühestens ab 63 →
    // 36 Monate vorzeitig × 0,3 % = 10,8 % (nicht 21,6 % → Cap).
    const r = adjustGrossForEarlyRetirement(2000, 60, 66, 20);
    expect(r.abschlagPct).toBeCloseTo(0.108, 6);
  });

  it("Renteneintritt 55: Abschlag aus Anspruchsalter 63, Beitragsfaktor aus tatsächlichem Arbeitsende 55", () => {
    const r = adjustGrossForEarlyRetirement(2000, 55, 67, 20);
    // Anspruch ab 63 → 48 Monate vorzeitig → 14,4 %
    expect(r.abschlagPct).toBeCloseTo(0.144, 6);
    // Beiträge enden mit dem Arbeitsende (55), nicht mit dem Anspruchsalter
    expect(r.beitragsFaktor).toBeCloseTo(35 / 47, 6);
    expect(r.adjustedGross).toBeCloseTo(2000 * (1 - 0.144) * (35 / 47), 4);
  });

  it("Späterer Beitragsbeginn senkt den Beitragsfaktor zusätzlich", () => {
    const r = adjustGrossForEarlyRetirement(2000, 63, 67, 27);
    expect(r.beitragsFaktor).toBeCloseTo(36 / 40, 6); // 63-27=36 ist tatsächlich, 67-27=40 geplant
  });

  it("Retirement <= contributionStart führt zu Beitragsfaktor 0 (Edge Case)", () => {
    const r = adjustGrossForEarlyRetirement(2000, 19, 67, 20);
    expect(r.beitragsFaktor).toBe(0);
    expect(r.adjustedGross).toBe(0);
  });
});

describe("projectedNetPensionToday mit Korrektur", () => {
  it("Eintritt zur Regelaltersgrenze: Korrektur ist Identität, Pipeline-Felder vorhanden", () => {
    const r = projectedNetPensionToday(2000, 0.015, 0.2, 0.02, 30, {
      retirementAge: 67,
      regelalter: 67,
      contributionStartAge: 20,
    });
    expect(r.grossBeforeAdjustment).toBe(2000);
    expect(r.abschlagPct).toBe(0);
    expect(r.beitragsFaktor).toBe(1);
    expect(r.grossAdjusted).toBe(2000);
    expect(r.grossNominal).toBeCloseTo(2000 * Math.pow(1.015, 30), 4);
    expect(r.netNominal).toBeCloseTo(r.grossNominal * 0.8, 4);
    expect(r.netReal).toBeCloseTo(r.netNominal / Math.pow(1.02, 30), 4);
  });

  it("4 Jahre vorzeitig: Brutto wird vor der Anpassung gekürzt", () => {
    const r = projectedNetPensionToday(2000, 0.015, 0.2, 0.02, 26, {
      retirementAge: 63,
      regelalter: 67,
      contributionStartAge: 20,
    });
    const expectedAdjusted = 2000 * (1 - 0.144) * (43 / 47);
    expect(r.grossAdjusted).toBeCloseTo(expectedAdjusted, 4);
    expect(r.grossNominal).toBeCloseTo(expectedAdjusted * Math.pow(1.015, 26), 4);
    expect(r.netNominal).toBeCloseTo(r.grossNominal * 0.8, 4);
    expect(r.netReal).toBeCloseTo(r.netNominal / Math.pow(1.02, 26), 4);
  });

  it("Fehlende Korrektur-Parameter: Aufruf wie früher (Backwards-Kompatibilität)", () => {
    const r = projectedNetPensionToday(2000, 0.015, 0.2, 0.02, 30);
    expect(r.grossAdjusted).toBe(2000);
    expect(r.abschlagPct).toBe(0);
    expect(r.beitragsFaktor).toBe(1);
    expect(r.grossNominal).toBeCloseTo(2000 * Math.pow(1.015, 30), 4);
    expect(r.netNominal).toBeCloseTo(r.grossNominal * 0.8, 4);
    expect(r.netReal).toBeCloseTo(r.netNominal / Math.pow(1.02, 30), 4);
  });
});
