import { describe, it, expect } from "vitest";
import { PRESETS, detectActivePreset, DEFAULT_PRESET } from "./presets";
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
  it("contains exactly the two expected presets in stable order", () => {
    expect(PRESETS.map((p) => p.id)).toEqual(["conservative", "investor"]);
  });

  it("each preset names its source", () => {
    for (const p of PRESETS) {
      expect(p.source.length).toBeGreaterThan(0);
      expect(p.label.length).toBeGreaterThan(0);
      expect(p.description.length).toBeGreaterThan(10);
    }
  });

  it("the conservative preset is the module default", () => {
    expect(DEFAULT_PRESET.id).toBe("conservative");
    const def = { ...PENSION_MODULE_DEFAULTS };
    delete (def as Partial<PensionModuleState>).expectedStatePension;
    expect(DEFAULT_PRESET.state).toEqual(def);
  });
});

describe("PRESETS — savings rate per profile (35 J / 3.000 € fixture)", () => {
  const presetById = Object.fromEntries(PRESETS.map((p) => [p.id, p]));

  const monthlySavingsFor = (id: "conservative" | "investor") => {
    const r = calculatePension(fixtureInputs({ ...presetById[id]!.state, expectedStatePension: 1440 }));
    if (r.kind !== "ok") throw new Error(`expected ok for ${id}`);
    return r.monthlySavings;
  };

  it("conservative produces a Finanztip-style savings rate (~ 460 €)", () => {
    const s = monthlySavingsFor("conservative");
    expect(s).toBeGreaterThan(420);
    expect(s).toBeLessThan(520);
  });

  it("investor produces a Finanzfluss-style savings rate (~ 380–410 €)", () => {
    const s = monthlySavingsFor("investor");
    expect(s).toBeGreaterThan(360);
    expect(s).toBeLessThan(450);
  });

  it("conservative requires more savings than investor (more cautious)", () => {
    expect(monthlySavingsFor("conservative")).toBeGreaterThan(monthlySavingsFor("investor"));
  });
});

describe("detectActivePreset", () => {
  it("returns the conservative id for fresh defaults", () => {
    expect(detectActivePreset(PENSION_MODULE_DEFAULTS)).toBe("conservative");
  });

  it("ignores expectedStatePension when matching", () => {
    expect(detectActivePreset({ ...PENSION_MODULE_DEFAULTS, expectedStatePension: 1234 })).toBe(
      "conservative",
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
