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
 * to the parent on every change.
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
  const [text, setText] = useState<string>(value === undefined ? "" : formatNumber(value));

  useEffect(() => {
    if (value === undefined) {
      setText("");
      return;
    }
    const parsed = parseLocalNumber(text);
    if (parsed !== value) setText(formatNumber(value));
    // Only sync from external changes when our local parse differs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const parsed = parseLocalNumber(text);
  const invalid =
    text.trim() !== "" &&
    (parsed === null ||
      (min !== undefined && parsed < min) ||
      (max !== undefined && parsed > max));

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
          invalid={invalid}
          onChange={(e) => {
            const next = e.target.value;
            setText(next);
            const n = parseLocalNumber(next);
            if (next.trim() === "") {
              onChange(undefined);
            } else if (n !== null) {
              if (min !== undefined && n < min) return;
              if (max !== undefined && n > max) return;
              onChange(n);
            }
          }}
        />
        {unit && (
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-slate-500">
            {unit}
          </span>
        )}
      </div>
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  );
}
