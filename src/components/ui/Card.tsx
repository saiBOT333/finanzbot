import type { HTMLAttributes, ReactNode } from "react";

type Variant = "filled" | "outlined" | "hero";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  variant?: Variant;
};

const variants: Record<Variant, string> = {
  filled: "bg-surface-container",
  outlined: "bg-surface border border-outline-variant",
  hero: "bg-primary-container text-on-primary-container",
};

/**
 * M3 Tonal Card — abgerundete Surface ohne harte Linien.
 * - filled: Standard-Tonal-Surface (surface-container)
 * - outlined: hellere Surface mit dünner outline-variant
 * - hero: Primary-Container für die Schlüsselzahl auf dem Ergebnis-Screen
 */
export function Card({
  className = "",
  variant = "filled",
  children,
  ...rest
}: CardProps) {
  return (
    <div
      className={`relative rounded-m3-lg p-6 sm:p-8 ${variants[variant]} ${className}`.trim()}
      {...rest}
    >
      {children}
    </div>
  );
}
