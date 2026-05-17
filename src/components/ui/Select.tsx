import { forwardRef, type SelectHTMLAttributes } from "react";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

/**
 * M3 Filled Select — gleiche Surface wie Filled Text Field.
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = "", children, ...rest }, ref) => (
    <select
      ref={ref}
      className={`block h-12 w-full rounded-t-m3-sm border-b-2 border-on-surface-variant bg-surface-container-high px-4 text-[15px] text-on-surface focus:border-primary focus:outline-none ${className}`.trim()}
      {...rest}
    >
      {children}
    </select>
  ),
);
Select.displayName = "Select";
