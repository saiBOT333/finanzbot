import { useState } from "react";
import { portfolioStore } from "../state";
import { NumberInput } from "../../../components/NumberInput";
import { FragebogenSection } from "./FragebogenSection";

export function ZielquoteStep() {
  const state = portfolioStore.useState();
  const [showFragebogen, setShowFragebogen] = useState(false);

  const setTarget = (value: number | undefined) => {
    const v = value ?? 0;
    const clamped = Math.max(0, Math.min(100, v));
    portfolioStore.set({ targetEquityPercent: clamped });
  };

  return (
    <div className="space-y-4">
      <p className="font-sans text-body-md leading-relaxed text-on-surface-variant">
        Wie viel Prozent deines Geldes soll in Aktien stecken? Der Rest bleibt im sicheren
        Teil (Tagesgeld, Anleihen, Geldmarkt). Mehr Aktien = mehr erwartete Rendite, aber
        stärkere Schwankungen.
      </p>

      <div className="flex items-end gap-4">
        <div className="flex-1">
          <label className="mb-1 flex justify-between text-label-md uppercase tracking-[0.04em] text-on-surface-variant">
            <span>Aktien</span>
            <span>Sicherer Teil</span>
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
              background: `linear-gradient(to right, var(--m3-primary) 0%, var(--m3-primary) ${state.targetEquityPercent}%, var(--m3-outline-variant) ${state.targetEquityPercent}%, var(--m3-outline-variant) 100%)`,
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

      <button
        type="button"
        onClick={() => setShowFragebogen((v) => !v)}
        className="inline-flex items-center gap-1 text-label-md font-medium uppercase tracking-[0.04em] text-primary hover:underline underline-offset-4 decoration-2"
      >
        <span aria-hidden className="m3-icon text-[16px] leading-none">
          {showFragebogen ? "expand_more" : "chevron_right"}
        </span>
        {showFragebogen
          ? "Fragebogen ausblenden"
          : "Unsicher? Quote vorschlagen lassen — 5 kurze Fragen"}
      </button>

      {!showFragebogen && state.fragebogen && (
        <p className="text-body-sm text-on-surface-variant">
          Vorschlag aus Fragebogen aktiv — Slider übernommen.
        </p>
      )}

      {showFragebogen && (
        <FragebogenSection
          initial={state.fragebogen}
          onApply={(antworten, empfehlung) => {
            portfolioStore.set({
              fragebogen: antworten,
              targetEquityPercent: empfehlung,
            });
            setShowFragebogen(false);
          }}
        />
      )}
    </div>
  );
}
