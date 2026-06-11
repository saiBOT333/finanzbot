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
 * M3 Field — Label oberhalb (kleiner uppercase Text), Eingabefeld unten,
 * Supporting Text (Hint/Error) darunter mit gleicher Höhe-Reservierung.
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
        className="flex min-h-[16px] items-center gap-2 text-[12px] font-medium uppercase tracking-[0.04em] text-on-surface-variant"
      >
        <span>
          {label}
          {required && <span className="ml-1 text-primary">*</span>}
        </span>
        {adornment}
      </label>
      {children(id)}
      {showError ? (
        <p
          id={errorId}
          className="text-[12px] font-medium text-error"
        >
          {error}
        </p>
      ) : (
        hint && (
          <p className="text-[13px] leading-snug text-on-surface-variant">{hint}</p>
        )
      )}
    </div>
  );
}
