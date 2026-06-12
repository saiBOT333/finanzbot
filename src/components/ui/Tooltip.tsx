import { useState, type ReactNode } from "react";

type TooltipProps = {
  content: ReactNode;
  children: ReactNode;
};

/**
 * M3 Plain Tooltip — abgerundetes Panel auf inverse Surface.
 */
export function Tooltip({ content, children }: TooltipProps) {
  const [open, setOpen] = useState(false);
  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {children}
      {open && (
        <span
          role="tooltip"
          className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 w-64 -translate-x-1/2 rounded-m3-sm bg-on-surface px-3 py-2 text-body-sm leading-relaxed text-surface shadow-m3-elev2"
        >
          {content}
        </span>
      )}
    </span>
  );
}
