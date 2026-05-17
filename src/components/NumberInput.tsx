import { useEffect, useState, type ReactNode } from "react";
import { Input } from "./ui/Input";
import { Field } from "./ui/Field";
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
    <Field
      label={label}
      adornment={tooltip && <InfoTooltip content={tooltip} label={`Erklärung zu ${label}`} />}
      required={required}
      hint={hint}
      error={showError ? error : undefined}
    >
      {(id) => (
        <div className="relative">
          <Input
            id={id}
            inputMode="decimal"
            value={text}
            placeholder={placeholder}
            invalid={showError}
            aria-invalid={showError ? true : undefined}
            className={unit ? "pr-12" : ""}
            onChange={(e) => {
              const next = e.target.value;
              setText(next);
              const parsedNext = parseLocalNumber(next.trim());
              if (next.trim() === "") {
                onChange(undefined);
                return;
              }
              if (parsedNext === null) return;
              onChange(parsedNext);
            }}
          />
          {unit && (
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[12px] uppercase tracking-[0.04em] text-on-surface-variant">
              {unit}
            </span>
          )}
        </div>
      )}
    </Field>
  );
}
