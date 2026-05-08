import { Button } from "./ui/Button";
import { Select } from "./ui/Select";
import { Field } from "./ui/Field";
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
        <p className="border border-ink-100 bg-paper-50 p-3 font-sans text-[13px] text-ink-700">
          {emptyHint ?? "Noch keine Allokation gesetzt — füg Anteile in % hinzu."}
        </p>
      ) : (
        <ul className="divide-y divide-ink-100 border border-ink-900 bg-white">
          {allocation.map((a, i) => {
            const def = getAssetTypeDef(a.type);
            const r = effectiveRealReturn(a);
            return (
              <li key={a.id} className="px-4 py-3">
                <div className="mb-2 flex items-baseline gap-2 font-mono text-[10.5px] uppercase tracking-instrument text-ink-500">
                  <span className="text-mustard-600">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span aria-hidden>—</span>
                  <span>Position</span>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
                  <div className="sm:col-span-5">
                    <Field label="Anlageform">
                      {(id) => (
                        <Select
                          id={id}
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
                      )}
                    </Field>
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
                <div className="mt-3 flex items-center justify-between gap-3">
                  <p className="font-sans text-[12px] leading-relaxed text-ink-500">
                    {def.hint}
                  </p>
                  <Button
                    variant="text"
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

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <Button variant="outlined" size="sm" onClick={add}>
          + Anteil hinzufügen
        </Button>
        <div className="flex flex-col items-start gap-0.5 sm:items-end">
          <span
            className={[
              "font-mono text-[11px] uppercase tracking-instrument",
              valid ? "text-ink-700" : "text-brick-600",
            ].join(" ")}
          >
            Summe ·{" "}
            <strong className="text-ink-900">
              {formatPercent(totalPercent / 100)}
            </strong>
            {!valid && allocation.length > 0 && (
              <span className="ml-1 normal-case">▲ muss 100 % ergeben</span>
            )}
          </span>
          {valid && (
            <span className="font-mono text-[10.5px] uppercase tracking-instrument text-ink-500">
              Gewichtete reale Rendite ≈{" "}
              <strong className="text-mustard-600">{formatPercent(effective)}</strong>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
