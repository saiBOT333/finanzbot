import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost";
type Size = "md" | "sm";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

const base =
  "inline-flex items-center justify-center font-mono uppercase tracking-instrument transition-all disabled:cursor-not-allowed disabled:opacity-40";

const variants: Record<Variant, string> = {
  // Primary: schwarz mit Senf-Akzent-Linie unten — wirkt wie ein Schalter.
  primary:
    "bg-ink-900 text-paper-50 border border-ink-900 hover:bg-mustard-400 hover:text-ink-900 hover:border-mustard-400 active:bg-mustard-500",
  // Secondary: 1px schwarz, transparent, ALL-CAPS Mono.
  secondary:
    "bg-transparent text-ink-900 border border-ink-900 hover:bg-ink-900 hover:text-paper-50 active:bg-ink-800",
  // Ghost: nur Text, Hover unterstreicht in Senf.
  ghost:
    "bg-transparent text-ink-700 border border-transparent hover:text-ink-900 hover:underline underline-offset-4 decoration-mustard-400 decoration-2",
};

const sizes: Record<Size, string> = {
  md: "h-10 px-5 text-[11px] font-medium",
  sm: "h-8 px-3 text-[10px] font-medium",
};

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  ...rest
}: ButtonProps) {
  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`.trim()}
      {...rest}
    />
  );
}
