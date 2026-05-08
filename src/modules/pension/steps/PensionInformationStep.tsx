import { useState } from "react";
import { NumberInput } from "../../../components/NumberInput";
import { Button } from "../../../components/ui/Button";
import { formatEUR, formatPercent } from "../../../lib/format";
import { useProfile } from "../../../lib/profile/useProfile";
import { PENSION_DEFAULTS, projectedNetPensionToday } from "../defaults";
import {
  PENSION_DEDUCTION_RANGE,
  PENSION_GROSS_TO_NET_DEDUCTION,
  PENSION_RAISE_DEFAULT,
  PENSION_RAISE_RANGE,
} from "../constants";
import { pensionStore } from "../state";

/**
 * Wizard step 3: capture the user's expected statutory pension from the
 * "Renteninformation" letter sent by the DRV every year. This is the most
 * important input after age/income — without it the tool falls back to the
 * 48 %-of-net rule of thumb, which can be off by hundreds of Euros.
 */
export function PensionInformationStep() {
  const profile = useProfile();
  const m = pensionStore.useState();

  const yearsToRetirement = Math.max(
    0,
    (profile.retirementAge ?? PENSION_DEFAULTS.retirementAge) - (profile.age ?? 0),
  );
  const inflation = m.inflation;
  const netIncome = profile.netIncomeMonthly ?? 0;

  const [grossWithoutAdjustment, setGrossWithoutAdjustment] = useState<number | undefined>();
  const [raise, setRaise] = useState<number>(PENSION_RAISE_DEFAULT);
  const [deduction, setDeduction] = useState<number>(PENSION_GROSS_TO_NET_DEDUCTION);

  const ready = grossWithoutAdjustment !== undefined && yearsToRetirement > 0;
  const projection = ready
    ? projectedNetPensionToday(
        grossWithoutAdjustment!,
        raise,
        deduction,
        inflation,
        yearsToRetirement,
      )
    : undefined;

  const fallbackEstimate = netIncome * PENSION_DEFAULTS.statePensionFactor;
  const stored = m.expectedStatePension;
  const hasStored = stored !== null;

  const apply = () => {
    if (projection) pensionStore.set({ expectedStatePension: Math.round(projection.netReal) });
  };

  const clear = () => pensionStore.set({ expectedStatePension: null });

  return (
    <div className="space-y-5">
      <p className="font-sans text-[14px] leading-relaxed text-ink-700">
        Die Deutsche Rentenversicherung schickt dir jedes Jahr eine{" "}
        <strong className="font-semibold">Renteninformation</strong> — darin steht, wie hoch deine
        Rente voraussichtlich wird. Trag den Wert hier ein, damit das Tool deine echte Lücke
        berechnen kann statt nur eine Faustformel anzuwenden.
      </p>

      {hasStored && (
        <div className="border-l-[3px] border-emerald-700 bg-paper-50 px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="eyebrow-muted">Wert übernommen</p>
              <p className="mt-1 font-mono text-xl font-semibold tabular-nums text-ink-900">
                {formatEUR(stored)}
                <span className="ml-1.5 font-sans text-[11px] uppercase tracking-instrument text-ink-500">
                  / Monat · heute
                </span>
              </p>
            </div>
            <Button variant="text" size="sm" onClick={clear}>
              Ändern
            </Button>
          </div>
        </div>
      )}

      {!hasStored && (
        <>
          <div className="space-y-4 border border-ink-900 bg-white p-4">
            <p className="font-sans text-[12.5px] leading-relaxed text-ink-700">
              Such auf dem Renteninfo-Brief den Wert{" "}
              <strong className="font-semibold">
                „voraussichtliche Regelaltersrente, wenn Sie wie bisher Beiträge zahlen"
              </strong>{" "}
              — das ist der <em>ohne Anpassung</em>-Wert, meist in der Tabelle direkt unter dem
              heutigen Rentenwert. Wir rechnen die Anpassung und Inflation für dich raus.
            </p>
            <NumberInput
              label="Brutto-Rente ohne Anpassung (heutiger Rentenwert)"
              value={grossWithoutAdjustment}
              onChange={setGrossWithoutAdjustment}
              unit="€"
              min={0}
              required
              placeholder="z. B. 1.988"
            />
            <NumberInput
              label="Erwartete jährliche Rentenanpassung"
              value={raise * 100}
              onChange={(v) => v !== undefined && setRaise(v / 100)}
              unit="%"
              min={PENSION_RAISE_RANGE.min * 100}
              max={PENSION_RAISE_RANGE.max * 100}
              hint="Finanztip-Faustformel: 1,5 % (Mitte zwischen den DRV-Hochrechnungen 1 % und 2 %). Pessimistisch eher Richtung 1 %."
            />
            <NumberInput
              label="Pauschalabzug für Steuern + KV/PV"
              value={deduction * 100}
              onChange={(v) => v !== undefined && setDeduction(v / 100)}
              unit="%"
              min={PENSION_DEDUCTION_RANGE.min * 100}
              max={PENSION_DEDUCTION_RANGE.max * 100}
              hint="20 % = Faustformel Finanztip (mittlere Rente). 12 % bei niedriger Rente, 30 %+ bei höherer Rente mit Nebeneinkünften."
            />

            {yearsToRetirement <= 0 && (
              <p className="font-mono text-[10.5px] uppercase tracking-instrument text-brick-700">
                ▲ Bitte erst Schritt 01 (Alter &amp; Renteneintritt) ausfüllen
              </p>
            )}

            {projection && grossWithoutAdjustment !== undefined && (
              <div className="border border-ink-100 bg-paper-50 px-4 py-3">
                <p className="eyebrow-muted">Hochrechnung</p>
                <dl className="mt-2 divide-y divide-ink-100 font-mono text-[12px] text-ink-700">
                  <CalcRow
                    label="Brutto ohne Anpassung"
                    value={formatEUR(grossWithoutAdjustment)}
                  />
                  <CalcRow
                    label={`× (1 + ${formatPercent(raise)})^${yearsToRetirement}`}
                    value={`${formatEUR(projection.grossNominal)} brutto in ${yearsToRetirement} J.`}
                  />
                  <CalcRow
                    label={`− ${formatPercent(deduction)} Steuern + KV/PV`}
                    value={`${formatEUR(projection.netNominal)} netto in ${yearsToRetirement} J.`}
                  />
                  <CalcRow
                    label={`÷ Inflation ${formatPercent(inflation)} · ${yearsToRetirement} J.`}
                    value={`${formatEUR(projection.netReal)} heute`}
                    highlight
                  />
                </dl>
                <div className="mt-3 flex justify-end">
                  <Button size="sm" onClick={apply}>
                    Wert übernehmen
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="border-l-[3px] border-mustard-400 bg-paper-50 px-4 py-3">
            <p className="font-mono text-[10.5px] font-medium uppercase tracking-instrument text-mustard-600">
              ◇ Renteninformation gerade nicht zur Hand?
            </p>
            <p className="mt-2 font-sans text-[12.5px] leading-relaxed text-ink-700">
              Ohne deinen Wert rechnen wir mit{" "}
              <strong className="font-mono">{formatEUR(fallbackEstimate)} / Monat</strong> —
              pauschal {formatPercent(PENSION_DEFAULTS.statePensionFactor)} deines Netto-Einkommens.
              Diese Faustformel ist <em>sehr</em> grob; gerade bei kürzeren Erwerbsbiografien oder
              höheren Einkommen kann der echte Wert deutlich abweichen.
            </p>
            <p className="mt-2 font-sans text-[12.5px] leading-relaxed text-ink-500">
              Du kannst trotzdem weitermachen, das Ergebnis ist dann eine Schätzung — die Renteninfo
              solltest du nachreichen, sobald du sie hast.
            </p>
          </div>
        </>
      )}
    </div>
  );
}

function CalcRow({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <dt className="text-ink-500">{label}</dt>
      <dd
        className={[
          "tabular-nums",
          highlight ? "font-semibold text-mustard-600" : "font-medium text-ink-900",
        ].join(" ")}
      >
        {value}
      </dd>
    </div>
  );
}
