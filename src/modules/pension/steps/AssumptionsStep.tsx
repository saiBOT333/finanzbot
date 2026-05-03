import { useState } from "react";
import { NumberInput } from "../../../components/NumberInput";
import { Button } from "../../../components/ui/Button";
import { Select } from "../../../components/ui/Select";
import { InfoTooltip } from "../../../components/InfoTooltip";
import { AssetsManager } from "../../../components/AssetsManager";
import { AllocationManager } from "../../../components/AllocationManager";
import { useProfile, setProfile } from "../../../lib/profile/useProfile";
import { PENSION_DEFAULTS, projectedNetPensionToday } from "../defaults";
import {
  PENSION_DEDUCTION_RANGE,
  PENSION_GROSS_TO_NET_DEDUCTION,
  PENSION_RAISE_DEFAULT,
  PENSION_RAISE_RANGE,
} from "../constants";
import { formatEUR, formatPercent } from "../../../lib/format";
import { pensionStore, PENSION_MODULE_DEFAULTS } from "../state";
import { PRESETS, detectActivePreset, type PresetId } from "../presets";
import { tooltips } from "../tooltips";

export function AssumptionsStep() {
  const [open, setOpen] = useState(false);
  const profile = useProfile();
  const m = pensionStore.useState();
  const activePresetId = detectActivePreset(m);

  const autoStatePension = (profile.netIncomeMonthly ?? 0) * PENSION_DEFAULTS.statePensionFactor;
  const statePensionValue = m.expectedStatePension ?? autoStatePension;

  const applyPreset = (id: PresetId) => {
    const preset = PRESETS.find((p) => p.id === id);
    if (!preset) return;
    pensionStore.replace({
      ...preset.state,
      expectedStatePension: m.expectedStatePension,
    });
  };

  const activePreset = activePresetId
    ? PRESETS.find((p) => p.id === activePresetId) ?? null
    : null;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="text-sm font-medium text-slate-800">Profil wählen</p>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => {
            const active = p.id === activePresetId;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => applyPreset(p.id)}
                className={[
                  "rounded-full px-3 py-1.5 text-sm transition-colors",
                  active
                    ? "bg-brand-600 text-white"
                    : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50",
                ].join(" ")}
                aria-pressed={active}
              >
                {p.label}
                <span className={`ml-1 text-xs ${active ? "text-white/80" : "text-slate-400"}`}>
                  · {p.source}
                </span>
              </button>
            );
          })}
        </div>
        <p className="text-xs text-slate-500">
          {activePreset
            ? activePreset.description
            : "Eigene Einstellungen — du hast die Standardannahmen unten manuell angepasst."}
        </p>
      </div>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-sm font-medium text-brand-700 hover:underline"
      >
        {open ? "Annahmen ausblenden" : "Annahmen anpassen"}
      </button>

      {open && (
        <div className="space-y-6">
          <Section title="Gesetzliche Rente">
            <NumberInput
              label="Erwartete Netto-Rente (heutige Kaufkraft)"
              value={statePensionValue}
              onChange={(v) =>
                pensionStore.set({ expectedStatePension: v === undefined ? null : v })
              }
              unit="€"
              min={0}
              tooltip={tooltips.expectedStatePension}
              hint={
                m.expectedStatePension === null
                  ? "Aus dem Netto geschätzt – mit deiner Renteninformation überschreiben"
                  : undefined
              }
            />
            <RenteninfoHelfer
              inflation={m.inflation}
              yearsToRetirement={Math.max(
                0,
                (profile.retirementAge ?? PENSION_DEFAULTS.retirementAge) - (profile.age ?? 0),
              )}
              onApplyNet={(net) =>
                pensionStore.set({ expectedStatePension: Math.round(net) })
              }
            />
          </Section>

          <Section title="Berechnungsmethode">
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-800">
                <span>So wird das Kapital im Ruhestand verbraucht</span>
                <InfoTooltip content={tooltips.payoutMethod} label="Erklärung Methode" />
              </label>
              <Select
                value={m.payoutMethod}
                onChange={(e) =>
                  pensionStore.set({
                    payoutMethod: e.target.value as "annuity" | "safe-withdrawal",
                  })
                }
              >
                <option value="annuity">Annuität — Vermögen über X Jahre aufbrauchen (Finanztip)</option>
                <option value="safe-withdrawal">Sichere Entnahmerate — feste % pro Jahr (Finanzfluss)</option>
              </Select>
            </div>

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
            <p className="text-xs leading-relaxed text-slate-600">
              Anteile in %, die du regelmäßig in jede Anlageform investierst. Aus den
              gewichteten realen Renditen ergibt sich die Anspar-Rendite. Standardmäßig
              passend zum gewählten Profil — du kannst sie individuell anpassen.
            </p>
            <AllocationManager
              allocation={m.savingsAllocation}
              onChange={(savingsAllocation) => pensionStore.set({ savingsAllocation })}
            />
          </Section>

          <Section title="Anlage-Allokation in der Rente">
            <p className="text-xs leading-relaxed text-slate-600">
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
            <p className="text-xs leading-relaxed text-slate-600">{tooltips.existingAssets}</p>
            <AssetsManager
              assets={profile.assets ?? []}
              onChange={(assets) => setProfile({ assets })}
            />
          </Section>

          <div>
            <Button
              variant="ghost"
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
      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</h3>
      {children}
    </div>
  );
}

