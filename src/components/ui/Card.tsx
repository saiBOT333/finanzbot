import type { HTMLAttributes, ReactNode } from "react";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
};

/**
 * Werkstatt-Card: reines Weiß auf Off-White-Hintergrund, harter 1px-Rahmen.
 * Keine abgerundeten Ecken — die App soll wie ein kalibriertes Werkzeug
 * wirken, nicht wie eine Consumer-App.
 */
export function Card({ className = "", children, ...rest }: CardProps) {
  return (
    <div
      className={`relative border border-ink-900 bg-white px-6 py-6 sm:px-8 sm:py-7 ${className}`.trim()}
      {...rest}
    >
      {children}
    </div>
  );
}
