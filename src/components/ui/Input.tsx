import { forwardRef, type InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  invalid?: boolean;
};

/**
 * Werkstatt-Input: weiße Box mit hartem 1px-Schwarz-Rahmen, Mono-Numerik,
 * senf-gelber Unterstrich auf Fokus (statt Outline-Ring). Wirkt wie ein
 * Eingabe-Feld an einem Mess-Instrument.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ invalid = false, className = "", ...rest }, ref) => {
    const tone = invalid
      ? "border-brick-600 focus:border-brick-700"
      : "border-ink-900 focus:border-mustard-400 hover:border-ink-700";
    return (
      <input
        ref={ref}
        className={`block h-10 w-full border bg-white px-3 font-mono text-[14px] leading-none tabular-nums text-ink-900 placeholder:text-ink-300 focus:outline-none focus:ring-0 ${tone} ${className}`.trim()}
        style={{ boxShadow: "none" }}
        {...rest}
      />
    );
  },
);
Input.displayName = "Input";
