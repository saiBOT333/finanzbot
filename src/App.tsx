import { useEffect, useRef, useState } from "react";
import { Card } from "./components/ui/Card";
import { Button } from "./components/ui/Button";
import { ChoiceChip } from "./components/ui/ChoiceChip";
import { ConfirmDialog } from "./components/ui/ConfirmDialog";
import { Snackbar } from "./components/ui/Snackbar";
import { WelcomeScreen } from "./components/WelcomeScreen";
import { modules } from "./modules/registry";
import { profileStore } from "./lib/profile/store";
import { KEYS, buildExport, downloadJSON, isExportPayload, writeJSON } from "./lib/storage";

const WELCOME_KEY = "finanzbot:welcomeSeen";
// sessionStorage-Flag: der Import lädt die Seite neu, die Erfolgsmeldung
// soll aber erst danach als Snackbar erscheinen.
const IMPORT_TOAST_KEY = "finanzbot:importToast";

function readWelcomeSeen(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(WELCOME_KEY) === "1";
  } catch {
    return true;
  }
}

function markWelcomeSeen(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(WELCOME_KEY, "1");
  } catch {
    // ignore
  }
}

export function App() {
  const [activeId, setActiveId] = useState<string>(modules[0]?.id ?? "");
  const [welcomeSeen, setWelcomeSeen] = useState<boolean>(readWelcomeSeen);
  const [snackbar, setSnackbar] = useState<string | null>(null);
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const active = modules.find((m) => m.id === activeId);

  useEffect(() => {
    try {
      if (window.sessionStorage.getItem(IMPORT_TOAST_KEY) === "1") {
        window.sessionStorage.removeItem(IMPORT_TOAST_KEY);
        setSnackbar("Daten importiert.");
      }
    } catch {
      // ignore
    }
  }, []);

  const handleExport = () => {
    const payload = buildExport(
      profileStore.getSnapshot(),
      Object.fromEntries(modules.map((m) => [m.id, m.store.getSnapshot()])),
    );
    downloadJSON(`finanzbot-${new Date().toISOString().slice(0, 10)}.json`, payload);
  };

  const handleImportClick = () => fileInputRef.current?.click();

  const handleImportFile = async (file: File) => {
    let data: unknown;
    try {
      data = JSON.parse(await file.text());
    } catch {
      setSnackbar("Datei konnte nicht gelesen werden.");
      return;
    }
    if (!isExportPayload(data)) {
      setSnackbar("Diese Datei sieht nicht wie ein FinanzBot-Export aus.");
      return;
    }
    // Write to storage and reload: on the next start every store rebuilds
    // through its normal path (defaults merge + migration), so exports from
    // older app versions are upgraded instead of being written verbatim —
    // a verbatim write with missing fields crashes the app.
    writeJSON(KEYS.profile, data.profile);
    for (const [id, moduleData] of Object.entries(data.modules)) {
      writeJSON(KEYS.moduleKey(id), moduleData);
    }
    markWelcomeSeen();
    try {
      window.sessionStorage.setItem(IMPORT_TOAST_KEY, "1");
    } catch {
      // ignore
    }
    window.location.reload();
  };

  const handleReset = () => {
    profileStore.reset();
    modules.forEach((m) => m.store.reset());
    try {
      window.localStorage.removeItem(WELCOME_KEY);
    } catch {
      // ignore
    }
    setConfirmResetOpen(false);
    setWelcomeSeen(false);
    setSnackbar("Alle Eingaben gelöscht.");
  };

  const handleStart = () => {
    markWelcomeSeen();
    setWelcomeSeen(true);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 bg-surface/95 backdrop-blur">
        <div className="container-page py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-baseline gap-3">
              <span className="font-display text-title-sm font-bold tracking-[-0.01em] text-on-surface">
                Finanz<span className="text-primary">Bot</span>
              </span>
              <span className="hidden sm:inline text-body-md text-on-surface-variant">
                Modulare Finanzplanung · lokal · quelloffen
              </span>
            </div>
            <div className="flex flex-shrink-0 gap-1">
              <Button variant="text" size="sm" onClick={handleImportClick} title="Daten importieren">
                <span aria-hidden className="m3-icon text-[20px] sm:hidden">upload</span>
                <span className="hidden sm:inline">Import</span>
              </Button>
              <Button variant="text" size="sm" onClick={handleExport} title="Daten exportieren">
                <span aria-hidden className="m3-icon text-[20px] sm:hidden">download</span>
                <span className="hidden sm:inline">Export</span>
              </Button>
              <Button
                variant="text"
                size="sm"
                onClick={() => setConfirmResetOpen(true)}
                title="Alle Eingaben löschen"
              >
                <span aria-hidden className="m3-icon text-[20px] sm:hidden">restart_alt</span>
                <span className="hidden sm:inline">Zurücksetzen</span>
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleImportFile(file);
                  e.target.value = "";
                }}
              />
            </div>
          </div>
        </div>
      </header>

      <main className="container-page flex-1 space-y-8">
        {!welcomeSeen ? (
          <WelcomeScreen onStart={handleStart} />
        ) : (
          <>
            {modules.length > 1 && (
              <nav className="flex flex-wrap gap-2" aria-label="Modul-Auswahl">
                {modules.map((m) => (
                  <ChoiceChip
                    key={m.id}
                    selected={m.id === activeId}
                    onClick={() => setActiveId(m.id)}
                  >
                    <span aria-hidden className="m3-icon text-[20px]">{m.icon}</span>
                    {m.name}
                  </ChoiceChip>
                ))}
              </nav>
            )}

            {active ? (
              <section className="space-y-8">
                <div className="space-y-3">
                  <h2 className="flex items-center gap-3 font-display text-title-lg sm:text-[48px] font-semibold leading-[1.05] tracking-[-0.02em] text-on-surface">
                    <span aria-hidden className="m3-icon text-primary text-[32px] sm:text-[52px]">{active.icon}</span>
                    {active.name}
                  </h2>
                  <p className="max-w-prose text-body-lg leading-relaxed text-on-surface-variant">
                    {active.description}
                  </p>
                </div>
                <Card>
                  <active.Component />
                </Card>
              </section>
            ) : (
              <Card>
                <p className="text-body-md text-on-surface-variant">Keine Module aktiv.</p>
              </Card>
            )}
          </>
        )}
      </main>

      <footer className="container-page py-6">
        <p className="text-center text-label-md tracking-[0.04em] text-on-surface-variant">
          Realgerechnete Orientierung · Keine Anlageberatung · Lokal &amp; quelloffen
        </p>
      </footer>

      <ConfirmDialog
        open={confirmResetOpen}
        title="Eingaben löschen?"
        confirmLabel="Löschen"
        onConfirm={handleReset}
        onClose={() => setConfirmResetOpen(false)}
      >
        <p>
          Alle Eingaben in diesem Browser werden gelöscht. Mit Export kannst du sie vorher
          als Datei sichern.
        </p>
      </ConfirmDialog>

      <Snackbar message={snackbar} onDismiss={() => setSnackbar(null)} />
    </div>
  );
}
