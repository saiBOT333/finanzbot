import { createModuleStore } from "../../lib/moduleStore";
import { newAllocationId, type Allocation } from "../../lib/assets";
import { DEFAULT_PENSION_STATE } from "./presets";
import { CONTRIBUTION_START_AGE_DEFAULT, RETIREMENT_AGE_DEFAULT } from "./constants";
import type { PayoutMethod } from "./types";

/**
 * Rohwerte aus dem Renteninfo-Brief (Schritt 3). Persistiert statt eines
 * eingefrorenen Snapshots — die Netto-Rente in heutiger Kaufkraft wird daraus
 * live abgeleitet (siehe `deriveExpectedStatePension` in defaults.ts), damit
 * spätere Änderungen an Renteneintritt/Inflation automatisch durchschlagen.
 */
export type PensionInfoInputs = {
  /** Brutto-Rente „ohne Anpassung" laut Renteninformation. null = nicht eingetragen. */
  grossWithoutAdjustment: number | null;
  /** Erwartete jährliche Rentenanpassung (z. B. 0.015). */
  raise: number;
  /** Pauschalabzug für Steuern + KV/PV (z. B. 0.2). */
  deduction: number;
};

/** Wie Schritt 3 beantwortet wurde: Brief liegt vor, bewusst geschätzt, oder noch offen. */
export type PensionInfoChoice = "letter" | "estimate" | null;

export type PensionModuleState = {
  replacementRate: number;
  /**
   * Manueller Override der Netto-Rente (heutige Kaufkraft).
   * null → Ableitung aus `pensionInfo`, sonst Faustformel (48 % vom Netto).
   */
  expectedStatePension: number | null;
  pensionInfo: PensionInfoInputs;
  /** Gabelung Schritt 3: null = noch nicht entschieden. */
  pensionInfoChoice: PensionInfoChoice;
  inflation: number;
  /** Mix of asset buckets the user contributes to during saving. Sums to 100 %. */
  savingsAllocation: Allocation;
  /** Mix during the payout phase — typically more defensive than during saving. */
  payoutAllocation: Allocation;
  payoutMethod: PayoutMethod;
  /** Bis zu welchem Lebensalter die Auszahlphase reichen soll. Default 90. */
  planningAge: number;
  /** Alter, ab dem in die DRV eingezahlt wurde. Default 20 (linear). */
  contributionStartAge: number;
  safeWithdrawalRate: number;
  taxBufferPct: number;
};

/** Default-State (Finanztip-Methodik): siehe `presets.ts`. */
export const PENSION_MODULE_DEFAULTS: PensionModuleState = {
  ...DEFAULT_PENSION_STATE,
  expectedStatePension: null,
  pensionInfoChoice: null,
};

/**
 * Migrate older persisted states that still carry the legacy single-rate fields
 * (`realReturn` / `payoutRealReturn`). Drops them in favour of the allocation
 * model — the previous rate becomes a single-bucket allocation if neither is
 * present yet.
 *
 * Exported nur für Tests.
 */
export function migrate(stored: Partial<PensionModuleState> & {
  realReturn?: number;
  payoutRealReturn?: number;
  payoutYears?: number;
}): Partial<PensionModuleState> {
  const cleaned: Partial<PensionModuleState> = { ...stored };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (cleaned as any).realReturn;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (cleaned as any).payoutRealReturn;

  if (!stored.savingsAllocation && stored.realReturn !== undefined) {
    cleaned.savingsAllocation = [
      {
        id: newAllocationId(),
        type: "etf-mixed",
        percent: 100,
        realReturnOverride: stored.realReturn,
      },
    ];
  }
  if (!stored.payoutAllocation && stored.payoutRealReturn !== undefined) {
    cleaned.payoutAllocation = [
      {
        id: newAllocationId(),
        type: "etf-mixed",
        percent: 100,
        realReturnOverride: stored.payoutRealReturn,
      },
    ];
  }

  // Legacy: payoutYears wurde durch planningAge ersetzt.
  // `stored.payoutYears` ist im Parameter-Typ deklariert — kein `any`-Cast nötig.
  const legacyPayoutYears = stored.payoutYears;
  if (
    cleaned.planningAge === undefined &&
    typeof legacyPayoutYears === "number" &&
    Number.isFinite(legacyPayoutYears) &&
    legacyPayoutYears > 0 &&
    legacyPayoutYears <= 60
  ) {
    // Ohne Profil-Zugriff im Store-Loader: konservativ RETIREMENT_AGE_DEFAULT als
    // Default-Renteneintritt nehmen. Wer das überschreiben will, ändert das
    // Planungsalter im UI.
    cleaned.planningAge = RETIREMENT_AGE_DEFAULT + legacyPayoutYears;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (cleaned as any).payoutYears;

  if (cleaned.contributionStartAge === undefined) {
    cleaned.contributionStartAge = CONTRIBUTION_START_AGE_DEFAULT;
  }

  // Renteninfo-Entkopplung: ein früher übernommener Snapshot bleibt als
  // manueller Override in `expectedStatePension` gültig (kein Datenverlust).
  // `pensionInfo` startet leer; unvollständig persistierte Objekte werden mit
  // den Defaults aufgefüllt.
  cleaned.pensionInfo = {
    ...PENSION_MODULE_DEFAULTS.pensionInfo,
    ...(stored.pensionInfo ?? {}),
  };

  // Gabelung Schritt 3: Bestandsdaten mit eingetragener Brutto-Rente haben die
  // Frage implizit schon beantwortet — sonst bleibt eine persistierte Wahl
  // erhalten bzw. startet offen (null).
  if (cleaned.pensionInfoChoice === undefined) {
    cleaned.pensionInfoChoice =
      cleaned.pensionInfo.grossWithoutAdjustment !== null ? "letter" : null;
  }

  return cleaned;
}

export const pensionStore = createModuleStore<PensionModuleState>(
  "pension",
  PENSION_MODULE_DEFAULTS,
  migrate,
);
