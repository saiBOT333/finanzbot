import { NumberInput } from "../../../components/NumberInput";
import { Button } from "../../../components/ui/Button";
import { formatEUR, formatPercent } from "../../../lib/format";
import { useProfile } from "../../../lib/profile/useProfile";
import { PENSION_DEFAULTS, deriveExpectedStatePension, regelaltersgrenze } from "../defaults";
import {
  PENSION_DEDUCTION_RANGE,
  PENSION_RAISE_RANGE,
  STATE_PENSION_MIN_CLAIM_AGE,
} from "../constants";
import { pensionStore, type PensionInfoInputs } from "../state";

/**
 * Wizard step 3: capture the user's expected statutory pension from the
 * "Renteninformation" letter sent by the DRV every year. This is the most
 * important input after age/income — without it the tool falls back to the
 * 48 %-of-net rule of thumb, which can be off by hundreds of Euros.
 */
export function PensionInformationStep() {
  const profile = useProfile();
  const m = pensionStore.useState();

  const retirementAge = profile.retirementAge ?? PENSION_DEFAULTS.retirementAge;
  const currentYear = new Date().getFullYear();
  // Je nach Geburtstag bis zu 1 Jahrgang daneben — kostet bei der
  // Regelaltersgrenze maximal 2 Monate, bewusst kein eigenes Eingabefeld.
  const birthYear = profile.age !== undefined ? currentYear - profile.age : undefined;
  const regelalter = birthYear !== undefined ? regelaltersgrenze(birthYear) : PENSION_DEFAULTS.retirementAge;
  const contributionStartAge = m.contributionStartAge;

  const formatYearsDiff = (years: number): string => {
    const rounded = Math.round(years * 12) / 12;
    if (Number.isInteger(rounded)) return `${rounded.toFixed(0)} J.`;
    const months = Math.round(years * 12);
    return `${months} Mon.`;
  };

  const yearsToRetirement = Math.max(
    0,
    (profile.retirementAge ?? PENSION_DEFAULTS.retirementAge) - (profile.age ?? 0),
  );
  const netIncome = profile.netIncomeMonthly ?? 0;

  // Rohwerte liegen persistiert im Modul-State; die Netto-Rente wird daraus
  // live abgeleitet — Änderungen an Renteneintritt/Inflation schlagen durch.
  const { grossWithoutAdjustment, raise, deduction } = m.pensionInfo;
  const setInfo = (patch: Partial<PensionInfoInputs>) =>
    pensionStore.set({ pensionInfo: { ...m.pensionInfo, ...patch } });

  // Bei aktivem Override ist das Formular ausgeblendet — derived.projection
  // wird also genau dann gebraucht, wenn die Renteninfo-Quelle aktiv ist.
  const projection = deriveExpectedStatePension(profile, m, currentYear).projection;

  const fallbackEstimate = netIncome * PENSION_DEFAULTS.statePensionFactor;
  const stored = m.expectedStatePension;
  const hasOverride = stored !== null;

  const clearOverride = () => pensionStore.set({ expectedStatePension: null });
  const clearGross = () => setInfo({ grossWithoutAdjustment: null });

  return (
    <div className="space-y-5">
      <p className="font-sans text-[14px] leading-relaxed text-on-surface-variant">
        Die Deutsche Rentenversicherung schickt dir jedes Jahr eine{" "}
        <strong className="font-semibold">Renteninformation</strong> — darin steht, wie hoch deine
        Rente voraussichtlich wird. Trag den Wert hier ein, damit das Tool deine echte Lücke
        berechnen kann statt nur eine Faustformel anzuwenden.
      </p>

      {hasOverride && (
        <div className="border-l-[3px] border-success bg-surface-container px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="m3-eyebrow-muted">Manueller Wert aktiv</p>
              <p className="mt-1 text-xl font-semibold tabular-nums text-on-surface">
                {formatEUR(stored)}
                <span className="ml-1.5 font-sans text-[11px] uppercase tracking-[0.04em] text-on-surface-variant">
                  / Monat · heute
                </span>
              </p>
              <p className="mt-1.5 font-sans text-[11.5px] leading-relaxed text-on-surface-variant">
                Die Rente wurde manuell festgelegt (Annahmen, Schritt 04) — Eingaben aus diesem
                Schritt werden ignoriert, bis du den Wert löschst.
              </p>
            </div>
            <Button variant="text" size="sm" onClick={clearOverride}>
              Ändern
            </Button>
          </div>
        </div>
      )}

      {!hasOverride && (
        <>
          {retirementAge >= regelalter && (
            <div className="border-l-[3px] border-outline-variant bg-surface-container px-3 py-2">
              <p className="font-sans text-[11.5px] leading-relaxed text-on-surface-variant">
                Du gehst zur Regelaltersgrenze ({Number.isInteger(regelalter) ? regelalter : regelalter.toFixed(1)}) oder später in Rente —
                keine Abschläge, kein Beitragsjahre-Abschlag in der Hochrechnung. Die
                Regelaltersgrenze schätzen wir aus deinem Jahrgang (auf das Kalenderjahr genau).
              </p>
            </div>
          )}
          <div className="space-y-4 border border-on-surface-variant bg-surface p-4">
            <p className="font-sans text-[12.5px] leading-relaxed text-on-surface-variant">
              Such auf dem Renteninfo-Brief den Wert{" "}
              <strong className="font-semibold">
                „voraussichtliche Regelaltersrente, wenn Sie wie bisher Beiträge zahlen"
              </strong>{" "}
              — das ist der <em>ohne Anpassung</em>-Wert, meist in der Tabelle direkt unter dem
              heutigen Rentenwert. Wir rechnen die Anpassung und Inflation für dich raus.
            </p>
            <NumberInput
              label="Brutto-Rente ohne Anpassung (heutiger Rentenwert)"
              value={grossWithoutAdjustment ?? undefined}
              onChange={(v) => setInfo({ grossWithoutAdjustment: v ?? null })}
              unit="€"
              min={0}
              required
              placeholder="z. B. 1.988"
            />
            <NumberInput
              label="Erwartete jährliche Rentenanpassung"
              value={raise * 100}
              onChange={(v) => v !== undefined && setInfo({ raise: v / 100 })}
              unit="%"
              min={PENSION_RAISE_RANGE.min * 100}
              max={PENSION_RAISE_RANGE.max * 100}
              hint="Finanztip-Faustformel: 1,5 % (Mitte zwischen den DRV-Hochrechnungen 1 % und 2 %). Pessimistisch eher Richtung 1 %."
            />
            <NumberInput
              label="Pauschalabzug für Steuern + KV/PV"
              value={deduction * 100}
              onChange={(v) => v !== undefined && setInfo({ deduction: v / 100 })}
              unit="%"
              min={PENSION_DEDUCTION_RANGE.min * 100}
              max={PENSION_DEDUCTION_RANGE.max * 100}
              hint="20 % = Faustformel Finanztip (mittlere Rente). 12 % bei niedriger Rente, 30 %+ bei höherer Rente mit Nebeneinkünften."
            />

            <details className="pt-1">
              <summary className="cursor-pointer text-[11px] font-medium uppercase tracking-[0.04em] text-primary hover:underline underline-offset-4 decoration-2">
                ▸ Abweichende Erwerbsbiografie?
              </summary>
              <div className="mt-3 space-y-2">
                <NumberInput
                  label="Beitragsbeginn (Alter)"
                  value={contributionStartAge}
                  onChange={(v) =>
                    v !== undefined && pensionStore.set({ contributionStartAge: v })
                  }
                  unit="Jahre"
                  min={14}
                  max={Math.max(14, retirementAge - 1)}
                  hint="Default 20: durchgängig ab Ausbildung/Studium gerechnet. Höher setzen bei Spätstart in DRV-Pflichteinzahlung (z. B. langes Studium, Selbstständigkeit, Auslandsjahre)."
                />
                <p className="text-[11px] text-on-surface-variant">
                  Wirkt sich auf den Beitragsjahre-Faktor in der Hochrechnung aus.
                </p>
              </div>
            </details>

            {projection && grossWithoutAdjustment !== null && (
              <div className="border-l-[3px] border-success bg-surface-container px-4 py-3">
                <p className="m3-eyebrow-muted">Hochrechnung · fließt live ins Ergebnis ein</p>
                <dl className="mt-2 divide-y divide-outline-variant text-[12px] text-on-surface-variant">
                  <CalcRow
                    label="Brutto ohne Anpassung"
                    value={formatEUR(grossWithoutAdjustment)}
                  />
                  {projection.abschlagPct > 0 && (
                    <CalcRow
                      label={`− ${formatPercent(projection.abschlagPct)} Abschlag (${formatYearsDiff(regelalter - Math.max(retirementAge, STATE_PENSION_MIN_CLAIM_AGE))} vorzeitig, Anspruch ab ${STATE_PENSION_MIN_CLAIM_AGE})`}
                      value={`${formatEUR(grossWithoutAdjustment * (1 - projection.abschlagPct))} brutto`}
                    />
                  )}
                  {projection.beitragsFaktor < 1 && (
                    <CalcRow
                      label={`× ${formatPercent(projection.beitragsFaktor)} Beitragsjahre (${formatYearsDiff(retirementAge - contributionStartAge)}/${formatYearsDiff(regelalter - contributionStartAge)})`}
                      value={`${formatEUR(projection.grossAdjusted)} brutto angepasst`}
                    />
                  )}
                  <CalcRow
                    label={`× (1 + ${formatPercent(raise)})^${yearsToRetirement}`}
                    value={`${formatEUR(projection.grossNominal)} brutto in ${yearsToRetirement} J.`}
                  />
                  <CalcRow
                    label={`− ${formatPercent(deduction)} Steuern + KV/PV`}
                    value={`${formatEUR(projection.netNominal)} netto in ${yearsToRetirement} J.`}
                  />
                  <CalcRow
                    label={`÷ Inflation ${formatPercent(m.inflation)} · ${yearsToRetirement} J.`}
                    value={`${formatEUR(projection.netReal)} heute`}
                    highlight
                  />
                </dl>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <p className="font-sans text-[11.5px] leading-relaxed text-on-surface-variant">
                    Ändern sich Renteneintritt oder Inflation, rechnet das Ergebnis automatisch mit.
                  </p>
                  <Button variant="text" size="sm" onClick={clearGross}>
                    Zurücksetzen
                  </Button>
                </div>
              </div>
            )}
          </div>

          {grossWithoutAdjustment === null && (
          <div className="border-l-[3px] border-primary bg-surface-container px-4 py-3">
            <p className="text-[10.5px] font-medium uppercase tracking-[0.04em] text-primary">
              ◇ Renteninformation gerade nicht zur Hand?
            </p>
            <p className="mt-2 font-sans text-[12.5px] leading-relaxed text-on-surface-variant">
              Ohne deinen Wert rechnen wir mit{" "}
              <strong className="tabular-nums">{formatEUR(fallbackEstimate)} / Monat</strong> —
              pauschal {formatPercent(PENSION_DEFAULTS.statePensionFactor)} deines Netto-Einkommens.
              Diese Faustformel ist <em>sehr</em> grob; gerade bei kürzeren Erwerbsbiografien oder
              höheren Einkommen kann der echte Wert deutlich abweichen.
            </p>
            <p className="mt-2 font-sans text-[12.5px] leading-relaxed text-on-surface-variant">
              Du kannst trotzdem weitermachen, das Ergebnis ist dann eine Schätzung — die Renteninfo
              solltest du nachreichen, sobald du sie hast.
            </p>
          </div>
          )}
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
      <dt className="text-on-surface-variant">{label}</dt>
      <dd
        className={[
          "tabular-nums",
          highlight ? "font-semibold text-primary" : "font-medium text-on-surface",
        ].join(" ")}
      >
        {value}
      </dd>
    </div>
  );
}
