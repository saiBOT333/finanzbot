import { useState } from "react";
import { portfolioStore } from "../state";
import { NumberInput } from "../../../components/NumberInput";
import { Button } from "../../../components/ui/Button";
import { FragebogenModal } from "./FragebogenModal";

export function ZielquoteStep() {
  const state = portfolioStore.useState();
  const [showModal, setShowModal] = useState(false);

  const setTarget = (value: number | undefined) => {
    const v = value ?? 0;
    const clamped = Math.max(0, Math.min(100, v));
    portfolioStore.set({ targetEquityPercent: clamped });
  };

  return (
    <div className="space-y-4">
      <p className="font-sans text-sm leading-relaxed text-on-surface-variant">
        Wie viel Prozent deines liquiden Vermögens sollen in Aktien stecken?
        Der Rest landet im Sicherheitsbaustein (Cash, Anleihen, Geldmarkt).
      </p>

      <div className="flex items-end gap-4">
        <div className="flex-1">
          <label className="mb-1 flex justify-between text-[12px] uppercase tracking-[0.04em] text-on-surface-variant">
            <span className="text-error">Aktien (Risiko)</span>
            <span className="text-success">Sicher</span>
          </label>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={state.targetEquityPercent}
            onChange={(e) => setTarget(Number(e.target.value))}
            className="m3-slider"
            style={{
              background: `linear-gradient(to right, var(--m3-error) 0%, var(--m3-error) ${state.targetEquityPercent}%, var(--m3-success) ${state.targetEquityPercent}%, var(--m3-success) 100%)`,
            }}
            aria-label="Gewünschte Aktienquote"
          />
        </div>
        <div className="w-32">
          <NumberInput
            label="Wert"
            value={state.targetEquityPercent}
            onChange={setTarget}
            unit="%"
            min={0}
            max={100}
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="outlined" onClick={() => setShowModal(true)}>
          Quote vorschlagen lassen
        </Button>
        {state.fragebogen && (
          <span className="text-xs text-on-surface-variant">
            Vorschlag aus Fragebogen aktiv — Slider übernommen.
          </span>
        )}
      </div>

      {showModal && (
        <FragebogenModal
          initial={state.fragebogen}
          onCancel={() => setShowModal(false)}
          onApply={(antworten, empfehlung) => {
            portfolioStore.set({
              fragebogen: antworten,
              targetEquityPercent: empfehlung,
            });
            setShowModal(false);
          }}
        />
      )}
    </div>
  );
}
