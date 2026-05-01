import type { ReactNode } from "react";
import { Tooltip } from "./ui/Tooltip";

type InfoTooltipProps = {
  content: ReactNode;
  label?: string;
};

export function InfoTooltip({ content, label = "Erklärung" }: InfoTooltipProps) {
  return (
    <Tooltip content={content}>
      <button
        type="button"
        aria-label={label}
        className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-[11px] font-semibold text-slate-700 hover:bg-slate-300"
      >
        i
      </button>
    </Tooltip>
  );
}
