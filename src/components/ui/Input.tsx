import { forwardRef, type InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  invalid?: boolean;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ invalid = false, className = "", ...rest }, ref) => {
    const ring = invalid ? "ring-red-400 focus:ring-red-500" : "ring-slate-300 focus:ring-brand-500";
    return (
      <input
        ref={ref}
        className={`block w-full rounded-md bg-white px-3 py-2 text-sm text-slate-900 ring-1 ring-inset placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-inset ${ring} ${className}`.trim()}
        {...rest}
      />
    );
  },
);
Input.displayName = "Input";
