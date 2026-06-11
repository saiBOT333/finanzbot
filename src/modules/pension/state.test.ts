import { describe, it, expect } from "vitest";
import { migrate, PENSION_MODULE_DEFAULTS } from "./state";
import { PENSION_GROSS_TO_NET_DEDUCTION, PENSION_RAISE_DEFAULT } from "./constants";

describe("migrate — Renteninfo-Entkopplung", () => {
  it("ein früher übernommener Snapshot bleibt als manueller Override erhalten", () => {
    const migrated = migrate({ expectedStatePension: 1339 });
    expect(migrated.expectedStatePension).toBe(1339);
  });

  it("pensionInfo startet leer mit Default-Anpassung und -Abzug", () => {
    const migrated = migrate({});
    expect(migrated.pensionInfo).toEqual({
      grossWithoutAdjustment: null,
      raise: PENSION_RAISE_DEFAULT,
      deduction: PENSION_GROSS_TO_NET_DEDUCTION,
    });
  });

  it("unvollständig persistiertes pensionInfo wird mit Defaults aufgefüllt", () => {
    const migrated = migrate({
      pensionInfo: { grossWithoutAdjustment: 1988 } as never,
    });
    expect(migrated.pensionInfo).toEqual({
      grossWithoutAdjustment: 1988,
      raise: PENSION_RAISE_DEFAULT,
      deduction: PENSION_GROSS_TO_NET_DEDUCTION,
    });
  });

  it("Module-Defaults enthalten das leere pensionInfo", () => {
    expect(PENSION_MODULE_DEFAULTS.pensionInfo.grossWithoutAdjustment).toBeNull();
  });
});

describe("migrate — pensionInfoChoice", () => {
  it("startet ohne Entscheidung (null)", () => {
    const migrated = migrate({});
    expect(migrated.pensionInfoChoice).toBeNull();
  });

  it("leitet 'letter' ab, wenn bereits eine Brutto-Rente eingetragen ist", () => {
    const migrated = migrate({
      pensionInfo: { grossWithoutAdjustment: 1988 } as never,
    });
    expect(migrated.pensionInfoChoice).toBe("letter");
  });

  it("behält eine persistierte Entscheidung bei", () => {
    const migrated = migrate({ pensionInfoChoice: "estimate" });
    expect(migrated.pensionInfoChoice).toBe("estimate");
  });

  it("Module-Defaults starten mit null", () => {
    expect(PENSION_MODULE_DEFAULTS.pensionInfoChoice).toBeNull();
  });
});
