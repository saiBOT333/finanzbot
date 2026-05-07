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
        className="inline-flex h-4 w-4 items-center justify-center border border-ink-700 bg-transparent font-mono text-[9px] font-semibold leading-none text-ink-700 transition-colors hover:border-mustard-400 hover:bg-mustard-400 hover:text-ink-900"
      >
        i
      </button>
    </Tooltip>
  );
}
