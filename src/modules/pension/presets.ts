import { newAllocationId, type Allocation } from "../../lib/assets";
import type { PensionModuleState } from "./state";

// Konservativer Default (Finanztip-Methodik): 3 % real Anspar (≈ 5 % nominal
// gemischtes Portfolio), 1 % real Auszahl (defensiver Anlagemix im Alter),
// Annuität über 30 Jahre, kein Steuer-Puffer.
//
// Single-Bucket-Allokationen sorgen dafür, dass das Tool out-of-the-box die
// Finanztip-Faustformel exakt reproduziert. Wer sein echtes Portfolio abbilden
// will, fügt manuell weitere Buckets hinzu — die Mathematik wird dann
// automatisch genauer (weighted Aufzinsung pro Bucket).

const defaultSavings: Allocation = [
  { id: newAllocationId(), type: "etf-mixed", percent: 100 },
];

const defaultPayout: Allocation = [
  { id: newAllocationId(), type: "bonds", percent: 100 },
];

/** State without `expectedStatePension`; that field is user-driven. */
export const DEFAULT_PENSION_STATE: Omit<PensionModuleState, "expectedStatePension"> = {
  replacementRate: 0.8,
  inflation: 0.02,
  savingsAllocation: defaultSavings,
  payoutAllocation: defaultPayout,
  payoutMethod: "annuity",
  payoutYears: 30,
  safeWithdrawalRate: 0.035,
  taxBufferPct: 0,
};
