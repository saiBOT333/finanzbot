import { useEffect } from "react";
import { Card } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { InfoTooltip } from "../../../components/InfoTooltip";
import { formatEUR, formatEURRounded, formatPercent } from "../../../lib/format";
import { useProfile, setProfile } from "../../../lib/profile/useProfile";
import { calculatePension } from "../calculations";
import { explainPension } from "../explain";
import { PensionRechenweg } from "../PensionRechenweg";
import { PensionPrintSheet } from "../PensionPrintSheet";
import { savingsRateMessage } from "../savingsRate";
import { pensionStore } from "../state";
import {
  allocationToBuckets,
  deriveExpectedStatePension,
  derivePayoutYears,
  withDefaults,
} from "../defaults";
import { SAVINGS_RATE_BENCHMARKS } from "../constants";
import { tooltips } from "../tooltips";
import { effectiveRealReturn } from "../../../lib/assets";

export function ResultStep() {
  const profile = useProfile();
  const m = pensionStore.useState();

  // Gesetzliche Rente live ableiten (Override → Renteninfo → Faustformel) statt
  // einen eingefrorenen Snapshot zu verwenden.
  const statePension = deriveExpectedStatePension(profile, m, new Date().getFullYear());

  const inputs = withDefaults({
    currentAge: profile.age,
    retirementAge: profile.retirementAge,
    netIncomeMonthly: profile.netIncomeMonthly,
    replacementRate: m.replacementRate,
    expectedStatePension: statePension.monthly,
    inflation: m.inflation,
    statePensionRaise: m.pensionInfo.raise,
    savingsBuckets: allocationToBuckets(m.savingsAllocation),
    payoutBuckets: allocationToBuckets(m.payoutAllocation),
    // bAV/Riester/Rürup ist kein frei verzehrbares Depotkapital (illiquide,
    // Rentenauszahlung, nachgelagert besteuert) — bleibt hier außen vor.
    // Hinweis dazu im Vermögens-Accordion (AssumptionsStep).
    existingAssets: (profile.assets ?? [])
      .filter((a) => a.type !== "company-pension")
      .map((a) => ({
        amount: a.amount,
        realReturn: effectiveRealReturn(a),
      })),
    payoutMethod: m.payoutMethod,
    payoutYears: derivePayoutYears(m.planningAge, profile.retirementAge),
    safeWithdrawalRate: m.safeWithdrawalRate,
    taxBufferPct: m.taxBufferPct,
  });

  const result = calculatePension(inputs);

  // Mirror the recommended savings rate into the shared profile so future
  // modules (e.g. ETF simulator) can use it as a default.
  const computedRecommendation =
    result.kind === "ok" ? Math.round(result.monthlySavings) : undefined;
  useEffect(() => {
    if (
      computedRecommendation !== undefined &&
      profile.recommendedMonthlySavings !== computedRecommendation
    ) {
      setProfile({ recommendedMonthlySavings: computedRecommendation });
    }
  }, [computedRecommendation, profile.recommendedMonthlySavings]);

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
  const usingDefaultStatePension = statePension.source === "fallback";

  // Der Browser nimmt document.title als PDF-Dateinamen. Vor dem Druck auf
  // einen sprechenden, eindeutigen Namen setzen, danach wiederherstellen.
  const handlePrint = () => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
    const previousTitle = document.title;
    document.title = `Vorsorge-Ergebnis-${stamp}`;
    const restore = () => {
      document.title = previousTitle;
      window.removeEventListener("afterprint", restore);
    };
    window.addEventListener("afterprint", restore);
    window.print();
  };

  return (
    <div className="space-y-6">
      {statePension.source === "fallback" && m.pensionInfoChoice !== "estimate" && (
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

      {statePension.source === "fallback" && m.pensionInfoChoice === "estimate" && (
        <div className="border-l-[3px] border-primary bg-surface-container px-4 py-3">
          <p className="m3-eyebrow-muted">Gesetzliche Rente · geschätzt</p>
          <p className="mt-1.5 font-sans text-[13px] leading-relaxed text-on-surface-variant">
            Dein Ergebnis basiert auf einer Schätzung der gesetzlichen Rente:{" "}
            <span className="tabular-nums font-semibold text-on-surface">
              {formatEUR(result.needToday - result.gapToday)}
            </span>{" "}
            pro Monat — pauschal 48 % deines Netto-Einkommens. Mit dem Wert aus deiner
            Renteninformation (Schritt 3) wird es deutlich genauer.
          </p>
        </div>
      )}

      {statePension.source === "renteninfo" && (
        <div className="border-l-[3px] border-outline-variant bg-surface-container px-4 py-3">
          <p className="m3-eyebrow-muted">Gesetzliche Rente · live aus deiner Renteninformation</p>
          <p className="mt-1.5 font-sans text-[12.5px] leading-relaxed text-on-surface-variant">
            <span className="tabular-nums font-semibold text-on-surface">
              {formatEUR(statePension.monthly)}
            </span>{" "}
            / Monat in heutiger Kaufkraft — abgeleitet aus{" "}
            <span className="tabular-nums">{formatEUR(m.pensionInfo.grossWithoutAdjustment ?? 0)}</span>{" "}
            brutto ohne Anpassung, Anpassung{" "}
            <span className="tabular-nums">{formatPercent(m.pensionInfo.raise)}</span> p. a., Abzug{" "}
            <span className="tabular-nums">{formatPercent(m.pensionInfo.deduction)}</span>. Ändern sich
            Renteneintritt oder Inflation, rechnet dieser Wert automatisch mit.
          </p>
        </div>
      )}

      {statePension.source === "override" && (
        <div className="border-l-[3px] border-outline-variant bg-surface-container px-4 py-3">
          <p className="m3-eyebrow-muted">Gesetzliche Rente · manuell festgelegt</p>
          <p className="mt-1.5 font-sans text-[12.5px] leading-relaxed text-on-surface-variant">
            Du hast{" "}
            <span className="tabular-nums font-semibold text-on-surface">
              {formatEUR(statePension.monthly)}
            </span>{" "}
            / Monat fest vorgegeben — Eingaben aus Schritt 03 (Renteninformation) werden ignoriert.
            Lösche den Wert in den Annahmen, um wieder live abzuleiten.
          </p>
        </div>
      )}

      {/* M3 Hero-Card: Display-Zahl auf Primary-Container. */}
      <Card variant="hero">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <p className="text-[12px] uppercase tracking-[0.08em] opacity-85">
              Empfohlene monatliche Sparrate
            </p>
            <InfoTooltip
              content={tooltips.monthlySavings}
              label="Erklärung zu Empfohlene monatliche Sparrate"
            />
          </div>
          <Button
            variant="tonal"
            size="sm"
            onClick={handlePrint}
            title="Ergebnis als PDF speichern (über den Druckdialog)"
          >
            <span aria-hidden className="m3-icon text-[18px]">picture_as_pdf</span> Als PDF speichern
          </Button>
        </div>

        <div className="mt-6">
          <p className="m3-display text-on-primary-container">
            {formatEURRounded(result.monthlySavings)}
          </p>
          <div className="mt-3 flex items-center gap-3">
            <span aria-hidden className="inline-block h-[3px] w-12 bg-primary rounded-full" />
            <span className="text-[13px] opacity-85">pro Monat, in heutiger Kaufkraft</span>
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
            <div className="flex items-center gap-1.5">
              <p className="text-[12px] font-medium opacity-85">Alternative: fester Betrag</p>
              <InfoTooltip
                content={tooltips.fixedNominalSavings}
                label="Erklärung zu Alternative: fester Betrag"
              />
            </div>
            <p className="mt-1 text-2xl font-semibold tabular-nums">
              {formatEURRounded(result.fixedNominalSavings)}
            </p>
            <p className="mt-1 text-[12px] leading-snug opacity-85">
              jeden Monat gleich viel, dafür ohne jährliche Erhöhung
            </p>
          </div>
        </div>
      </Card>

      {/* Neutraler Lesehinweis im Border-links-Muster (kein Pink — das liest sich als Warnung). */}
      <div className="border-l-[3px] border-primary bg-surface-container px-4 py-3 flex gap-3 items-start">
        <span aria-hidden className="m3-icon text-[20px] leading-none text-primary">lightbulb</span>
        <div className="space-y-1.5">
          <p className="m3-eyebrow-muted">Lesehinweis</p>
          <p className="font-sans text-[13px] leading-relaxed text-on-surface-variant">
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
          label="Kapitalbedarf (heutige Kaufkraft)"
          value={formatEURRounded(result.capitalNeeded, 1000)}
          hint={`Bei Renteneintritt in ${result.yearsToRetirement} Jahren entspricht das nominal ca. ${formatEUR(result.capitalNeededNominal)}`}
          tooltip={tooltips.capitalNeeded}
        />
        <Stat
          label="Vorhandenes Vermögen mitberücksichtigt"
          value={formatEUR(result.existingFV)}
          hint={
            result.existingFV > 0
              ? `Heutige Kaufkraft bei Renteneintritt. Nominal in ${result.yearsToRetirement} Jahren entspricht das ca. ${formatEUR(result.existingFVNominal)}`
              : "Du startest ohne Vorsorge-Kapital"
          }
          tooltip={tooltips.existingFV}
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
          {result.bridgeYears > 0 && (
            <ArgumentStep n="03">
              Die gesetzliche Rente fließt frühestens ab 63 — die{" "}
              {result.bridgeYears} Jahre davor deckst du den vollen Bedarf aus Kapital. Das kostet
              zusätzlich{" "}
              <span className="tabular-nums">{formatEUR(result.bridgeCapital)}</span> Brückenkapital.
            </ArgumentStep>
          )}
          <ArgumentStep n={result.bridgeYears > 0 ? "04" : "03"}>
            {inputs.payoutMethod === "annuity"
              ? `Über ${inputs.payoutYears} Jahre Rente brauchst du dafür ein Kapital von `
              : `Bei einer Entnahmerate von ${formatPercent(inputs.safeWithdrawalRate)} pro Jahr brauchst du dafür ein Kapital von `}
            <span className="tabular-nums">{formatEUR(result.capitalNeeded)}</span> in heutiger
            Kaufkraft — bei Renteneintritt sind das nominal rund{" "}
            <span className="tabular-nums">{formatEUR(result.capitalNeededNominal)}</span>.
          </ArgumentStep>
          <ArgumentStep n={result.bridgeYears > 0 ? "05" : "04"}>
            Mit <span className="tabular-nums">{formatEUR(result.monthlySavings, true)}</span> pro
            Monat und{" "}
            <span className="tabular-nums">{formatPercent(result.effectiveSavingReturn)}</span>{" "}
            realer Rendite (gewichtetes Mittel deiner Allokation) erreichst du das in{" "}
            {result.yearsToRetirement} Jahren.
          </ArgumentStep>
        </ol>
      </Card>

      <PensionRechenweg explanation={explanation} />

      <PensionPrintSheet
        result={result}
        explanation={explanation}
        usingDefaultStatePension={usingDefaultStatePension}
      />
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

  const message = savingsRateMessage(pct);

  // Bewusst keine Ampelfarben: Rot würde „Fehler" signalisieren, dabei ist eine
  // hohe Sparquote nur ein Hinweis. Die Einordnung übernimmt der Text darunter.
  const accent = "border-primary text-on-surface";
  const indicatorColor = "bg-primary";

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
    <Card className="!px-5 !py-5 sm:!px-6 sm:!py-5 flex flex-col">
      <div className="flex items-baseline gap-1.5 min-h-[3.25rem] sm:min-h-[3.75rem]">
        <span className="text-[11px] font-medium uppercase tracking-[0.06em] text-on-surface-variant">
          {label}
        </span>
        {tooltip && <InfoTooltip content={tooltip} label={`Erklärung zu ${label}`} />}
      </div>
      <div className="mt-2 text-[26px] font-semibold leading-none tabular-nums text-on-surface sm:text-[28px]">
        {value}
      </div>
      {hint && (
        <div className="mt-2 text-[13px] leading-snug text-on-surface-variant">{hint}</div>
      )}
    </Card>
  );
}
