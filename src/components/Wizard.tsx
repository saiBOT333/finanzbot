import { useState, type ReactNode } from "react";
import { Button } from "./ui/Button";
import { Callout } from "./ui/Callout";

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
        <ol className="hidden flex-wrap gap-2 sm:flex">
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
                  className={`inline-flex items-center gap-1.5 rounded-m3-pill px-2.5 py-1 text-label-md font-medium transition-colors ${tone} ${reachable ? "cursor-pointer hover:brightness-95" : "cursor-not-allowed opacity-60"}`}
                >
                  <span
                    aria-hidden
                    className={`inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-semibold ${numTone}`}
                  >
                    {status === "done" ? (
                      <span className="m3-icon text-[12px] leading-none">check</span>
                    ) : (
                      i + 1
                    )}
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
        <h2 className="text-title-lg sm:text-headline font-semibold leading-[1.1] tracking-[-0.005em] text-on-surface">
          {cleanTitle}
        </h2>
      </header>

      <div className="space-y-5">{step.content}</div>

      <div className="space-y-3 pt-6">
        {!canProceed && step.blockReason && (
          <Callout tone="warning" icon="warning">
            <p className="text-body-sm text-on-surface">{step.blockReason}</p>
          </Callout>
        )}
        <div className="flex items-center justify-between gap-2">
          <Button variant="text" onClick={handleBack} disabled={index === 0}>
            <span aria-hidden className="m3-icon text-[18px]">arrow_back</span>
            Zurück
          </Button>
          {(!isLast || onFinish) && (
            <Button onClick={handleNext} disabled={!canProceed}>
              {isLast ? (
                finishLabel
              ) : (
                <>
                  Weiter
                  <span aria-hidden className="m3-icon text-[18px]">arrow_forward</span>
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
