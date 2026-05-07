import { useState, type ReactNode } from "react";

type TooltipProps = {
  content: ReactNode;
  children: ReactNode;
};

/**
 * Werkstatt-Tooltip: schwarzes Panel mit hartem 1px-Rand, Mono-Body. Wirkt
 * wie ein Datenblatt-Etikett, nicht wie ein abgerundeter Bubble.
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
          className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 w-64 -translate-x-1/2 border border-mustard-400 bg-ink-900 px-3 py-2 font-sans text-[12px] leading-relaxed text-paper-50"
        >
          {content}
        </span>
      )}
    </span>
  );
}
