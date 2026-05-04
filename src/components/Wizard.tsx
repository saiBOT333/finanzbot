import { useState, type ReactNode } from "react";
import { Button } from "./ui/Button";

export type WizardStep = {
  id: string;
  title: string;
  content: ReactNode;
  /** When false, the "Weiter" button is disabled. */
  canProceed?: boolean;
  /** Optional hint shown next to the disabled button so users know why. */
  blockReason?: string;
};

type WizardProps = {
  steps: WizardStep[];
  onFinish?: () => void;
  finishLabel?: string;
};

export function Wizard({ steps, onFinish, finishLabel = "Fertig" }: WizardProps) {
  const [index, setIndex] = useState(0);
  const total = steps.length;
  const step = steps[index];
  if (!step) return null;

  const isLast = index === total - 1;
  const canProceed = step.canProceed !== false;

  const handleNext = () => {
    if (isLast) {
      onFinish?.();
      return;
    }
    setIndex((i) => Math.min(i + 1, total - 1));
  };

  const handleBack = () => {
    setIndex((i) => Math.max(i - 1, 0));
  };

  return (
    <div className="space-y-6">
      <ol aria-label="Schritte" className="flex items-center gap-2 text-xs">
        {steps.map((s, i) => {
          const active = i === index;
          const done = i < index;
          return (
            <li key={s.id} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => i <= index && setIndex(i)}
                className={[
                  "flex h-7 min-w-7 items-center justify-center rounded-full px-2 text-[11px] font-semibold transition-colors",
                  active
                    ? "bg-brand-600 text-white"
                    : done
                      ? "bg-brand-100 text-brand-700 hover:bg-brand-200"
                      : "bg-slate-200 text-slate-500",
                ].join(" ")}
                aria-current={active ? "step" : undefined}
                disabled={i > index}
                title={s.title}
              >
                {i + 1}
              </button>
              {i < total - 1 && <span className="h-px w-6 bg-slate-200" />}
            </li>
          );
        })}
      </ol>

      <div>
        <h2 className="mb-1 text-lg font-semibold text-slate-900">{step.title}</h2>
        <div className="space-y-4">{step.content}</div>
      </div>

      <div className="space-y-2 border-t border-slate-100 pt-4" data-print="hide">
        {!canProceed && step.blockReason && (
          <p className="text-right text-xs text-amber-700">{step.blockReason}</p>
        )}
        <div className="flex items-center justify-between gap-2">
          <Button variant="ghost" onClick={handleBack} disabled={index === 0}>
            Zurück
          </Button>
          <Button onClick={handleNext} disabled={!canProceed}>
            {isLast ? finishLabel : "Weiter"}
          </Button>
        </div>
      </div>
    </div>
  );
}
