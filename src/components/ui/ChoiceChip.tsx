import type { ButtonHTMLAttributes, ReactNode } from "react";

type ChoiceChipProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  selected?: boolean;
  children: ReactNode;
};

/**
 * M3 Filter/Choice Chip (selektierbar). Im selected-State Secondary-Container
 * mit Häkchen-Prefix, sonst Outlined.
 */
export function ChoiceChip({
  selected = false,
  className = "",
  children,
  type = "button",
  ...rest
}: ChoiceChipProps) {
  const tone = selected
    ? "bg-secondary-container text-on-secondary-container border-transparent"
    : "bg-transparent text-on-surface border-outline hover:bg-surface-container";
  return (
    <button
      type={type}
      className={`inline-flex items-center gap-2 rounded-m3-sm border px-4 py-2.5 text-label-lg font-medium transition-colors ${tone} ${className}`.trim()}
      aria-pressed={selected}
      {...rest}
    >
      {selected && (
        <span aria-hidden className="m3-icon text-[18px] leading-none">
          check
        </span>
      )}
      {children}
    </button>
  );
}
