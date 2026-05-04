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
      <p className="text-sm leading-relaxed text-slate-600">
        Die Deutsche Rentenversicherung schickt dir jedes Jahr eine{" "}
        <strong>Renteninformation</strong> — darin steht, wie hoch deine Rente voraussichtlich wird.
        Trag den Wert hier ein, damit das Tool deine echte Lücke berechnen kann statt nur eine
        Faustformel anzuwenden.
      </p>

      {hasStored && (
        <div className="rounded-lg bg-emerald-50 p-3 text-sm ring-1 ring-emerald-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-emerald-900">
                Erwartete Netto-Rente: {formatEUR(stored)} pro Monat
              </p>
              <p className="text-xs text-emerald-800">heutige Kaufkraft</p>
            </div>
            <Button variant="ghost" size="sm" onClick={clear}>
              Ändern
            </Button>
          </div>
        </div>
      )}

      {!hasStored && (
        <>
          <div className="space-y-3 rounded-lg bg-white p-4 ring-1 ring-slate-200">
            <p className="text-xs leading-relaxed text-slate-600">
              Such auf dem Renteninfo-Brief den Wert{" "}
              <strong>„voraussichtliche Regelaltersrente, wenn Sie wie bisher Beiträge zahlen"</strong>{" "}
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
              <p className="text-xs text-amber-700">
                Bitte erst Schritt 1 (Alter & Renteneintritt) ausfüllen — wir brauchen die Jahre bis
                zur Rente, um die Anpassung und Inflation hochzurechnen.
              </p>
            )}

            {projection && grossWithoutAdjustment !== undefined && (
              <div className="space-y-1.5 rounded bg-slate-50 px-3 py-2 text-xs text-slate-700">
                <div className="flex justify-between">
                  <span>Brutto ohne Anpassung</span>
                  <strong className="text-slate-900">
                    {formatEUR(grossWithoutAdjustment)}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span>
                    × (1 + {formatPercent(raise)})<sup>{yearsToRetirement}</sup> Anpassung
                  </span>
                  <strong className="text-slate-900">
                    {formatEUR(projection.grossNominal)} brutto in {yearsToRetirement} Jahren
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span>− {formatPercent(deduction)} Steuern und KV/PV</span>
                  <strong className="text-slate-900">
                    {formatEUR(projection.netNominal)} netto in {yearsToRetirement} Jahren
                  </strong>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-1.5">
                  <span>
                    ÷ Inflation {formatPercent(inflation)} über {yearsToRetirement} Jahre
                  </span>
                  <strong className="text-emerald-700">
                    {formatEUR(projection.netReal)} heutige Kaufkraft
                  </strong>
                </div>
                <div className="flex justify-end pt-1">
                  <Button size="sm" onClick={apply}>
                    Wert übernehmen
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-lg bg-amber-50 p-3 text-xs leading-relaxed text-amber-900 ring-1 ring-amber-200">
            <p className="font-medium">Renteninformation gerade nicht zur Hand?</p>
            <p className="mt-1">
              Ohne deinen Wert rechnen wir mit{" "}
              <strong>{formatEUR(fallbackEstimate)} pro Monat</strong> — pauschal{" "}
              {formatPercent(PENSION_DEFAULTS.statePensionFactor)} deines Netto-Einkommens.
              Diese Faustformel ist <em>sehr</em> grob; gerade bei kürzeren Erwerbsbiografien oder
              höheren Einkommen kann der echte Wert deutlich abweichen.
            </p>
            <p className="mt-2">
              Du kannst trotzdem weitermachen, das Ergebnis ist dann eine Schätzung — und du
              solltest die Renteninfo nachreichen, sobald du sie hast.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
