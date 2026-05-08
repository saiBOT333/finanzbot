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
        className="inline-flex h-6 w-6 items-center justify-center rounded-m3-pill bg-secondary-container text-[12px] font-semibold leading-none text-on-secondary-container transition-colors hover:brightness-95"
      >
        i
      </button>
    </Tooltip>
  );
}
