import { useEffect } from "react";

type SnackbarProps = {
  message: string | null;
  onDismiss: () => void;
};

/**
 * M3 Snackbar — kurzlebige Statusmeldung auf Inverse Surface, ersetzt
 * native alert()-Fenster. Blendet sich nach 4 Sekunden selbst aus.
 */
export function Snackbar({ message, onDismiss }: SnackbarProps) {
  useEffect(() => {
    if (message === null) return;
    const timer = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timer);
  }, [message, onDismiss]);

  if (message === null) return null;

  return (
    <div
      role="status"
      className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-m3-sm bg-on-surface px-4 py-3 text-body-sm text-surface shadow-m3-elev2"
    >
      {message}
    </div>
  );
}
