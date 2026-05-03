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

// Profile-Defaults sind als SINGLE-BUCKET-Allokationen kalibriert, damit das
// Tool out-of-the-box die jeweilige Faustformel exakt reproduziert. Wer sein
// echtes Portfolio abbilden will, fügt manuell weitere Buckets hinzu — das
// Profil wechselt dann auf "Eigene Einstellungen" und die Mathematik wird
// automatisch genauer (weighted Aufzinsung pro Bucket).

const conservativeSavings: Allocation = [
  // Saidi/Finanztip: 5 % nominal Anspar = 3 % real bei gemischtem Portfolio.
  { id: newAllocationId(), type: "etf-mixed", percent: 100 },
];

const conservativePayout: Allocation = [
  // Saidi/Finanztip: 3 % nominal Auszahl = 1 % real (deutlich weniger Aktien im Alter).
  { id: newAllocationId(), type: "bonds", percent: 100 },
];

const investorSavings: Allocation = [
  // Carlotta/Finanzfluss: durchgängig 5 % real auf einem Welt-ETF.
  { id: newAllocationId(), type: "etf-world", percent: 100 },
];

const investorPayout: Allocation = [
  // Carlotta/Finanzfluss: ETF-Anteil bleibt auch im Alter hoch.
  { id: newAllocationId(), type: "etf-world", percent: 100 },
];

const conservative: Preset = {
  id: "conservative",
  label: "Konservativ",
  source: "Finanztip",
  description:
    "Faustformel aus dem Finanztip-Video: 3 % real Anspar (≈ 5 % nominal bei gemischtem Portfolio), 1 % real Auszahl (≈ 3 % nominal mit niedriger Aktienquote im Alter), 30 Jahre Bezugsdauer, keine Steuern eingerechnet. Wer sein echtes Portfolio abbilden will, ergänzt die Allokation manuell.",
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
    "Faustformel aus dem Finanzfluss-Video (Carlotta): 5 % real durchgängig (Welt-ETF-Annahme), sichere Entnahmerate von 3,5 %, mit 12 % Steuer-Puffer. Wer das Portfolio realistischer mischen will, fügt Anleihen oder Cash zur Allokation hinzu.",
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
