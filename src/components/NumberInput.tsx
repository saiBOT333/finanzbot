import { useEffect, useId, useState, type ReactNode } from "react";
import { Input } from "./ui/Input";
import { InfoTooltip } from "./InfoTooltip";
import { parseLocalNumber, formatNumber } from "../lib/format";

type NumberInputProps = {
  label: string;
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  unit?: "€" | "%" | "Jahre" | "";
  min?: number;
  max?: number;
  required?: boolean;
  placeholder?: string;
  hint?: ReactNode;
  tooltip?: ReactNode;
};

/**
 * Localized numeric input. Stores the typed string locally so the user can
 * edit fluidly (decimal commas, intermediate states); commits a parsed number
 * to the parent on every change. Shows a red error message when the parsed
 * value is out of range so the user knows why their input was rejected.
 */
export function NumberInput({
  label,
  value,
  onChange,
  unit = "",
  min,
  max,
  required = false,
  placeholder,
  hint,
  tooltip,
}: NumberInputProps) {
  const id = useId();
  const errorId = `${id}-error`;
  const [text, setText] = useState<string>(value === undefined ? "" : formatNumber(value));

  useEffect(() => {
    if (value === undefined) {
      setText("");
      return;
    }
    const parsed = parseLocalNumber(text);
    if (parsed !== value) setText(formatNumber(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const trimmed = text.trim();
  const parsed = parseLocalNumber(trimmed);

  let error: string | null = null;
  if (trimmed !== "") {
    if (parsed === null) {
      error = "Bitte eine gültige Zahl eingeben.";
    } else if (min !== undefined && parsed < min) {
      error = `Mindestens ${formatNumber(min)}${unit ? " " + unit : ""}.`;
    } else if (max !== undefined && parsed > max) {
      error = `Höchstens ${formatNumber(max)}${unit ? " " + unit : ""}.`;
    }
  } else if (required) {
    error = "Pflichtfeld.";
  }

  const showError = error !== null && trimmed !== "";

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="flex items-center gap-2 text-sm font-medium text-slate-800">
        <span>
          {label}
          {required && <span className="ml-0.5 text-red-500">*</span>}
        </span>
        {tooltip && <InfoTooltip content={tooltip} label={`Erklärung zu ${label}`} />}
      </label>
      <div className="relative">
        <Input
          id={id}
          inputMode="decimal"
          value={text}
          placeholder={placeholder}
          invalid={showError}
          aria-invalid={showError ? true : undefined}
          aria-describedby={showError ? errorId : undefined}
          onChange={(e) => {
            const next = e.target.value;
            setText(next);
            const parsedNext = parseLocalNumber(next.trim());
            if (next.trim() === "") {
              onChange(undefined);
              return;
            }
            if (parsedNext === null) return; // keep text but don't commit garbage
            // Commit even when out of range — error is shown to the user, but
            // we don't want to silently swallow keystrokes mid-edit.
            onChange(parsedNext);
          }}
        />
        {unit && (
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-slate-500">
            {unit}
          </span>
        )}
      </div>
      {showError ? (
        <p id={errorId} className="text-xs font-medium text-red-600">
          {error}
        </p>
      ) : (
        hint && <p className="text-xs text-slate-500">{hint}</p>
      )}
    </div>
  );
}
