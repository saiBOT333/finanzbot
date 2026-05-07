import { useId, type ReactNode } from "react";

type FieldProps = {
  label: ReactNode;
  /** Optional inline element next to the label (z. B. ein Tooltip-Button). */
  adornment?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  children: (id: string) => ReactNode;
};

/**
 * Werkstatt-Field: einheitlicher Wrapper für Label + Input + Hint/Error.
 * Stellt sicher, dass alle Form-Felder im Grid exakt gleiche Höhen haben —
 * Label-Höhe, Spacing zum Input und Hint-Bereich sind überall identisch.
 *
 * - Mono-Caps Label mit fixer Mindesthöhe (synchron mit Tooltip-Button)
 * - 6 px Gap zum Input
 * - Hint oder Error darunter, gleiche Typografie wie NumberInput
 */
export function Field({
  label,
  adornment,
  hint,
  error,
  required = false,
  children,
}: FieldProps) {
  const id = useId();
  const errorId = `${id}-error`;
  const showError = error != null;
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className="flex min-h-[16px] items-center gap-2 font-mono text-[10.5px] font-medium uppercase tracking-instrument text-ink-700"
      >
        <span>
          {label}
          {required && <span className="ml-1 text-mustard-600">*</span>}
        </span>
        {adornment}
      </label>
      {children(id)}
      {showError ? (
        <p
          id={errorId}
          className="font-mono text-[10.5px] font-medium uppercase tracking-instrument text-brick-700"
        >
          ▲ {error}
        </p>
      ) : (
        hint && (
          <p className="font-sans text-[12px] leading-snug text-ink-500">{hint}</p>
        )
      )}
    </div>
  );
}
