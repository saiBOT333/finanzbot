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
    expect(byLabel.r?.isDefault).toBe(true);
    expect(byLabel.i?.isDefault).toBe(true);
    expect(byLabel["τ"]?.isDefault).toBe(true);
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
});
