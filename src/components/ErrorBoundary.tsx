import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = { children: ReactNode };
type State = { hasError: boolean };

/**
 * Catches render errors so a single broken component (e.g. a corrupt persisted
 * state) shows a recoverable message instead of a blank page.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("Unbehandelter Fehler:", error, info.componentStack);
  }

  private reload = (): void => {
    window.location.reload();
  };

  private resetData = (): void => {
    try {
      Object.keys(window.localStorage)
        .filter((k) => k.startsWith("finanzbot:"))
        .forEach((k) => window.localStorage.removeItem(k));
    } catch {
      // ignore
    }
    window.location.reload();
  };

  render(): ReactNode {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="max-w-md space-y-4 rounded-m3-md bg-surface-container p-6">
          <p className="text-[12px] font-medium uppercase tracking-[0.04em] text-error">
            ▲ Es ist ein Fehler aufgetreten
          </p>
          <p className="font-sans text-[13.5px] leading-relaxed text-on-surface-variant">
            Die Anwendung konnte nicht dargestellt werden. Lade die Seite neu — meist
            behebt das den Fehler. Bleibt er bestehen, kannst du die gespeicherten
            Eingaben in diesem Browser zurücksetzen.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={this.reload}
              className="rounded-m3-sm bg-primary px-4 py-2 text-[13px] font-medium text-on-primary"
            >
              Seite neu laden
            </button>
            <button
              type="button"
              onClick={this.resetData}
              className="rounded-m3-sm px-4 py-2 text-[13px] font-medium text-primary hover:underline"
            >
              Eingaben zurücksetzen
            </button>
          </div>
        </div>
      </div>
    );
  }
}
