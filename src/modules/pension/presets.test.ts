import { describe, it, expect } from "vitest";
import { PRESETS, detectActivePreset, STANDARD_PRESET } from "./presets";
import { calculatePension } from "./calculations";
import { withDefaults } from "./defaults";
import { PENSION_MODULE_DEFAULTS, type PensionModuleState } from "./state";

const fixtureInputs = (state: PensionModuleState) =>
  withDefaults({
    currentAge: 35,
    netIncomeMonthly: 3000,
    replacementRate: state.replacementRate,
    expectedStatePension: 3000 * 0.48,
    inflation: state.inflation,
    realReturn: state.realReturn,
    payoutRealReturn: state.payoutRealReturn,
    payoutMethod: state.payoutMethod,
    payoutYears: state.payoutYears,
    safeWithdrawalRate: state.safeWithdrawalRate,
    taxBufferPct: state.taxBufferPct,
  });

describe("PRESETS", () => {
  it("contains exactly the three expected presets in stable order", () => {
    expect(PRESETS.map((p) => p.id)).toEqual(["conservative", "standard", "investor"]);
  });

  it("each preset names its source", () => {
    for (const p of PRESETS) {
      expect(p.source.length).toBeGreaterThan(0);
      expect(p.label.length).toBeGreaterThan(0);
      expect(p.description.length).toBeGreaterThan(10);
    }
  });

  it("the 'standard' preset matches the module default state (apart from expectedStatePension)", () => {
    const def = { ...PENSION_MODULE_DEFAULTS };
    delete (def as Partial<PensionModuleState>).expectedStatePension;
    expect(STANDARD_PRESET.state).toEqual(def);
  });
});

describe("PRESETS — savings rate per profile (35 J / 3.000 € fixture)", () => {
  const presetById = Object.fromEntries(PRESETS.map((p) => [p.id, p]));

  const monthlySavingsFor = (id: "conservative" | "standard" | "investor") => {
    const r = calculatePension(fixtureInputs({ ...presetById[id]!.state, expectedStatePension: 1440 }));
    if (r.kind !== "ok") throw new Error(`expected ok for ${id}`);
    return r.monthlySavings;
  };

  it("conservative produces the highest savings rate (Finanztip-style, ~ 460 €)", () => {
    const s = monthlySavingsFor("conservative");
    expect(s).toBeGreaterThan(420);
    expect(s).toBeLessThan(520);
  });

  it("investor sits in between (Finanzfluss-style, ~ 380–410 €)", () => {
    const s = monthlySavingsFor("investor");
    expect(s).toBeGreaterThan(360);
    expect(s).toBeLessThan(450);
  });

  it("standard is the most optimistic of the three (~ 250–290 €)", () => {
    const s = monthlySavingsFor("standard");
    expect(s).toBeGreaterThan(240);
    expect(s).toBeLessThan(310);
  });

  it("conservative > investor > standard for monthly savings", () => {
    const c = monthlySavingsFor("conservative");
    const i = monthlySavingsFor("investor");
    const s = monthlySavingsFor("standard");
    expect(c).toBeGreaterThan(i);
    expect(i).toBeGreaterThan(s);
  });
});

describe("detectActivePreset", () => {
  it("returns the standard id for fresh defaults", () => {
    expect(detectActivePreset(PENSION_MODULE_DEFAULTS)).toBe("standard");
  });

  it("ignores expectedStatePension when matching", () => {
    expect(detectActivePreset({ ...PENSION_MODULE_DEFAULTS, expectedStatePension: 1234 })).toBe(
      "standard",
    );
  });

  it("returns null when any other field is tweaked", () => {
    expect(detectActivePreset({ ...PENSION_MODULE_DEFAULTS, payoutYears: 25 })).toBeNull();
  });

  it("recognises each preset state", () => {
    for (const p of PRESETS) {
      const state: PensionModuleState = { ...p.state, expectedStatePension: null };
      expect(detectActivePreset(state)).toBe(p.id);
    }
  });
});
