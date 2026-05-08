import { useState } from "react";
import { NumberInput } from "../../../components/NumberInput";
import { Button } from "../../../components/ui/Button";
import { Select } from "../../../components/ui/Select";
import { Field } from "../../../components/ui/Field";
import { InfoTooltip } from "../../../components/InfoTooltip";
import { AssetsManager } from "../../../components/AssetsManager";
import { AllocationManager } from "../../../components/AllocationManager";
import { useProfile, setProfile } from "../../../lib/profile/useProfile";
import { PENSION_DEFAULTS } from "../defaults";
import { formatEUR } from "../../../lib/format";
import { pensionStore, PENSION_MODULE_DEFAULTS } from "../state";
import { tooltips } from "../tooltips";

export function AssumptionsStep() {
  const [open, setOpen] = useState(false);
  const profile = useProfile();
  const m = pensionStore.useState();

  const autoStatePension = (profile.netIncomeMonthly ?? 0) * PENSION_DEFAULTS.statePensionFactor;

  return (
    <div className="space-y-4">
      <div className="border-l-[3px] border-mustard-400 bg-paper-50 px-4 py-3">
        <p className="eyebrow-muted">Standard-Annahmen aktiv</p>
        <p className="mt-1.5 font-sans text-[13px] leading-relaxed text-ink-700">
          Konservative Finanztip-Methodik: gemischtes Portfolio,{" "}
          <span className="font-mono">3 %</span> real Anspar,{" "}
          <span className="font-mono">1 %</span> real Auszahl, Annuität über{" "}
          <span className="font-mono">30 Jahre</span>. Du kannst alle Annahmen unten frei anpassen
          — inklusive Auszahlungsmethode und Anlage-Allokation.
        </p>
      </div>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="font-mono text-[11px] font-medium uppercase tracking-instrument text-mustard-600 hover:underline underline-offset-4 decoration-2"
      >
        {open ? "▾ Annahmen ausblenden" : "▸ Annahmen anpassen"}
      </button>

      {open && (
        <div className="space-y-6">
          <Section title="Erwartete gesetzliche Rente">
            <p className="font-sans text-[12px] leading-relaxed text-ink-500">
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
              label="So wird das Kapital im Ruhestand verbraucht"
              adornment={<InfoTooltip content={tooltips.payoutMethod} label="Erklärung Methode" />}
            >
              {(id) => (
                <Select
                  id={id}
                  value={m.payoutMethod}
                  onChange={(e) =>
                    pensionStore.set({
                      payoutMethod: e.target.value as "annuity" | "safe-withdrawal",
                    })
                  }
                >
                  <option value="annuity">Annuität — Vermögen über X Jahre aufbrauchen</option>
                  <option value="safe-withdrawal">Sichere Entnahmerate — feste % pro Jahr (Vermögen reicht unbegrenzt)</option>
                </Select>
              )}
            </Field>
            <p className="border-l-[2px] border-ink-100 pl-3 font-sans text-[12px] leading-relaxed text-ink-500">
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
              <NumberInput
                label="Sichere Entnahmerate"
                value={m.safeWithdrawalRate * 100}
                onChange={(v) =>
                  v !== undefined && pensionStore.set({ safeWithdrawalRate: v / 100 })
                }
                unit="%"
                min={0.5}
                max={10}
                tooltip={tooltips.safeWithdrawalRate}
                hint="3,5 % gilt als 'sichere Entnahmerate' nach Trinity-Studie"
              />
            )}
          </Section>

          <Section title="Anlage-Allokation in der Sparphase">
            <p className="font-sans text-[12px] leading-relaxed text-ink-500">
              Anteile in %, die du regelmäßig in jede Anlageform investierst. Aus den
              gewichteten realen Renditen ergibt sich die Anspar-Rendite.
            </p>
            <AllocationManager
              allocation={m.savingsAllocation}
              onChange={(savingsAllocation) => pensionStore.set({ savingsAllocation })}
            />
          </Section>

          <Section title="Anlage-Allokation in der Rente">
            <p className="font-sans text-[12px] leading-relaxed text-ink-500">
              Im Alter ist die Aktien-Quote oft niedriger. Hier die geplante
              Allokation während der Auszahlphase.
            </p>
            <AllocationManager
              allocation={m.payoutAllocation}
              onChange={(payoutAllocation) => pensionStore.set({ payoutAllocation })}
            />
          </Section>

          <Section title="Inflation und Steuern">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <NumberInput
                label="Inflation"
                value={m.inflation * 100}
                onChange={(v) =>
                  v !== undefined && pensionStore.set({ inflation: v / 100 })
                }
                unit="%"
                min={0}
                max={20}
                tooltip={tooltips.inflation}
              />
              <NumberInput
                label="Steuer-Puffer auf Kapital"
                value={m.taxBufferPct * 100}
                onChange={(v) =>
                  v !== undefined && pensionStore.set({ taxBufferPct: v / 100 })
                }
                unit="%"
                min={0}
                max={50}
                tooltip={tooltips.taxBufferPct}
                hint="Faustformel Finanzfluss: 10–15 %"
              />
            </div>
          </Section>

          <Section title="Bestehendes Vermögen">
            <p className="font-sans text-[12px] leading-relaxed text-ink-500">{tooltips.existingAssets}</p>
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
      <div className="flex items-baseline gap-2 border-b border-ink-100 pb-2">
        <span aria-hidden className="h-[3px] w-6 bg-mustard-400" />
        <h3 className="font-mono text-[10.5px] font-medium uppercase tracking-instrument text-ink-700">
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
}

