import { newAllocationId, type Allocation } from "../../lib/assets";
import {
  PENSION_GROSS_TO_NET_DEDUCTION,
  PENSION_RAISE_DEFAULT,
  TAX_BUFFER_DEFAULT,
} from "./constants";
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

/** State without `expectedStatePension`/`pensionInfoChoice`; those fields are user-driven. */
export const DEFAULT_PENSION_STATE: Omit<PensionModuleState, "expectedStatePension" | "pensionInfoChoice"> = {
  replacementRate: 0.8,
  pensionInfo: {
    grossWithoutAdjustment: null,
    raise: PENSION_RAISE_DEFAULT,
    deduction: PENSION_GROSS_TO_NET_DEDUCTION,
  },
  inflation: 0.02,
  savingsAllocation: defaultSavings,
  payoutAllocation: defaultPayout,
  payoutMethod: "annuity",
  planningAge: 90,
  contributionStartAge: 20,
  safeWithdrawalRate: 0.035,
  taxBufferPct: TAX_BUFFER_DEFAULT,
};
