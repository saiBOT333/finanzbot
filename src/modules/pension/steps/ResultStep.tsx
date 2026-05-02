import { useEffect } from "react";
import { Card } from "../../../components/ui/Card";
import { InfoTooltip } from "../../../components/InfoTooltip";
import { formatEUR, formatPercent } from "../../../lib/format";
import { useProfile, setProfile } from "../../../lib/profile/useProfile";
import { calculatePension } from "../calculations";
import { explainPension } from "../explain";
import { PensionRechenweg } from "../PensionRechenweg";
import { pensionStore } from "../state";
import { allocationToBuckets, withDefaults } from "../defaults";
import { SAVINGS_RATE_BENCHMARKS } from "../constants";
import { tooltips } from "../tooltips";
import { effectiveRealReturn } from "../../../lib/assets";

export function ResultStep() {
  const profile = useProfile();
  const m = pensionStore.useState();

  const inputs = withDefaults({
    currentAge: profile.age,
    retirementAge: profile.retirementAge,
    netIncomeMonthly: profile.netIncomeMonthly,
    replacementRate: m.replacementRate,
    expectedStatePension: m.expectedStatePension ?? undefined,
    inflation: m.inflation,
    savingsBuckets: allocationToBuckets(m.savingsAllocation),
    payoutBuckets: allocationToBuckets(m.payoutAllocation),
    existingAssets: (profile.assets ?? []).map((a) => ({
      amount: a.amount,
      realReturn: effectiveRealReturn(a),
    })),
    payoutMethod: m.payoutMethod,
    payoutYears: m.payoutYears,
    safeWithdrawalRate: m.safeWithdrawalRate,
    taxBufferPct: m.taxBufferPct,
  });

  const result = calculatePension(inputs);

  // Mirror the recommended savings rate into the shared profile so future
  // modules (e.g. ETF simulator) can use it as a default.
  const computedCapacity =
    result.kind === "ok" ? Math.round(result.monthlySavings) : undefined;
  useEffect(() => {
    if (computedCapacity !== undefined && profile.monthlySavingsCapacity !== computedCapacity) {
      setProfile({ monthlySavingsCapacity: computedCapacity });
    }
  }, [computedCapacity, profile.monthlySavingsCapacity]);

  if (result.kind === "invalid") {
    return (
      <Card className="border-amber-200 bg-amber-50 ring-amber-200">
        <p className="text-sm text-amber-900">{result.reason}</p>
      </Card>
    );
  }

  if (result.kind === "already-retired") {
    return (
      <Card>
        <p className="text-sm">
          Mit dem aktuellen Alter und Renteneintritt befindest du dich bereits im Ruhestand.
          Passe die Werte an, um eine Lücke zu berechnen.
        </p>
      </Card>
    );
  }

  if (result.kind === "no-gap") {
    return (
      <Card className="ring-emerald-200">
        <p className="text-lg font-semibold text-emerald-700">Keine Rentenlücke 🎉</p>
        <p className="mt-2 text-sm text-slate-600">
          Bei Bedarf {formatEUR(result.needToday)} und erwarteter gesetzlicher Rente von{" "}
          {formatEUR(result.expectedStatePension)} liegt keine Lücke vor.
        </p>
      </Card>
    );
  }

  const coveredByStatePension = result.needToday - result.gapToday;
  const explanation = explainPension(inputs, result);

  return (
    <div className="space-y-4">
      <Card className="ring-brand-200">
        <p className="text-sm font-medium text-slate-500">Empfehlung</p>
        <p className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
          {formatEUR(result.monthlySavings, true)} pro Monat
        </p>
        <p className="mt-1 text-sm text-slate-600">
          Das sind <strong>{formatPercent(result.savingsRatePct / 100)}</strong> deines aktuellen
          Netto-Einkommens. Damit schließt du deine Rentenlücke voraussichtlich bis zum
          Renteneintritt.
        </p>
        <SparquoteEinordnung pct={result.savingsRatePct} />
      </Card>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Stat
          label="Rentenlücke pro Monat (heute)"
          value={formatEUR(result.gapToday)}
          hint={`In ${result.yearsToRetirement} Jahren entspricht das ca. ${formatEUR(result.gapAtRetirementNominal)}`}
          tooltip={tooltips.gapToday}
        />
        <Stat
          label="Kapitalbedarf bei Renteneintritt"
          value={formatEUR(result.capitalNeeded)}
          tooltip={tooltips.capitalNeeded}
        />
        <Stat
          label="Vorhandenes Vermögen mitberücksichtigt"
          value={formatEUR(result.existingFV)}
          hint={
            result.existingFV > 0
              ? "Dein Startkapital wächst real auf diesen Betrag"
              : "Du startest ohne Vorsorge-Kapital"
          }
        />
      </div>

      <Card className="bg-slate-50">
        <h3 className="text-sm font-semibold text-slate-800">So entsteht die Empfehlung</h3>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-slate-600">
          <li>Du brauchst in Rente {formatEUR(result.needToday)} pro Monat (heutige Kaufkraft).</li>
          <li>
            Davon deckt die gesetzliche Rente ca. {formatEUR(coveredByStatePension)} – es bleibt
            eine Lücke von {formatEUR(result.gapToday)} monatlich.
          </li>
          <li>
            Über {inputs.payoutYears} Jahre Rente brauchst du dafür ein Kapital von{" "}
            {formatEUR(result.capitalNeeded)} bei Renteneintritt.
          </li>
          <li>
            Mit {formatEUR(result.monthlySavings, true)} pro Monat und{" "}
            {formatPercent(result.effectiveSavingReturn)} realer Rendite (gewichtetes
            Mittel deiner Allokation) erreichst du das in {result.yearsToRetirement} Jahren.
          </li>
        </ol>
      </Card>

      <PensionRechenweg explanation={explanation} />
    </div>
  );
}

