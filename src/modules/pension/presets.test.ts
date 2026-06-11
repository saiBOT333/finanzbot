import { describe, it, expect } from "vitest";
import { DEFAULT_PENSION_STATE } from "./presets";
import { TAX_BUFFER_DEFAULT } from "./constants";
import { calculatePension } from "./calculations";
import { allocationToBuckets, withDefaults } from "./defaults";
import { PENSION_MODULE_DEFAULTS, type PensionModuleState } from "./state";

const fixtureInputs = (state: PensionModuleState) =>
  withDefaults({
    currentAge: 35,
    netIncomeMonthly: 3000,
    replacementRate: state.replacementRate,
    expectedStatePension: 3000 * 0.48,
    inflation: state.inflation,
    savingsBuckets: allocationToBuckets(state.savingsAllocation),
    payoutBuckets: allocationToBuckets(state.payoutAllocation),
    payoutMethod: state.payoutMethod,
    // Default-Bezugsdauer für die Fixture; Store-Schema kennt das Feld nicht mehr,
    // PensionInputs aber schon (wird in Tasks 6/7 final umgestellt).
    payoutYears: 30,
    safeWithdrawalRate: state.safeWithdrawalRate,
    taxBufferPct: state.taxBufferPct,
  });

describe("DEFAULT_PENSION_STATE", () => {
  it("matches the module defaults (modulo expectedStatePension/pensionInfoChoice)", () => {
    const def = { ...PENSION_MODULE_DEFAULTS };
    delete (def as Partial<PensionModuleState>).expectedStatePension;
    delete (def as Partial<PensionModuleState>).pensionInfoChoice;
    expect(DEFAULT_PENSION_STATE).toEqual(def);
  });

  it("uses Annuität bis Planungsalter 90 (Beitrag ab 20) und den 12 % CGS-Puffer", () => {
    expect(DEFAULT_PENSION_STATE.payoutMethod).toBe("annuity");
    expect(DEFAULT_PENSION_STATE.planningAge).toBe(90);
    expect(DEFAULT_PENSION_STATE.contributionStartAge).toBe(20);
    expect(DEFAULT_PENSION_STATE.taxBufferPct).toBe(TAX_BUFFER_DEFAULT);
  });

  it("produces a plausible monthly savings (~ 575 €) for the 35 J / 3.000 € fixture", () => {
    // Seit Phase 4 leicht höher als früher (~525 €): die real sinkende Rente
    // (Anpassung 1,5 % < Inflation 2 %) und die vorschüssige Entnahme erhöhen
    // den Kapitalbedarf bewusst.
    const state: PensionModuleState = {
      ...DEFAULT_PENSION_STATE,
      expectedStatePension: 1440,
      pensionInfoChoice: null,
    };
    const r = calculatePension(fixtureInputs(state));
    if (r.kind !== "ok") throw new Error("expected ok");
    expect(r.monthlySavings).toBeGreaterThan(540);
    expect(r.monthlySavings).toBeLessThan(610);
  });
});
