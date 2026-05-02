import { Button } from "./ui/Button";
import { Select } from "./ui/Select";
import { NumberInput } from "./NumberInput";
import {
  ASSET_TYPES,
  allocationTotalPercent,
  effectiveRealReturn,
  getAssetTypeDef,
  isAllocationValid,
  newAllocationId,
  weightedRealReturn,
  type Allocation,
  type AllocationEntry,
  type AssetType,
} from "../lib/assets";
import { formatPercent } from "../lib/format";

type Props = {
  allocation: Allocation;
  onChange: (next: Allocation) => void;
  /** Headline shown above the list, e.g. "Sparphase". */
  emptyHint?: string;
};

export function AllocationManager({ allocation, onChange, emptyHint }: Props) {
  const update = (id: string, patch: Partial<AllocationEntry>) =>
    onChange(allocation.map((a) => (a.id === id ? { ...a, ...patch } : a)));

  const remove = (id: string) => onChange(allocation.filter((a) => a.id !== id));

  const add = () => {
    const next: AllocationEntry = {
      id: newAllocationId(),
      type: "etf-world",
      percent: 0,
    };
    onChange([...allocation, next]);
  };

  const totalPercent = allocationTotalPercent(allocation);
  const valid = isAllocationValid(allocation);
  const effective = weightedRealReturn(allocation);

  return (
    <div className="space-y-3">
      {allocation.length === 0 ? (
        <p className="rounded-md bg-slate-50 p-3 text-sm text-slate-600 ring-1 ring-slate-200">
          {emptyHint ?? "Noch keine Allokation gesetzt — füg Anteile in % hinzu."}
        </p>
      ) : (
        <ul className="space-y-2">
          {allocation.map((a) => {
            const def = getAssetTypeDef(a.type);
            const r = effectiveRealReturn(a);
            return (
              <li key={a.id} className="rounded-lg bg-white p-3 ring-1 ring-slate-200">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
                  <div className="sm:col-span-5">
                    <label className="text-xs font-medium text-slate-600">Anlageform</label>
                    <Select
                      value={a.type}
                      onChange={(e) => {
                        const type = e.target.value as AssetType;
                        update(a.id, { type, realReturnOverride: undefined });
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
                      label="Anteil"
                      value={a.percent}
                      onChange={(v) => update(a.id, { percent: v ?? 0 })}
                      unit="%"
                      min={0}
                      max={100}
                    />
                  </div>
                  <div className="sm:col-span-4">
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
                    aria-label={`Position ${def.label} entfernen`}
                  >
                    Entfernen
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Button variant="secondary" size="sm" onClick={add}>
          + Anteil hinzufügen
        </Button>
        <div className="flex flex-col items-end text-sm">
          <span className={valid ? "text-slate-600" : "text-amber-700"}>
            Summe:{" "}
            <strong className="text-slate-900">{formatPercent(totalPercent / 100)}</strong>
            {!valid && allocation.length > 0 && " — muss 100 % ergeben"}
          </span>
          {valid && (
            <span className="text-xs text-slate-500">
              Gewichtete reale Rendite ≈{" "}
              <strong className="text-slate-700">{formatPercent(effective)}</strong>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
