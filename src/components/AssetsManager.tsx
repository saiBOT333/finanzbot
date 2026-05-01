import { Button } from "./ui/Button";
import { Select } from "./ui/Select";
import { Input } from "./ui/Input";
import { NumberInput } from "./NumberInput";
import {
  ASSET_TYPES,
  effectiveRealReturn,
  getAssetTypeDef,
  newAssetId,
  totalAmount,
  type Asset,
  type AssetType,
} from "../lib/assets";
import { formatEUR, formatPercent } from "../lib/format";

type Props = {
  assets: readonly Asset[];
  onChange: (next: Asset[]) => void;
};

export function AssetsManager({ assets, onChange }: Props) {
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
        <p className="rounded-md bg-slate-50 p-3 text-sm text-slate-600 ring-1 ring-slate-200">
          Noch kein Vermögen erfasst. Füg deine größten Positionen hinzu — Tagesgeld,
          ETF-Depot, Festgeld etc. Jede Position wächst bis zur Rente mit ihrer eigenen
          erwarteten Rendite.
        </p>
      ) : (
        <ul className="space-y-2">
          {assets.map((a) => {
            const def = getAssetTypeDef(a.type);
            const r = effectiveRealReturn(a);
            return (
              <li
                key={a.id}
                className="rounded-lg bg-white p-3 ring-1 ring-slate-200"
              >
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
                  <div className="sm:col-span-4">
                    <label className="text-xs font-medium text-slate-600">Bezeichnung</label>
                    <Input
                      value={a.name}
                      onChange={(e) => update(a.id, { name: e.target.value })}
                      placeholder={def.label}
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <label className="text-xs font-medium text-slate-600">Typ</label>
                    <Select
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
                      label="Reale Rendite"
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
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-xs leading-relaxed text-slate-500">{def.hint}</p>
                  <Button
                    variant="ghost"
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

      <div className="flex items-center justify-between">
        <Button variant="secondary" size="sm" onClick={add}>
          + Position hinzufügen
        </Button>
        {assets.length > 0 && (
          <p className="text-sm text-slate-600">
            Summe: <strong className="text-slate-900">{formatEUR(total)}</strong>
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
