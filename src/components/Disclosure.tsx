import { useState, type ReactNode } from "react";

type DisclosureProps = {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
  hint?: string;
};

/**
 * Werkstatt-Disclosure: harte Border, eckig, Mono-Header.
 */
export function Disclosure({ title, defaultOpen = false, children, hint }: DisclosureProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-ink-900 bg-white">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 px-5 py-3 text-left transition-colors hover:bg-paper-50"
      >
        <span className="flex flex-col gap-0.5">
          <span className="font-display text-[15px] font-semibold tracking-[-0.01em] text-ink-900">
            {title}
          </span>
          {hint && (
            <span className="font-mono text-[10.5px] uppercase tracking-instrument text-ink-500">
              {hint}
            </span>
          )}
        </span>
        <span
          className={`flex h-6 w-6 flex-shrink-0 items-center justify-center border border-ink-300 font-mono text-[12px] text-ink-700 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        >
          ▾
        </span>
      </button>
      {open && <div className="border-t border-ink-100 px-5 py-4">{children}</div>}
    </div>
  );
}
