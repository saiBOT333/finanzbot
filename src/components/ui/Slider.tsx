import { useId, type ChangeEvent } from "react";

type SliderProps = {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  label?: string;
  /** Formatierte Anzeige rechts neben dem Label, z. B. "2,0 %". */
  display?: string;
  ariaLabel?: string;
};

/**
 * M3 Range Slider. Nutzt das native <input type="range"> als A11y-Träger und
 * stylet Track/Thumb über Tailwind/CSS. Der Fill-Anteil wird per CSS-Variable
 * `--fill-pct` aus dem aktuellen Wert berechnet.
 */
export function Slider({
  value,
  onChange,
  min,
  max,
  step = 1,
  label,
  display,
  ariaLabel,
}: SliderProps) {
  const id = useId();
  const pct = ((value - min) / (max - min)) * 100;
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange(Number(e.target.value));
  };
  return (
    <div className="space-y-2">
      {(label || display) && (
        <div className="flex items-baseline justify-between">
          {label && (
            <label htmlFor={id} className="text-[14px] text-on-surface-variant">
              {label}
            </label>
          )}
          {display && (
            <span className="text-[18px] font-semibold text-primary tabular-nums">
              {display}
            </span>
          )}
        </div>
      )}
      <div className="relative h-6 flex items-center">
        <div
          className="absolute inset-x-0 h-1.5 rounded-full bg-surface-container-high"
          aria-hidden
        />
        <div
          className="absolute h-1.5 rounded-full bg-primary"
          aria-hidden
          style={{ width: `${pct}%` }}
        />
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleChange}
          aria-label={ariaLabel ?? label}
          className="m3-slider absolute inset-0 w-full appearance-none bg-transparent cursor-pointer focus:outline-none"
          style={{ ["--fill-pct" as string]: `${pct}%` }}
        />
      </div>
    </div>
  );
}
