import { useState, type ReactNode } from "react";

type DisclosureProps = {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
  hint?: string;
};

/**
 * M3 Disclosure — Outlined Card mit Chevron, expand/collapse.
 */
export function Disclosure({ title, defaultOpen = false, children, hint }: DisclosureProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-m3-md border border-outline-variant overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition-colors hover:bg-surface-container"
      >
        <span className="flex flex-col gap-0.5">
          <span className="text-body-lg font-medium tracking-[-0.005em] text-on-surface">
            {title}
          </span>
          {hint && (
            <span className="text-label-sm uppercase tracking-[0.04em] text-on-surface-variant">
              {hint}
            </span>
          )}
        </span>
        <span
          aria-hidden="true"
          className={`m3-icon text-[20px] text-on-surface-variant transition-transform ${open ? "rotate-180" : ""}`}
        >
          expand_more
        </span>
      </button>
      {open && (
        <div className="border-t border-outline-variant px-5 py-4 text-body-md text-on-surface">
          {children}
        </div>
      )}
    </div>
  );
}
