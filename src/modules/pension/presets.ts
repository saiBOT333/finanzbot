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

const conservative: Preset = {
  id: "conservative",
  label: "Konservativ",
  source: "Finanztip",
  description:
    "Vorsichtige Annahmen aus dem Finanztip-Video: gemischtes Portfolio, niedrigere Rendite, längere Bezugsdauer, keine Steuern eingerechnet.",
  state: {
    replacementRate: 0.8,
    inflation: 0.02,
    realReturn: 0.03,
    payoutRealReturn: 0.01,
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
    "Investorisch: Welt-ETF-Annahme mit 5 % realer Rendite durchgängig, sichere Entnahmerate (3,5 %), mit Steuer-Puffer.",
  state: {
    replacementRate: 0.8,
    inflation: 0.02,
    realReturn: 0.05,
    payoutRealReturn: 0.05,
    payoutMethod: "safe-withdrawal",
    payoutYears: 30,
    safeWithdrawalRate: 0.035,
    taxBufferPct: 0.12,
  },
};

export const PRESETS: readonly Preset[] = [conservative, investor];

/** Default preset applied when nothing is stored yet — Finanztip-conservative. */
export const DEFAULT_PRESET = conservative;

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
    state.realReturn === preset.realReturn &&
    state.payoutRealReturn === preset.payoutRealReturn &&
    state.payoutMethod === preset.payoutMethod &&
    state.payoutYears === preset.payoutYears &&
    state.safeWithdrawalRate === preset.safeWithdrawalRate &&
    state.taxBufferPct === preset.taxBufferPct
  );
}
