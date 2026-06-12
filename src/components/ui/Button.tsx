import type { ButtonHTMLAttributes } from "react";

type Variant = "filled" | "tonal" | "text" | "outlined";
type Size = "md" | "sm";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

const base =
  "inline-flex items-center justify-center gap-2 font-medium tracking-[0.01em] transition-colors disabled:cursor-not-allowed disabled:opacity-40 rounded-m3-button focus-visible:outline-none";

const variants: Record<Variant, string> = {
  filled:
    "bg-primary text-on-primary hover:brightness-110 active:brightness-95",
  tonal:
    "bg-secondary-container text-on-secondary-container hover:brightness-95",
  text: "bg-transparent text-primary hover:bg-primary-container",
  outlined:
    "bg-transparent text-primary border border-outline hover:bg-primary-container",
};

const sizes: Record<Size, string> = {
  md: "h-11 px-6 text-label-lg",
  sm: "h-9 px-4 text-label-lg",
};

export function Button({
  variant = "filled",
  size = "md",
  className = "",
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`.trim()}
      {...rest}
    />
  );
}
