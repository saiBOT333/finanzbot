import type { HTMLAttributes, ReactNode } from "react";

type Tone = "neutral" | "active" | "done" | "warning";

type ChipProps = HTMLAttributes<HTMLSpanElement> & {
  children: ReactNode;
  tone?: Tone;
  leading?: ReactNode;
};

const tones: Record<Tone, string> = {
  neutral: "bg-surface-container text-on-surface-variant",
  active: "bg-primary-container text-on-primary-container",
  done: "bg-success-container text-on-surface",
  warning: "bg-error-container text-on-surface",
};

/**
 * M3 Assist/Filter-Chip (read-only). Nicht interaktiv — für Status, Labels.
 * Für selektierbare Chips siehe ChoiceChip.
 */
export function Chip({
  className = "",
  tone = "neutral",
  leading,
  children,
  ...rest
}: ChipProps) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-m3-pill px-3.5 py-1.5 text-label-lg font-medium ${tones[tone]} ${className}`.trim()}
      {...rest}
    >
      {leading}
      {children}
    </span>
  );
}
