import { forwardRef, type SelectHTMLAttributes } from "react";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = "", children, ...rest }, ref) => (
    <select
      ref={ref}
      className={`block w-full rounded-md bg-white px-3 py-2 text-sm text-slate-900 ring-1 ring-inset ring-slate-300 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-500 ${className}`.trim()}
      {...rest}
    >
      {children}
    </select>
  ),
);
Select.displayName = "Select";
