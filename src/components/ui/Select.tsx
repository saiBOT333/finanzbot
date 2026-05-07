import { forwardRef, type SelectHTMLAttributes } from "react";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = "", children, ...rest }, ref) => (
    <select
      ref={ref}
      className={`block h-10 w-full border border-ink-900 bg-white px-3 font-sans text-[13px] leading-none text-ink-900 hover:border-ink-700 focus:border-mustard-400 focus:outline-none focus:ring-0 ${className}`.trim()}
      {...rest}
    >
      {children}
    </select>
  ),
);
Select.displayName = "Select";
