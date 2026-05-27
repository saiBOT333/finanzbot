import { useState, type ReactNode } from "react";
import { NumberInput } from "../../../components/NumberInput";
import { Button } from "../../../components/ui/Button";
import { Field } from "../../../components/ui/Field";
import { ChoiceChip } from "../../../components/ui/ChoiceChip";
import { Slider } from "../../../components/ui/Slider";
import { InfoTooltip } from "../../../components/InfoTooltip";
import { AssetsManager } from "../../../components/AssetsManager";
import { AllocationManager } from "../../../components/AllocationManager";
import { useProfile, setProfile } from "../../../lib/profile/useProfile";
import { PENSION_DEFAULTS } from "../defaults";
import { formatEUR, formatPercent } from "../../../lib/format";
import { weightedRealReturn } from "../../../lib/assets";
import { pensionStore, PENSION_MODULE_DEFAULTS } from "../state";
import { tooltips } from "../tooltips";

const pct = (n: number, decimals = 1) =>
  `${n.toFixed(decimals).replace(".", ",")} %`;

export function AssumptionsStep() {
  const [open, setOpen] = useState(false);
  const profile = useProfile();
  const m = pensionStore.useState();

  const autoStatePension = (profile.netIncomeMonthly ?? 0) * PENSION_DEFAULTS.statePensionFactor;

  const savingsReturn = weightedRealReturn(m.savingsAllocation);
  const assetsCount = profile.assets?.length ?? 0;
  const derivedPayoutYears = Math.max(0, m.planningAge - (profile.retirementAge ?? 0));
  const payoutSummary =
    m.payoutMethod === "annuity"
      ? `Annuität · bis Alter ${m.planningAge}`
      : `Sichere Entnahme · ${pct(m.safeWithdrawalRate * 100)}`;

  return (
    <div className="space-y-4">
      <div className="border-l-[3px] border-primary bg-surface-container px-4 py-3">
        <p className="m3-eyebrow-muted">Standard-Annahmen aktiv</p>
        <p className="mt-1.5 font-sans text-[13px] leading-relaxed text-on-surface-variant">
          Konservative Standard-Annahmen: gemischtes Portfolio,{" "}
          <span className="tabular-nums">3 %</span> real Anspar,{" "}
          <span className="tabular-nums">1 %</span> real Auszahl, Annuität über{" "}
          <span className="tabular-nums">30 Jahre</span>,{" "}
          <span className="tabular-nums">12 %</span> Steuer-Puffer. Du kannst alle Annahmen unten
          frei anpassen — inklusive Auszahlungsmethode und Anlage-Allokation.
        </p>
      </div>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-[11px] font-medium uppercase tracking-[0.04em] text-primary hover:underline underline-offset-4 decoration-2"
      >
        {open ? "▾ Annahmen ausblenden" : "▸ Annahmen anpassen"}
      </button>

      {open && (
        <div className="space-y-3">
          <AccordionSection
            title="Ansparen"
            summary={`ø ${formatPercent(savingsReturn)} real`}
          >
            <p className="font-sans text-[12px] leading-relaxed text-on-surface-variant">
              Anteile in %, die du regelmäßig in jede Anlageform investierst. Aus den
              gewichteten realen Renditen ergibt sich die Anspar-Rendite.
            </p>
            <AllocationManager
              allocation={m.savingsAllocation}
              onChange={(savingsAllocation) => pensionStore.set({ savingsAllocation })}
            />
          </AccordionSection>

          <AccordionSection title="Auszahlung" summary={payoutSummary}>
            <Field
              label={
                <span className="inline-flex items-center gap-2">
                  So wird das Kapital im Ruhestand verbraucht
                  <InfoTooltip content={tooltips.payoutMethod} label="Erklärung Methode" />
                </span>
              }
            >
              {() => (
                <div className="flex flex-wrap gap-2">
                  <ChoiceChip
                    selected={m.payoutMethod === "annuity"}
                    onClick={() => pensionStore.set({ payoutMethod: "annuity" })}
                  >
                    Annuität · X Jahre aufbrauchen
                  </ChoiceChip>
                  <ChoiceChip
                    selected={m.payoutMethod === "safe-withdrawal"}
                    onClick={() => pensionStore.set({ payoutMethod: "safe-withdrawal" })}
                  >
                    Sichere Entnahmerate · unbegrenzt
                  </ChoiceChip>
                </div>
              )}
            </Field>
            <p className="border-l-[2px] border-outline-variant pl-3 text-[12px] leading-relaxed text-on-surface-variant">
              {m.payoutMethod === "annuity"
                ? "Annuität: dein Kapital ist nach X Jahren komplett aufgebraucht. Niedrigerer Kapitalbedarf, aber Risiko, dich zu überleben."
                : "Sichere Entnahmerate: du entnimmst jedes Jahr eine feste Quote, das Kapital lebt theoretisch unbegrenzt. Höherer Kapitalbedarf, dafür Sicherheit gegen Langlebigkeitsrisiko."}
            </p>

            {m.payoutMethod === "annuity" ? (
              <div className="space-y-2">
                <NumberInput
                  label="Planen bis Alter"
                  value={m.planningAge}
                  onChange={(v) => v !== undefined && pensionStore.set({ planningAge: v })}
                  unit="Jahre"
                  min={(profile.retirementAge ?? 0) + 1}
                  max={120}
                  tooltip={tooltips.planningAge}
                />
                <p className="text-[11px] tabular-nums text-on-surface-variant">
                  Bei Renteneintritt mit {profile.retirementAge ?? "—"} = {derivedPayoutYears} Jahre Rentenzeit
                </p>
              </div>
            ) : (
              <Slider
                label="Sichere Entnahmerate"
                value={Math.round(m.safeWithdrawalRate * 1000) / 10}
                onChange={(v) => pensionStore.set({ safeWithdrawalRate: v / 100 })}
                min={0.5}
                max={10}
                step={0.1}
                display={pct(Math.round(m.safeWithdrawalRate * 1000) / 10)}
                ariaLabel="Sichere Entnahmerate in Prozent"
              />
            )}

            {m.payoutMethod === "annuity" && (
              <div className="space-y-3 pt-2">
                <p className="font-sans text-[12px] leading-relaxed text-on-surface-variant">
                  Im Alter ist die Aktien-Quote oft niedriger. Hier die geplante
                  Allokation während der Auszahlphase.
                </p>
                <AllocationManager
                  allocation={m.payoutAllocation}
                  onChange={(payoutAllocation) => pensionStore.set({ payoutAllocation })}
                />
              </div>
            )}
          </AccordionSection>

          <AccordionSection
            title="Bestehendes Vermögen"
            summary={assetsCount === 0 ? "Keine" : `${assetsCount} ${assetsCount === 1 ? "Posten" : "Posten"}`}
          >
            <p className="font-sans text-[12px] leading-relaxed text-on-surface-variant">{tooltips.existingAssets}</p>
            <AssetsManager
              assets={profile.assets ?? []}
              onChange={(assets) => setProfile({ assets })}
            />
          </AccordionSection>

          <AccordionSection
            title="Rahmen-Annahmen"
            summary={`Inflation ${pct(m.inflation * 100)} · Steuer ${pct(m.taxBufferPct * 100, 0)}`}
          >
            <div className="space-y-3">
              <p className="font-sans text-[12px] leading-relaxed text-on-surface-variant">
                Aus Schritt 3 übernommen — falls du die gesetzliche Rente hier korrigieren willst:
              </p>
              <NumberInput
                label="Erwartete Netto-Rente (heutige Kaufkraft)"
                value={m.expectedStatePension ?? autoStatePension}
                onChange={(v) =>
                  pensionStore.set({ expectedStatePension: v === undefined ? null : v })
                }
                unit="€"
                min={0}
                tooltip={tooltips.expectedStatePension}
                hint={
                  m.expectedStatePension === null
                    ? `Geschätzt aus deinem Netto (${formatEUR(autoStatePension)} ≈ 48 %). Trag den echten Wert in Schritt 3 ein.`
                    : undefined
                }
              />
            </div>
            <div className="grid grid-cols-1 gap-6 pt-2 sm:grid-cols-2">
              <Slider
                label="Inflation p. a."
                value={Math.round(m.inflation * 1000) / 10}
                onChange={(v) => pensionStore.set({ inflation: v / 100 })}
                min={0}
                max={20}
                step={0.1}
                display={pct(Math.round(m.inflation * 1000) / 10)}
                ariaLabel="Inflation in Prozent pro Jahr"
              />
              <Slider
                label="Steuer-Puffer auf Kapital"
                value={Math.round(m.taxBufferPct * 100)}
                onChange={(v) => pensionStore.set({ taxBufferPct: v / 100 })}
                min={0}
                max={50}
                step={1}
                display={pct(Math.round(m.taxBufferPct * 100), 0)}
                ariaLabel="Steuerpuffer in Prozent"
              />
            </div>
            <p className="text-[12px] text-on-surface-variant">
              Faustformel Finanzfluss: 10–15 % Steuer-Puffer.
            </p>
          </AccordionSection>

          <div className="pt-1">
            <Button
              variant="text"
              size="sm"
              onClick={() => pensionStore.replace(PENSION_MODULE_DEFAULTS)}
            >
              Auf Standard zurücksetzen
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function AccordionSection({
  title,
  summary,
  defaultOpen = false,
  children,
}: {
  title: string;
  summary?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [expanded, setExpanded] = useState(defaultOpen);
  const regionId = `accordion-${title.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <div className="border border-outline-variant">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        aria-controls={regionId}
        className="flex w-full items-center gap-3 bg-surface-container px-3 py-2.5 text-left hover:bg-surface-container-high"
      >
        <span aria-hidden className="font-mono text-[11px] text-on-surface-variant">
          {expanded ? "▾" : "▸"}
        </span>
        <span aria-hidden className="h-[3px] w-6 bg-primary" />
        <h3 className="flex-1 text-[10.5px] font-medium uppercase tracking-[0.04em] text-on-surface-variant">
          {title}
        </h3>
        {summary !== undefined && (
          <span className="font-sans text-[11px] tabular-nums text-on-surface-variant">
            {summary}
          </span>
        )}
      </button>
      {expanded && (
        <div id={regionId} className="space-y-3 px-3 py-3">
          {children}
        </div>
      )}
    </div>
  );
}