/**
 * Helper that projects the "voraussichtliche Regelaltersrente OHNE Anpassung"
 * from the Renteninformation letter into a net pension in today's purchasing
 * power. Pipeline: gross × (1 + raise)^years − deduction → discount by inflation.
 * The user picks both the raise and the deduction percentage so the helper
 * adapts to their personal situation rather than relying on Finanztip's
 * one-size-fits-all averages.
 */
function RenteninfoHelfer({
  inflation,
  yearsToRetirement,
  onApplyNet,
}: {
  inflation: number;
  yearsToRetirement: number;
  onApplyNet: (net: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [grossWithoutAdjustment, setGrossWithoutAdjustment] = useState<number | undefined>();
  const [raise, setRaise] = useState<number>(PENSION_RAISE_DEFAULT);
  const [deduction, setDeduction] = useState<number>(PENSION_GROSS_TO_NET_DEDUCTION);

  const ready = grossWithoutAdjustment !== undefined && yearsToRetirement > 0;
  const result = ready
    ? projectedNetPensionToday(grossWithoutAdjustment!, raise, deduction, inflation, yearsToRetirement)
    : undefined;

  return (
    <div className="rounded-lg bg-slate-50 p-3 ring-1 ring-slate-200">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-xs font-medium text-brand-700 hover:underline"
      >
        {open ? "Renteninformations-Helfer schließen" : "Aus Renteninformation ausrechnen"}
      </button>
      {open && (
        <div className="mt-3 space-y-3">
          <p className="text-xs leading-relaxed text-slate-600">
            Such auf deinem Renteninfo-Brief den Wert{" "}
            <strong>„voraussichtliche Regelaltersrente, wenn Sie wie bisher Beiträge zahlen"</strong>{" "}
            — das ist der <em>ohne Anpassung</em>-Wert, meist in der Tabelle direkt unter dem
            heutigen Rentenwert. Anschließend wählst du selbst, wie viel jährliche Rentenanpassung
            du erwartest und wie hoch deine spätere Steuer- und KV-Belastung sein wird. Wir
            rechnen daraus die Netto-Rente in heutiger Kaufkraft.
          </p>
          <NumberInput
            label="Brutto-Rente ohne Anpassung (heutiger Rentenwert)"
            value={grossWithoutAdjustment}
            onChange={setGrossWithoutAdjustment}
            unit="€"
            min={0}
            placeholder="z. B. 1.988"
          />
          <NumberInput
            label="Erwartete jährliche Rentenanpassung"
            value={raise * 100}
            onChange={(v) => v !== undefined && setRaise(v / 100)}
            unit="%"
            min={PENSION_RAISE_RANGE.min * 100}
            max={PENSION_RAISE_RANGE.max * 100}
            hint="Finanztip-Faustformel: 1,5 % (Mitte zwischen den DRV-Hochrechnungen 1 % und 2 %). Wer pessimistisch plant, geht eher Richtung 1 %."
          />
          <NumberInput
            label="Pauschalabzug für Steuern + KV/PV"
            value={deduction * 100}
            onChange={(v) => v !== undefined && setDeduction(v / 100)}
            unit="%"
            min={PENSION_DEDUCTION_RANGE.min * 100}
            max={PENSION_DEDUCTION_RANGE.max * 100}
            hint="12 % = nur Sozialabgaben (geringe Rente, nur Rente als Einkommen). 20 % = Faustformel Finanztip (mittlere Rente). 30 %+ = höhere Rente mit Nebeneinkünften."
          />
          {yearsToRetirement <= 0 && (
            <p className="text-xs text-amber-700">
              Bitte erst Schritt 1 (Alter & Renteneintritt) ausfüllen — wir brauchen die Jahre bis
              zur Rente, um die Anpassung und Inflation hochzurechnen.
            </p>
          )}
          {result !== undefined && grossWithoutAdjustment !== undefined && (
            <div className="space-y-2 rounded bg-white px-3 py-2 text-sm ring-1 ring-slate-200">
              <div className="space-y-1 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Brutto ohne Anpassung</span>
                  <strong className="text-slate-900">{formatEUR(grossWithoutAdjustment)}</strong>
                </div>
                <div className="flex justify-between">
                  <span>
                    × (1 + {formatPercent(raise)})<sup>{yearsToRetirement}</sup> Anpassung
                  </span>
                  <strong className="text-slate-900">
                    {formatEUR(result.grossNominal)} brutto in {yearsToRetirement} Jahren
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span>− {formatPercent(deduction)} Steuern und KV/PV</span>
                  <strong className="text-slate-900">
                    {formatEUR(result.netNominal)} netto in {yearsToRetirement} Jahren
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span>
                    ÷ Inflation {formatPercent(inflation)} über {yearsToRetirement} Jahre
                  </span>
                  <strong className="text-slate-900">
                    {formatEUR(result.netReal)} heutige Kaufkraft
                  </strong>
                </div>
              </div>
              <div className="flex items-center justify-end pt-1">
                <Button size="sm" onClick={() => onApplyNet(result.netReal)}>
                  Übernehmen
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
