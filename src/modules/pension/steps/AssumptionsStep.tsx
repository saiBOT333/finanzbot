import { useState } from "react";
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
import { formatEUR } from "../../../lib/format";
import { pensionStore, PENSION_MODULE_DEFAULTS } from "../state";
import { tooltips } from "../tooltips";

const pct = (n: number, decimals = 1) =>
  `${n.toFixed(decimals).replace(".", ",")} %`;

export function AssumptionsStep() {
  const [open, setOpen] = useState(false);
  const profile = useProfile();
  const m = pensionStore.useState();

  const autoStatePension = (profile.netIncomeMonthly ?? 0) * PENSION_DEFAULTS.statePensionFactor;

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
        <div className="space-y-6">
          <Section title="Erwartete gesetzliche Rente">
            <p className="font-sans text-[12px] leading-relaxed text-on-surface-variant">
              Aus Schritt 3 übernommen — falls du sie hier korrigieren willst:
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
          </Section>

          <Section title="Berechnungsmethode">
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
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <NumberInput
                  label="Rentenbezugsdauer"
                  value={m.payoutYears}
                  onChange={(v) => v !== undefined && pensionStore.set({ payoutYears: v })}
                  unit="Jahre"
                  min={1}
                  max={60}
                  tooltip={tooltips.payoutYears}
                />
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
          </Section>

          <Section title="Anlage-Allokation in der Sparphase">
            <p className="font-sans text-[12px] leading-relaxed text-on-surface-variant">
              Anteile in %, die du regelmäßig in jede Anlageform investierst. Aus den
              gewichteten realen Renditen ergibt sich die Anspar-Rendite.
            </p>
            <AllocationManager
              allocation={m.savingsAllocation}
              onChange={(savingsAllocation) => pensionStore.set({ savingsAllocation })}
            />
          </Section>

          {m.payoutMethod === "annuity" && (
            <Section title="Anlage-Allokation in der Rente">
              <p className="font-sans text-[12px] leading-relaxed text-on-surface-variant">
                Im Alter ist die Aktien-Quote oft niedriger. Hier die geplante
                Allokation während der Auszahlphase.
              </p>
              <AllocationManager
                allocation={m.payoutAllocation}
                onChange={(payoutAllocation) => pensionStore.set({ payoutAllocation })}
              />
            </Section>
          )}

          <Section title="Inflation und Steuern">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
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
          </Section>

          <Section title="Bestehendes Vermögen">
            <p className="font-sans text-[12px] leading-relaxed text-on-surface-variant">{tooltips.existingAssets}</p>
            <AssetsManager
              assets={profile.assets ?? []}
              onChange={(assets) => setProfile({ assets })}
            />
          </Section>

          <div>
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div className="flex items-baseline gap-2 border-b border-outline-variant pb-2">
        <span aria-hidden className="h-[3px] w-6 bg-primary" />
        <h3 className="text-[10.5px] font-medium uppercase tracking-[0.04em] text-on-surface-variant">
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
}

