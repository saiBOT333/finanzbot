import { useState, type ReactNode } from "react";

type DisclosureProps = {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
  hint?: string;
};

/**
 * Generic expandable section. Reusable across modules.
 */
export function Disclosure({ title, defaultOpen = false, children, hint }: DisclosureProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="overflow-hidden rounded-xl ring-1 ring-slate-200 bg-white">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 px-5 py-3 text-left transition-colors hover:bg-slate-50"
      >
        <span className="flex flex-col">
          <span className="text-sm font-semibold text-slate-900">{title}</span>
          {hint && <span className="text-xs text-slate-500">{hint}</span>}
        </span>
        <span
          className={`flex h-6 w-6 items-center justify-center rounded-full text-slate-500 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        >
          ▾
        </span>
      </button>
      {open && <div className="border-t border-slate-100 px-5 py-4">{children}</div>}
    </div>
  );
}
