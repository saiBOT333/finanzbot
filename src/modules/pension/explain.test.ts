import { describe, it, expect } from "vitest";
import { calculatePension } from "./calculations";
import { withDefaults } from "./defaults";
import { explainPension } from "./explain";

describe("explainPension", () => {
  const inputs = withDefaults({ currentAge: 35, netIncomeMonthly: 3000 });
  const result = calculatePension(inputs);
  if (result.kind !== "ok") throw new Error("expected ok result for fixture");
  const ex = explainPension(inputs, result);

  it("lists all expected inputs with stable symbols", () => {
    const symbols = ex.inputs.map((i) => i.symbol);
    expect(symbols).toContain("a");
    expect(symbols).toContain("a₊");
    expect(symbols).toContain("N");
    expect(symbols).toContain("q");
    expect(symbols).toContain("R");
    expect(symbols).toContain("r");
    expect(symbols).toContain("rₐ");
    expect(symbols).toContain("M"); // method
    expect(symbols).toContain("τ"); // tax buffer
  });

  it("flags untouched fields as default and required user inputs as not", () => {
    const byLabel = Object.fromEntries(ex.inputs.map((i) => [i.symbol, i]));
    expect(byLabel.a?.isDefault).toBe(false);
    expect(byLabel.N?.isDefault).toBe(false);
    expect(byLabel.i?.isDefault).toBe(true);
    expect(byLabel["τ"]?.isDefault).toBe(true);
    // r and rₐ now describe a weighted allocation; the per-bucket detail is
    // shown in the value text, so we no longer flag them as "default" or not.
    expect(byLabel.r?.value).toMatch(/@/);
    expect(byLabel["rₐ"]?.value).toMatch(/@/);
  });

  it("produces a complete sequence of indexed steps", () => {
    expect(ex.steps.length).toBeGreaterThanOrEqual(10);
    const indices = ex.steps.map((s) => s.index);
    expect(indices).toEqual([...indices].sort((a, b) => a - b));
  });

  it("step 1 (need) result reflects the actual computed needToday", () => {
    expect(ex.steps[0]?.title).toContain("Bedarf");
    expect(ex.steps[0]?.result).toContain("2.400");
  });

  it("step 2 (gap) result reflects the actual computed gapToday", () => {
    expect(ex.steps[1]?.title).toContain("Rentenlücke");
    expect(ex.steps[1]?.result).toContain("960");
  });

  it("includes a tax buffer step that names the absolute Euro buffer amount", () => {
    const taxStep = ex.steps.find((s) => s.title.includes("Steuer-Puffer"));
    expect(taxStep).toBeDefined();
    expect(taxStep?.result).toMatch(/Puffer/);
  });

  it("safe-withdrawal switches the capital step formula", () => {
    const swInputs = withDefaults({
      currentAge: 35,
      netIncomeMonthly: 3000,
      payoutMethod: "safe-withdrawal",
    });
    const swResult = calculatePension(swInputs);
    if (swResult.kind !== "ok") throw new Error("ok");
    const swEx = explainPension(swInputs, swResult);
    const capStep = swEx.steps.find((s) => s.title.includes("Kapitalbedarf"));
    expect(capStep?.formula).toContain("K₀ = L × 12 / w");
  });

  it("includes a closing paragraph about real vs. nominal", () => {
    expect(ex.closing.toLowerCase()).toContain("kaufkraft");
    expect(ex.closing.toLowerCase()).toContain("inflation");
  });

  it("shows no bridge step when retiring at 67", () => {
    expect(ex.steps.some((s) => s.title.includes("Brückenkapital"))).toBe(false);
  });

  it("annuity capital step shows growing annuity + vorschüssige Entnahme (Phase 4)", () => {
    const capStep = ex.steps.find((s) => s.title.includes("Kapitalbedarf vor Steuer"));
    expect(capStep?.formula).toContain("aᵍₘ");
    expect(capStep?.formula).toContain("× (1 + rₐₘ)");
    expect(capStep?.note).toContain("schrumpft");
  });

  it("lists the pension raise ρ for annuity, but not for safe-withdrawal", () => {
    expect(ex.inputs.some((i) => i.symbol === "ρ")).toBe(true);
    const swInputs = withDefaults({
      currentAge: 35,
      netIncomeMonthly: 3000,
      payoutMethod: "safe-withdrawal",
    });
    const swResult = calculatePension(swInputs);
    if (swResult.kind !== "ok") throw new Error("ok");
    const swEx = explainPension(swInputs, swResult);
    expect(swEx.inputs.some((i) => i.symbol === "ρ")).toBe(false);
  });
});

describe("explainPension — Frühverrentungs-Brücke", () => {
  const inputs = withDefaults({
    currentAge: 40,
    retirementAge: 55,
    netIncomeMonthly: 3000,
    expectedStatePension: 1500,
    payoutYears: 35,
  });
  const result = calculatePension(inputs);
  if (result.kind !== "ok") throw new Error("expected ok result for fixture");
  const ex = explainPension(inputs, result);

  it("inserts bridge, main-phase and sum steps with sequential indices", () => {
    const titles = ex.steps.map((s) => s.title);
    const bridgeIdx = titles.findIndex((t) => t.includes("Brückenkapital"));
    const mainIdx = titles.findIndex((t) => t.includes("Hauptphase"));
    const sumIdx = titles.findIndex((t) => t.includes("Brücke + Hauptphase"));
    expect(bridgeIdx).toBeGreaterThan(-1);
    expect(mainIdx).toBe(bridgeIdx + 1);
    expect(sumIdx).toBe(mainIdx + 1);
    const indices = ex.steps.map((s) => s.index);
    expect(indices).toEqual(indices.map((_, i) => i + 1));
  });

  it("sum step result equals capitalNeededBeforeTax", () => {
    const sumStep = ex.steps.find((s) => s.title.includes("Brücke + Hauptphase"));
    expect(sumStep?.formula).toBe("K₀ = K_B + K_H");
  });

  it("keeps rₐ visible for safe-withdrawal when a bridge exists (bridge annuity uses it)", () => {
    const swInputs = withDefaults({
      currentAge: 40,
      retirementAge: 55,
      netIncomeMonthly: 3000,
      expectedStatePension: 1500,
      payoutMethod: "safe-withdrawal",
    });
    const swResult = calculatePension(swInputs);
    if (swResult.kind !== "ok") throw new Error("ok");
    const swEx = explainPension(swInputs, swResult);
    expect(swEx.inputs.some((i) => i.symbol === "rₐ")).toBe(true);
  });
});
