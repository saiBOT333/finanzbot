import { useEffect, type ReactNode } from "react";
import { Button } from "./Button";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  confirmLabel: string;
  onConfirm: () => void;
  onClose: () => void;
  children: ReactNode;
};

/**
 * M3 Basic Dialog — ersetzt native confirm()-Fenster. Scrim + tonales Panel,
 * Escape und Klick auf den Hintergrund schließen.
 */
export function ConfirmDialog({
  open,
  title,
  confirmLabel,
  onConfirm,
  onClose,
  children,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-on-surface/30" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative w-full max-w-sm rounded-m3-lg bg-surface-container-high p-6 shadow-m3-elev2"
      >
        <h3 className="text-title-sm font-semibold text-on-surface">{title}</h3>
        <div className="mt-2 text-body-sm leading-relaxed text-on-surface-variant">
          {children}
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="text" onClick={onClose}>
            Abbrechen
          </Button>
          <Button autoFocus onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
