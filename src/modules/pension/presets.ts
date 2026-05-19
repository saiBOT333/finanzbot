import { newAllocationId, type Allocation } from "../../lib/assets";
import { TAX_BUFFER_DEFAULT } from "./constants";
import type { PensionModuleState } from "./state";

// Konservativer Default: 3 % real Anspar (≈ 5 % nominal gemischtes Portfolio),
// 1 % real Auszahl (defensiver Anlagemix im Alter), Annuität über 30 Jahre.
// Der Steuer-Puffer (12 %, Finanzfluss-Faustformel) ist standardmäßig aktiv —
// die Kapitalertragssteuer fällt real an, ein 0er-Default würde den
// Kapitalbedarf systematisch zu niedrig ansetzen.
//
// Single-Bucket-Allokationen halten die Defaults nah an den Faustformeln von
// Finanztip/Finanzfluss. Wer sein echtes Portfolio abbilden will, fügt manuell
// weitere Buckets hinzu — die Mathematik wird dann automatisch genauer
// (weighted Aufzinsung pro Bucket).

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
  taxBufferPct: TAX_BUFFER_DEFAULT,
};