type StatProps = {
  label: string;
  value: string;
  hint?: string;
  tooltip?: string;
};

function SparquoteEinordnung({ pct }: { pct: number }) {
  const avg = SAVINGS_RATE_BENCHMARKS.germanyAverage * 100;
  const recMin = SAVINGS_RATE_BENCHMARKS.recommendedMin * 100;
  const recMax = SAVINGS_RATE_BENCHMARKS.recommendedMax * 100;

  const max = Math.max(recMax + 5, pct + 2);
  const sparrateLeftPct = Math.min(100, (pct / max) * 100);
  const recLeft = (recMin / max) * 100;
  const recWidth = ((recMax - recMin) / max) * 100;

  const message =
    pct < avg
      ? "Liegt unter dem deutschen Durchschnitt — leicht zu erreichen. Achtung: vermutlich rechnest du mit eher optimistischen Annahmen."
      : pct < recMin
        ? "Über dem deutschen Durchschnitt, aber unter der Finanzfluss-Empfehlung für eine ausreichende Altersvorsorge."
        : pct <= recMax
          ? "Im empfohlenen Korridor — solide Altersvorsorge laut Finanzfluss."
          : "Hohe Sparquote — prüfe, ob deine Annahmen (Lücke, Bezugsdauer, Rendite) realistisch sind.";

  const tone =
    pct < recMin
      ? "bg-amber-50 ring-amber-200 text-amber-900"
      : pct <= recMax
        ? "bg-emerald-50 ring-emerald-200 text-emerald-900"
        : "bg-rose-50 ring-rose-200 text-rose-900";

  return (
    <div className={`mt-4 rounded-lg p-3 ring-1 ${tone}`}>
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-white/70">
        <div
          className="absolute inset-y-0 bg-emerald-300/70"
          aria-hidden="true"
          style={{ left: `${recLeft}%`, width: `${recWidth}%` }}
        />
        <div
          className="absolute inset-y-0 left-0 bg-slate-700/70"
          style={{ width: `${sparrateLeftPct}%` }}
          aria-label={`Deine Sparquote ${pct.toFixed(1)} %`}
        />
      </div>
      <p className="mt-2 text-xs leading-relaxed">
        Deine Sparquote liegt bei <strong>{formatPercent(pct / 100)}</strong>. {message}{" "}
        <span className="opacity-75">
          (Referenz: Ø Deutschland ~{avg.toFixed(0)} %, Finanzfluss-Empfehlung {recMin.toFixed(0)}–
          {recMax.toFixed(0)} %.)
        </span>
      </p>
    </div>
  );
}

function Stat({ label, value, hint, tooltip }: StatProps) {
  return (
    <Card>
      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
        <span>{label}</span>
        {tooltip && <InfoTooltip content={tooltip} label={`Erklärung zu ${label}`} />}
      </div>
      <div className="mt-1 text-xl font-semibold text-slate-900">{value}</div>
      {hint && <div className="mt-1 text-xs text-slate-500">{hint}</div>}
    </Card>
  );
}
