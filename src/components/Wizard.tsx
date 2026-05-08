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

/** Strip leading "1. " / "2. " prefixes — replaced by zero-padded numbers. */
function stripNumberPrefix(title: string): string {
  return title.replace(/^\s*\d+\.\s*/, "");
}

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

  const cleanTitle = stripNumberPrefix(step.title);

  return (
    <div className="space-y-8">
      {/* M3 Linear Progress + Step-Chips. */}
      <div className="space-y-3" aria-label="Wizard-Fortschritt">
        <div className="h-1 w-full overflow-hidden rounded-full bg-surface-container-high" aria-hidden>
          <div
            className="h-full bg-primary transition-[width] duration-200"
            style={{ width: `${((index + 1) / total) * 100}%` }}
          />
        </div>
        <ol className="flex flex-wrap gap-2">
          {steps.map((s, i) => {
            const status = i < index ? "done" : i === index ? "active" : "pending";
            const reachable = i <= index;
            const tone =
              status === "active"
                ? "bg-primary-container text-on-primary-container"
                : "bg-surface-container text-on-surface-variant";
            const numTone =
              status === "active"
                ? "bg-primary text-on-primary"
                : status === "done"
                  ? "bg-success text-on-primary"
                  : "bg-outline-variant text-on-surface";
            return (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => reachable && setIndex(i)}
                  disabled={!reachable}
                  aria-current={status === "active" ? "step" : undefined}
                  title={s.title}
                  className={`inline-flex items-center gap-2 rounded-m3-pill px-3.5 py-1.5 text-[13px] font-medium transition-colors ${tone} ${reachable ? "cursor-pointer hover:brightness-95" : "cursor-not-allowed opacity-60"}`}
                >
                  <span
                    aria-hidden
                    className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold ${numTone}`}
                  >
                    {status === "done" ? "✓" : i + 1}
                  </span>
                  {stripNumberPrefix(s.title)}
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      <header className="space-y-3">
        <span className="m3-eyebrow">{`Schritt ${index + 1} / ${total}`}</span>
        <h2 className="text-[28px] sm:text-[32px] font-semibold leading-[1.1] tracking-[-0.005em] text-on-surface">
          {cleanTitle}
        </h2>
      </header>

      <div className="space-y-5">{step.content}</div>

      <div className="space-y-3 pt-6" data-print="hide">
        {!canProceed && step.blockReason && (
          <p className="rounded-m3-md bg-error-container px-4 py-3 text-[13px] text-on-surface">
            ▲ {step.blockReason}
          </p>
        )}
        <div className="flex items-center justify-between gap-2">
          <Button variant="text" onClick={handleBack} disabled={index === 0}>
            ← Zurück
          </Button>
          <Button onClick={handleNext} disabled={!canProceed}>
            {isLast ? finishLabel : "Weiter →"}
          </Button>
        </div>
      </div>
    </div>
  );
}
