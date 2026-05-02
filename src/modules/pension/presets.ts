import { newAllocationId, type Allocation } from "../../lib/assets";
import type { PensionModuleState } from "./state";

export type PresetId = "conservative" | "investor";

export type Preset = {
  id: PresetId;
  label: string;
  source: string;
  description: string;
  /** State without `expectedStatePension`; that field is user-driven and preserved across switches. */
  state: Omit<PensionModuleState, "expectedStatePension">;
};

const conservativeSavings: Allocation = [
  { id: newAllocationId(), type: "etf-world", percent: 30 },
  { id: newAllocationId(), type: "bonds", percent: 50 },
  { id: newAllocationId(), type: "cash", percent: 20 },
];

const conservativePayout: Allocation = [
  { id: newAllocationId(), type: "etf-world", percent: 10 },
  { id: newAllocationId(), type: "bonds", percent: 60 },
  { id: newAllocationId(), type: "cash", percent: 30 },
];

const investorSavings: Allocation = [
  { id: newAllocationId(), type: "etf-world", percent: 80 },
  { id: newAllocationId(), type: "bonds", percent: 20 },
];

const investorPayout: Allocation = [
  { id: newAllocationId(), type: "etf-world", percent: 40 },
  { id: newAllocationId(), type: "bonds", percent: 40 },
  { id: newAllocationId(), type: "cash", percent: 20 },
];

const conservative: Preset = {
  id: "conservative",
  label: "Konservativ",
  source: "Finanztip",
  description:
    "Vorsichtige Annahmen aus dem Finanztip-Video: gemischtes Portfolio (eher defensiv), längere Bezugsdauer, keine Steuern eingerechnet.",
  state: {
    replacementRate: 0.8,
    inflation: 0.02,
    savingsAllocation: conservativeSavings,
    payoutAllocation: conservativePayout,
    payoutMethod: "annuity",
    payoutYears: 30,
    safeWithdrawalRate: 0.035,
    taxBufferPct: 0,
  },
};

const investor: Preset = {
  id: "investor",
  label: "Investor",
  source: "Finanzfluss",
  description:
    "Investorisch: hohe Aktien-Quote bis ins Alter, sichere Entnahmerate (3,5 %), mit Steuer-Puffer.",
  state: {
    replacementRate: 0.8,
    inflation: 0.02,
    savingsAllocation: investorSavings,
    payoutAllocation: investorPayout,
    payoutMethod: "safe-withdrawal",
    payoutYears: 30,
    safeWithdrawalRate: 0.035,
    taxBufferPct: 0.12,
  },
};

export const PRESETS: readonly Preset[] = [conservative, investor];

/** Default preset applied when nothing is stored yet — Finanztip-conservative. */
export const DEFAULT_PRESET = conservative;

function normaliseAllocation(allocation: Allocation): string {
  return allocation
    .map((a) => `${a.type}:${a.percent}:${a.realReturnOverride ?? "-"}`)
    .sort()
    .join(",");
}

/**
 * Detect which preset the current module state matches (ignoring expectedStatePension,
 * which is user-driven). Returns null when the user has tweaked individual fields.
 */
export function detectActivePreset(state: PensionModuleState): PresetId | null {
  for (const preset of PRESETS) {
    if (matchesPreset(state, preset.state)) return preset.id;
  }
  return null;
}

function matchesPreset(
  state: PensionModuleState,
  preset: Omit<PensionModuleState, "expectedStatePension">,
): boolean {
  return (
    state.replacementRate === preset.replacementRate &&
    state.inflation === preset.inflation &&
    state.payoutMethod === preset.payoutMethod &&
    state.payoutYears === preset.payoutYears &&
    state.safeWithdrawalRate === preset.safeWithdrawalRate &&
    state.taxBufferPct === preset.taxBufferPct &&
    normaliseAllocation(state.savingsAllocation) === normaliseAllocation(preset.savingsAllocation) &&
    normaliseAllocation(state.payoutAllocation) === normaliseAllocation(preset.payoutAllocation)
  );
}
