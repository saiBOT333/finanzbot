import { useEffect } from "react";
import { Card } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
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
      <Card className="!border-error">
        <p className="text-[10.5px] font-medium uppercase tracking-[0.04em] text-error">
          ▲ Eingabe ungültig
        </p>
        <p className="mt-2 font-sans text-[13px] leading-relaxed text-on-surface-variant">{result.reason}</p>
      </Card>
    );
  }

  if (result.kind === "already-retired") {
    return (
      <Card>
        <p className="m3-eyebrow-muted">Hinweis</p>
        <p className="mt-2 font-sans text-[13px] leading-relaxed text-on-surface-variant">
          Mit dem aktuellen Alter und Renteneintritt befindest du dich bereits im Ruhestand. Passe
          die Werte an, um eine Lücke zu berechnen.
        </p>
      </Card>
    );
  }

  if (result.kind === "no-gap") {
    return (
      <Card>
        <p className="text-[10.5px] font-medium uppercase tracking-[0.04em] text-success">
          ◯ Keine Rentenlücke
        </p>
        <p className="mt-3 text-3xl font-semibold tracking-[-0.02em] text-on-surface">
          Du bist abgesichert.
        </p>
        <p className="mt-3 font-sans text-[13.5px] leading-relaxed text-on-surface-variant">
          Bei Bedarf <span className="tabular-nums">{formatEUR(result.needToday)}</span> und erwarteter
          gesetzlicher Rente von{" "}
          <span className="tabular-nums">{formatEUR(result.expectedStatePension)}</span> liegt keine
          Lücke vor.
        </p>
      </Card>
    );
  }

  const coveredByStatePension = result.needToday - result.gapToday;
  const explanation = explainPension(inputs, result);
  const usingDefaultStatePension = m.expectedStatePension === null;

  return (
    <div className="space-y-6">
      {usingDefaultStatePension && (
        <div className="rounded-m3-md bg-error-container p-4 flex gap-3 items-start">
          <span aria-hidden className="text-xl leading-none">▲</span>
          <div className="space-y-1">
            <p className="text-[12px] font-medium uppercase tracking-[0.04em] text-error">
              Achtung · Renteninformation fehlt
            </p>
            <p className="text-[13px] leading-relaxed text-on-surface">
              Wir rechnen mit der Faustformel <strong className="font-semibold">48 % vom Netto</strong>{" "}
              ={" "}
              <span className="tabular-nums">{formatEUR(result.needToday - result.gapToday)}</span> pro
              Monat. Das ist eine sehr grobe Schätzung und kann je nach Erwerbsbiografie deutlich
              daneben liegen. Trag in{" "}
              <strong className="font-semibold">Schritt 03 (Renteninformation)</strong> deinen echten
              Wert ein.
            </p>
          </div>
        </div>
      )}

      {/* M3 Hero-Card: Display-Zahl auf Primary-Container. */}
      <Card variant="hero">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="m3-eyebrow bg-primary text-on-primary">Output · 01</span>
            <p className="mt-2 text-[12px] uppercase tracking-[0.08em] opacity-85">
              Empfohlene monatliche Sparrate
            </p>
          </div>
          <Button
            variant="tonal"
            size="sm"
            onClick={() => window.print()}
            data-print="hide"
            title="Ergebnis drucken oder als PDF speichern"
          >
            🖨 Drucken
          </Button>
        </div>

        <div className="mt-6">
          <p className="m3-display text-on-primary-container">
            {formatEUR(result.monthlySavings, true)}
          </p>
          <div className="mt-3 flex items-center gap-3">
            <span aria-hidden className="inline-block h-[3px] w-12 bg-primary rounded-full" />
            <span className="text-[12px] uppercase tracking-[0.08em] opacity-85">
              Monatlich · Real · Heutige Kaufkraft
            </span>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-x-8 gap-y-3 border-t border-primary/20 pt-5 sm:grid-cols-2">
          <div>
            <p className="text-[11px] uppercase tracking-[0.08em] opacity-85">Sparquote</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">
              {formatPercent(result.savingsRatePct / 100)}
            </p>
            <p className="mt-1 text-[12px] leading-snug opacity-85">
              vom aktuellen Netto-Einkommen
            </p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.08em] opacity-85">Alternativ · Nominal fix</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">
              {formatEUR(result.fixedNominalSavings, true)}
            </p>
            <p className="mt-1 text-[12px] leading-snug opacity-85">
              gleichbleibender Betrag, ohne jährliche Inflationsanpassung
            </p>
          </div>
        </div>
      </Card>

      {/* Tip-Card auf Tertiary für den Lesehinweis. */}
      <div className="rounded-m3-md bg-tertiary-container text-on-tertiary-container p-4 flex gap-3 items-start">
        <span aria-hidden className="text-xl leading-none">💡</span>
        <div className="space-y-1.5">
          <p className="text-[12px] font-medium uppercase tracking-[0.08em] opacity-85">Lesehinweis</p>
          <p className="text-[13px] leading-relaxed">
            Der Hauptbetrag gilt in heutiger Kaufkraft. Um real gleich zu bleiben, musst du ihn
            jedes Jahr um die Inflation anpassen (z. B. +2 %). Steigt dein Gehalt mit der
            Inflation, bleibt die Sparquote konstant.
          </p>
        </div>
      </div>

      <SparquoteEinordnung pct={result.savingsRatePct} />

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

      <Card>
        <p className="m3-eyebrow">Berechnung · Schritt für Schritt</p>
        <h3 className="mt-1 text-2xl font-semibold tracking-[-0.02em] text-on-surface">
          So entsteht die Empfehlung
        </h3>
        <ol className="mt-2 divide-y divide-outline-variant font-sans text-[13.5px] leading-[1.65] text-on-surface-variant">
          <ArgumentStep n="01">
            Du brauchst in Rente{" "}
            <span className="tabular-nums">{formatEUR(result.needToday)}</span> pro Monat (heutige
            Kaufkraft).
          </ArgumentStep>
          <ArgumentStep n="02">
            Davon deckt die gesetzliche Rente ca.{" "}
            <span className="tabular-nums">{formatEUR(coveredByStatePension)}</span> — es bleibt eine
            Lücke von <span className="tabular-nums">{formatEUR(result.gapToday)}</span> monatlich.
          </ArgumentStep>
          <ArgumentStep n="03">
            Über {inputs.payoutYears} Jahre Rente brauchst du dafür ein Kapital von{" "}
            <span className="tabular-nums">{formatEUR(result.capitalNeeded)}</span> bei
            Renteneintritt.
          </ArgumentStep>
          <ArgumentStep n="04">
            Mit <span className="tabular-nums">{formatEUR(result.monthlySavings, true)}</span> pro
            Monat und{" "}
            <span className="tabular-nums">{formatPercent(result.effectiveSavingReturn)}</span>{" "}
            realer Rendite (gewichtetes Mittel deiner Allokation) erreichst du das in{" "}
            {result.yearsToRetirement} Jahren.
          </ArgumentStep>
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

  const accent =
    pct < recMin
      ? "border-primary text-on-surface"
      : pct <= recMax
        ? "border-success text-on-surface"
        : "border-error text-on-surface";

  const indicatorColor =
    pct < recMin
      ? "bg-primary"
      : pct <= recMax
        ? "bg-success"
        : "bg-error";

  return (
    <div className={`mt-5 border-l-[3px] ${accent} bg-surface-container px-4 py-3`}>
      <p className="m3-eyebrow-muted">Einordnung · Sparquote</p>
      <div className="relative mt-3 h-1.5 w-full overflow-hidden bg-surface-container">
        <div
          className="absolute inset-y-0 bg-success/20"
          aria-hidden="true"
          style={{ left: `${recLeft}%`, width: `${recWidth}%` }}
        />
        <div
          className={`absolute inset-y-0 left-0 ${indicatorColor}`}
          style={{ width: `${sparrateLeftPct}%` }}
          aria-label={`Deine Sparquote ${pct.toFixed(1)} %`}
        />
      </div>
      <div className="mt-2 flex items-center justify-between text-[10px] uppercase tracking-[0.04em] text-on-surface-variant">
        <span>0 %</span>
        <span>
          Ø DE {avg.toFixed(0)} % · Empf. {recMin.toFixed(0)}–{recMax.toFixed(0)} %
        </span>
      </div>
      <p className="mt-3 font-sans text-[12.5px] leading-relaxed text-on-surface-variant">
        Deine Sparquote liegt bei{" "}
        <strong className="tabular-nums">{formatPercent(pct / 100)}</strong>. {message}
      </p>
    </div>
  );
}

function ArgumentStep({ n, children }: { n: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-4 py-3">
      <span
        aria-hidden
        className="flex-shrink-0 text-[11px] font-medium tabular-nums text-primary"
      >
        {n}
      </span>
      <span>{children}</span>
    </li>
  );
}

function Stat({ label, value, hint, tooltip }: StatProps) {
  return (
    <Card className="!px-5 !py-4 sm:!px-5 sm:!py-4">
      <div className="flex items-center gap-1.5">
        <span className="m3-eyebrow-muted">{label}</span>
        {tooltip && <InfoTooltip content={tooltip} label={`Erklärung zu ${label}`} />}
      </div>
      <div className="mt-2 text-xl font-semibold tabular-nums text-on-surface sm:text-2xl">
        {value}
      </div>
      {hint && (
        <div className="mt-1.5 font-sans text-[11.5px] leading-snug text-on-surface-variant">{hint}</div>
      )}
    </Card>
  );
}
