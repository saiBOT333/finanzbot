import { forwardRef, type InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  invalid?: boolean;
};

/**
 * M3 Filled Text Field — gefärbte Surface, 2px Bottom-Border, oben abgerundet.
 * - Hover: leichte Aufhellung (über brightness)
 * - Focus: Bottom-Border wechselt zu Primary
 * - Invalid: Bottom-Border und Text in Error
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ invalid = false, className = "", ...rest }, ref) => {
    const tone = invalid
      ? "text-error border-error"
      : "text-on-surface border-on-surface-variant focus:border-primary";
    return (
      <input
        ref={ref}
        className={`block h-12 w-full rounded-t-m3-sm border-b-2 bg-surface-container-high px-4 text-[16px] tabular-nums placeholder:text-on-surface-variant focus:outline-none ${tone} ${className}`.trim()}
        {...rest}
      />
    );
  },
);
Input.displayName = "Input";
