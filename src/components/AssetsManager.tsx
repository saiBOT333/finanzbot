import { Button } from "./ui/Button";
import { Select } from "./ui/Select";
import { Input } from "./ui/Input";
import { Field } from "./ui/Field";
import { NumberInput } from "./NumberInput";
import {
  ASSET_TYPES,
  effectiveRealReturn,
  getAssetTypeDef,
  newAssetId,
  totalAmount,
  type Asset,
  type AssetType,
  type RiskClass,
} from "../lib/assets";
import { formatEUR, formatPercent } from "../lib/format";

type Props = {
  assets: readonly Asset[];
  onChange: (next: Asset[]) => void;
  /** Wenn true, wird je Asset ein Dropdown für riskClassOverride angezeigt. */
  showRiskOverride?: boolean;
};

export function AssetsManager({ assets, onChange, showRiskOverride = false }: Props) {
  const update = (id: string, patch: Partial<Asset>) =>
    onChange(assets.map((a) => (a.id === id ? { ...a, ...patch } : a)));

  const remove = (id: string) => onChange(assets.filter((a) => a.id !== id));

  const add = () => {
    const next: Asset = {
      id: newAssetId(),
      name: defaultNameFor("cash", assets),
      type: "cash",
      amount: 0,
    };
    onChange([...assets, next]);
  };

  const total = totalAmount(assets);

  return (
    <div className="space-y-3">
      {assets.length === 0 ? (
        <p className="border border-outline-variant bg-surface-container p-3 font-sans text-[13px] leading-relaxed text-on-surface-variant">
          Noch kein Vermögen erfasst. Füg deine größten Positionen hinzu — Tagesgeld,
          ETF-Depot, Festgeld etc. Jede Position wächst bis zur Rente mit ihrer eigenen
          erwarteten Rendite.
        </p>
      ) : (
        <ul className="divide-y divide-outline-variant border border-on-surface-variant bg-surface">
          {assets.map((a, i) => {
            const def = getAssetTypeDef(a.type);
            const r = effectiveRealReturn(a);
            return (
              <li key={a.id} className="px-4 py-3">
                <div className="mb-2 flex items-baseline gap-2 text-[10.5px] uppercase tracking-[0.04em] text-on-surface-variant">
                  <span className="text-primary">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span aria-hidden>—</span>
                  <span>Position</span>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
                  <div className="sm:col-span-4">
                    <Field label="Bezeichnung">
                      {(id) => (
                        <Input
                          id={id}
                          value={a.name}
                          onChange={(e) => update(a.id, { name: e.target.value })}
                          placeholder={def.label}
                        />
                      )}
                    </Field>
                  </div>
                  <div className="sm:col-span-3">
                    <Field label="Typ">
                      {(id) => (
                        <Select
                          id={id}
                          value={a.type}
                          onChange={(e) => {
                            const type = e.target.value as AssetType;
                            update(a.id, {
                              type,
                              name:
                                a.name === getAssetTypeDef(a.type).label || a.name === ""
                                  ? getAssetTypeDef(type).label
                                  : a.name,
                              realReturnOverride: undefined,
                            });
                          }}
                        >
                          {ASSET_TYPES.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.label}
                            </option>
                          ))}
                        </Select>
                      )}
                    </Field>
                  </div>
                  <div className="sm:col-span-3">
                    <NumberInput
                      label="Aktueller Wert"
                      value={a.amount}
                      onChange={(v) => update(a.id, { amount: v ?? 0 })}
                      unit="€"
                      min={0}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <NumberInput
                      label="Rendite"
                      value={r * 100}
                      onChange={(v) =>
                        update(a.id, {
                          realReturnOverride: v === undefined ? undefined : v / 100,
                        })
                      }
                      unit="%"
                      min={-5}
                      max={20}
                      hint={
                        a.realReturnOverride === undefined
                          ? `Default ${formatPercent(def.defaultRealReturn)}`
                          : "manuell gesetzt"
                      }
                    />
                  </div>
                </div>
                {showRiskOverride && (
                  <div className="mt-3 sm:max-w-xs">
                    <Field label="Risiko-Einstufung">
                      {(id) => (
                        <Select
                          id={id}
                          value={a.riskClassOverride ?? "default"}
                          onChange={(e) => {
                            const v = e.target.value;
                            update(a.id, {
                              riskClassOverride: v === "default" ? undefined : (v as RiskClass),
                            });
                          }}
                        >
                          <option value="default">Standard (aus Asset-Typ)</option>
                          <option value="risky">Riskant (Aktien)</option>
                          <option value="safe">Sicher (Anleihen/Cash)</option>
                          <option value="excluded">Außerhalb der Quote</option>
                        </Select>
                      )}
                    </Field>
                  </div>
                )}
                <div className="mt-3 flex items-center justify-between gap-3">
                  <p className="font-sans text-[12px] leading-relaxed text-on-surface-variant">
                    {def.hint}
                  </p>
                  <Button
                    variant="text"
                    size="sm"
                    onClick={() => remove(a.id)}
                    aria-label={`Position ${a.name} entfernen`}
                  >
                    Entfernen
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="flex items-center justify-between gap-3">
        <Button variant="outlined" size="sm" onClick={add}>
          + Position hinzufügen
        </Button>
        {assets.length > 0 && (
          <p className="text-[11px] uppercase tracking-[0.04em] text-on-surface-variant">
            Summe ·{" "}
            <strong className="text-on-surface">{formatEUR(total)}</strong>
          </p>
        )}
      </div>
    </div>
  );
}

function defaultNameFor(type: AssetType, existing: readonly Asset[]): string {
  const label = getAssetTypeDef(type).label;
  const sameType = existing.filter((a) => a.type === type).length;
  return sameType === 0 ? label : `${label} ${sameType + 1}`;
}
