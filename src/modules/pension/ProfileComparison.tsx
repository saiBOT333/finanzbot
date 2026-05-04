import { Card } from "../../components/ui/Card";
import { formatEUR, formatPercent } from "../../lib/format";
import { calculatePension } from "./calculations";
import { allocationToBuckets, withDefaults } from "./defaults";
import { PRESETS, detectActivePreset } from "./presets";
import type { PensionInputs, PensionResult } from "./types";
import type { PensionModuleState } from "./state";
import { effectiveRealReturn } from "../../lib/assets";
import type { Profile } from "../../lib/profile/types";

type Props = {
  profile: Profile;
  state: PensionModuleState;
  /** Already-computed result for the active state — avoids a redundant call. */
  current: Extract<PensionResult, { kind: "ok" }>;
};

/**
 * A/B comparison of the two presets at the same user inputs (age, income,
 * pension expectation, existing assets). Useful for "what if I had been more
 * defensive / more aggressive" sanity check.
 *
 * Hidden when the user has tweaked the state into "Eigene Einstellungen" —
 * comparing custom-vs-preset would be confusing in that case.
 */
export function ProfileComparison({ profile, state, current }: Props) {
  const activeId = detectActivePreset(state);
  if (!activeId) return null; // Custom state: no clean A/B base.

  const baseInputs = (s: PensionModuleState): PensionInputs =>
    withDefaults({
      currentAge: profile.age,
      retirementAge: profile.retirementAge,
      netIncomeMonthly: profile.netIncomeMonthly,
      replacementRate: s.replacementRate,
      expectedStatePension: s.expectedStatePension ?? undefined,
      inflation: s.inflation,
      savingsBuckets: allocationToBuckets(s.savingsAllocation),
      payoutBuckets: allocationToBuckets(s.payoutAllocation),
      existingAssets: (profile.assets ?? []).map((a) => ({
        amount: a.amount,
        realReturn: effectiveRealReturn(a),
      })),
      payoutMethod: s.payoutMethod,
      payoutYears: s.payoutYears,
      safeWithdrawalRate: s.safeWithdrawalRate,
      taxBufferPct: s.taxBufferPct,
    });

  const rows = PRESETS.map((preset) => {
    const isActive = preset.id === activeId;
    if (isActive) {
      return { preset, result: current, isActive };
    }
    const variantState: PensionModuleState = {
      ...preset.state,
      expectedStatePension: state.expectedStatePension,
    };
    const r = calculatePension(baseInputs(variantState));
    return { preset, result: r.kind === "ok" ? r : null, isActive };
  });

  return (
    <Card>
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-slate-800">Vergleich der Profile</h3>
        <p className="text-xs text-slate-500">
          Bei deinen Eingaben (Alter, Einkommen, Renteninformation, bestehendes Vermögen) — nur die
          Anlage-Methodik wechselt. So siehst du, wie eine andere Risikoeinschätzung deine
          Sparrate verändert.
        </p>
      </div>
      <ul className="mt-3 divide-y divide-slate-100">
        {rows.map(({ preset, result, isActive }) => (
          <li key={preset.id} className="flex items-center justify-between gap-3 py-2.5">
            <div className="min-w-0">
              <p
                className={`text-sm font-medium ${
                  isActive ? "text-brand-700" : "text-slate-800"
                }`}
              >
                {preset.label}
                <span className="ml-1.5 text-xs font-normal text-slate-500">
                  · {preset.source}
                </span>
                {isActive && (
                  <span className="ml-2 rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-brand-700">
                    aktiv
                  </span>
                )}
              </p>
            </div>
            <div className="flex-shrink-0 text-right">
              {result ? (
                <>
                  <p className="text-sm font-semibold tabular-nums text-slate-900">
                    {formatEUR(result.monthlySavings, true)}
                  </p>
                  <p className="text-xs tabular-nums text-slate-500">
                    {formatPercent(result.savingsRatePct / 100)} · real{" "}
                    {formatPercent(result.effectiveSavingReturn)}
                  </p>
                </>
              ) : (
                <p className="text-xs text-slate-400">—</p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
