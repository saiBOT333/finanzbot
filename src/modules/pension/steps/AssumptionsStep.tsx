import { useState } from "react";
import { NumberInput } from "../../../components/NumberInput";
import { Button } from "../../../components/ui/Button";
import { Select } from "../../../components/ui/Select";
import { InfoTooltip } from "../../../components/InfoTooltip";
import { AssetsManager } from "../../../components/AssetsManager";
import { useProfile, setProfile } from "../../../lib/profile/useProfile";
import { PENSION_DEFAULTS, grossPensionToNet } from "../defaults";
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
                <NumberInput
                  label="Reale Rendite im Ruhestand"
                  value={m.payoutRealReturn * 100}
                  onChange={(v) =>
                    v !== undefined && pensionStore.set({ payoutRealReturn: v / 100 })
                  }
                  unit="%"
                  min={0}
                  max={20}
                  tooltip={tooltips.payoutRealReturn}
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

          <Section title="Renditen, Inflation und Steuern">
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
                label="Reale Rendite in der Sparphase"
                value={m.realReturn * 100}
                onChange={(v) =>
                  v !== undefined && pensionStore.set({ realReturn: v / 100 })
                }
                unit="%"
                min={0}
                max={20}
                tooltip={tooltips.realReturn}
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
 * Helper that converts a gross pension value (as printed on the Renteninformation
 * letter) to a net pension via Finanztip's 20 % rule of thumb, then writes it
 * to the parent input.
 */
function RenteninfoHelfer({ onApplyNet }: { onApplyNet: (net: number) => void }) {
  const [open, setOpen] = useState(false);
  const [grossLow, setGrossLow] = useState<number | undefined>();
  const [grossHigh, setGrossHigh] = useState<number | undefined>();

  const mid = grossLow !== undefined && grossHigh !== undefined ? (grossLow + grossHigh) / 2 : undefined;
  const net = mid !== undefined ? grossPensionToNet(mid) : undefined;

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
            Auf deiner Renteninformation findest du zwei Hochrechnungen für die Brutto-Rente:
            eine bei 1 % und eine bei 2 % Rentensteigerung. Wir bilden den Mittelwert (entspricht
            ~1,5 % Steigerung) und ziehen 20 % für Steuern und Krankenversicherung ab — Standardweg
            laut Finanztip.
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <NumberInput
              label="Brutto bei 1 % Rentensteigerung"
              value={grossLow}
              onChange={setGrossLow}
              unit="€"
              min={0}
            />
            <NumberInput
              label="Brutto bei 2 % Rentensteigerung"
              value={grossHigh}
              onChange={setGrossHigh}
              unit="€"
              min={0}
            />
          </div>
          {net !== undefined && (
            <div className="flex items-center justify-between rounded bg-white px-3 py-2 text-sm ring-1 ring-slate-200">
              <span className="text-slate-600">
                Mittel {Math.round(mid!)} € brutto · −20 % ={" "}
                <strong className="text-slate-900">{Math.round(net)} €</strong> netto
              </span>
              <Button size="sm" onClick={() => onApplyNet(net)}>
                Übernehmen
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
