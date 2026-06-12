import type { ReactNode } from "react";

type Tone = "neutral" | "info" | "success" | "warning";

const tones: Record<Tone, string> = {
  neutral: "border-outline-variant bg-surface-container",
  info: "border-primary bg-surface-container",
  success: "border-success bg-surface-container",
  warning: "border-error bg-error-container",
};

const iconTones: Record<Tone, string> = {
  neutral: "text-on-surface-variant",
  info: "text-primary",
  success: "text-success",
  warning: "text-error",
};

type CalloutProps = {
  tone?: Tone;
  /** Kleines Label oberhalb des Inhalts (Pill bzw. bei warning Klartext in Error). */
  eyebrow?: ReactNode;
  /** Material-Symbol-Name links neben dem Inhalt, z. B. "lightbulb" oder "warning". */
  icon?: string;
  children: ReactNode;
  className?: string;
};

/**
 * M3 Callout — das wiederkehrende Hinweis-Muster der App: tonale Fläche mit
 * 3px-Akzentkante links. Ersetzt die handkopierten border-l-[3px]-Boxen.
 */
export function Callout({
  tone = "neutral",
  eyebrow,
  icon,
  children,
  className = "",
}: CalloutProps) {
  const eyebrowEl =
    eyebrow == null ? null : tone === "warning" ? (
      <p className="text-label-md font-medium uppercase tracking-[0.04em] text-error">
        {eyebrow}
      </p>
    ) : (
      <p className="m3-eyebrow-muted">{eyebrow}</p>
    );

  return (
    <div
      className={`rounded-m3-sm border-l-[3px] px-4 py-3 ${tones[tone]} ${className}`.trim()}
    >
      <div className={icon ? "flex items-start gap-3" : undefined}>
        {icon && (
          <span
            aria-hidden
            className={`m3-icon mt-0.5 text-[20px] leading-none ${iconTones[tone]}`}
          >
            {icon}
          </span>
        )}
        <div className="min-w-0 flex-1 space-y-1.5">
          {eyebrowEl}
          {children}
        </div>
      </div>
    </div>
  );
}
