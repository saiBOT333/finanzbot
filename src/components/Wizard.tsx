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

const pad = (n: number) => String(n).padStart(2, "0");

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
      {/* Werkstatt-Stepper: vertikale Tick-Marks auf einer dünnen Skala. */}
      <ol
        aria-label="Schritte"
        className="relative flex items-end justify-between gap-1 border-b border-ink-100 pb-4"
      >
        {steps.map((s, i) => {
          const active = i === index;
          const done = i < index;
          const reachable = i <= index;
          return (
            <li key={s.id} className="flex flex-1 flex-col items-center gap-2">
              <button
                type="button"
                onClick={() => reachable && setIndex(i)}
                className={[
                  "flex w-full flex-col items-center gap-2 transition-colors",
                  reachable ? "cursor-pointer" : "cursor-not-allowed",
                ].join(" ")}
                aria-current={active ? "step" : undefined}
                disabled={!reachable}
                title={s.title}
              >
                <span
                  className={[
                    "font-mono text-[11px] font-medium tabular-nums",
                    active
                      ? "text-mustard-600"
                      : done
                        ? "text-ink-900"
                        : "text-ink-300",
                  ].join(" ")}
                >
                  {pad(i + 1)}
                </span>
                <span
                  aria-hidden
                  className={[
                    "tick-mark",
                    active && "tick-mark-active",
                    done && "tick-mark-done",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                />
              </button>
            </li>
          );
        })}
      </ol>

      <header className="space-y-3">
        <div className="flex items-baseline gap-3">
          <span className="section-number">{pad(index + 1)}</span>
          <span aria-hidden className="text-ink-300">—</span>
          <p className="eyebrow-ink">{cleanTitle}</p>
        </div>
        <h2 className="font-display text-3xl font-semibold leading-[1.05] tracking-tight text-ink-900 sm:text-4xl">
          {cleanTitle}
        </h2>
      </header>

      <div className="space-y-5">{step.content}</div>

      <div className="space-y-2 pt-6" data-print="hide">
        <div aria-hidden className="hairline-soft w-full" />
        {!canProceed && step.blockReason && (
          <p className="pt-3 text-right font-mono text-[11px] uppercase tracking-instrument text-brick-600">
            ▲ {step.blockReason}
          </p>
        )}
        <div className="flex items-center justify-between gap-2 pt-3">
          <Button variant="ghost" onClick={handleBack} disabled={index === 0}>
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
