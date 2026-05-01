import { useRef, useState } from "react";
import { Card } from "./components/ui/Card";
import { Button } from "./components/ui/Button";
import { WelcomeScreen } from "./components/WelcomeScreen";
import { modules } from "./modules/registry";
import { profileStore } from "./lib/profile/store";
import { buildExport, downloadJSON, isExportPayload } from "./lib/storage";
import type { Profile } from "./lib/profile/types";

const WELCOME_KEY = "finanzbot:welcomeSeen";

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const active = modules.find((m) => m.id === activeId);

  const handleExport = () => {
    const payload = buildExport(
      profileStore.getSnapshot(),
      Object.fromEntries(modules.map((m) => [m.id, m.store.getSnapshot()])),
    );
    downloadJSON(`finanzbot-${new Date().toISOString().slice(0, 10)}.json`, payload);
  };

  const handleImportClick = () => fileInputRef.current?.click();

  const handleImportFile = async (file: File) => {
    try {
      const text = await file.text();
      const data = JSON.parse(text) as unknown;
      if (!isExportPayload(data)) {
        alert("Diese Datei sieht nicht wie ein FinanzBot-Export aus.");
        return;
      }
      profileStore.replace((data.profile ?? {}) as Profile);
      for (const m of modules) {
        const moduleData = (data.modules as Record<string, unknown> | undefined)?.[m.id];
        if (moduleData && typeof moduleData === "object") {
          m.store.replace(moduleData as object);
        }
      }
      markWelcomeSeen();
      setWelcomeSeen(true);
      alert("Daten importiert.");
    } catch {
      alert("Datei konnte nicht gelesen werden.");
    }
  };

  const handleReset = () => {
    if (!confirm("Alle Eingaben in diesem Browser löschen?")) return;
    profileStore.reset();
    modules.forEach((m) => m.store.reset());
    try {
      window.localStorage.removeItem(WELCOME_KEY);
    } catch {
      // ignore
    }
    setWelcomeSeen(false);
  };

  const handleStart = () => {
    markWelcomeSeen();
    setWelcomeSeen(true);
  };

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <h1 className="text-base font-semibold text-slate-900">FinanzBot</h1>
            <p className="hidden truncate text-xs text-slate-500 sm:block">
              Lokale Finanzplanung — deine Daten bleiben hier.
            </p>
          </div>
          <div className="flex flex-shrink-0 gap-1">
            <Button variant="ghost" size="sm" onClick={handleImportClick} title="Daten importieren">
              <span aria-hidden className="sm:hidden">📥</span>
              <span className="hidden sm:inline">Import</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={handleExport} title="Daten exportieren">
              <span aria-hidden className="sm:hidden">📤</span>
              <span className="hidden sm:inline">Export</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              title="Alle Eingaben löschen"
            >
              <span aria-hidden className="sm:hidden">🔄</span>
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
      </header>

      <main className="container-page space-y-6">
        {!welcomeSeen ? (
          <WelcomeScreen onStart={handleStart} />
        ) : (
          <>
            {modules.length > 1 && (
              <nav className="flex flex-wrap gap-2">
                {modules.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setActiveId(m.id)}
                    className={[
                      "rounded-full px-3 py-1.5 text-sm transition-colors",
                      m.id === activeId
                        ? "bg-brand-600 text-white"
                        : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50",
                    ].join(" ")}
                  >
                    <span className="mr-1">{m.icon}</span>
                    {m.name}
                  </button>
                ))}
              </nav>
            )}

            {active ? (
              <section>
                <div className="mb-4">
                  <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                    <span className="mr-2">{active.icon}</span>
                    {active.name}
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">{active.description}</p>
                </div>
                <Card>
                  <active.Component />
                </Card>
              </section>
            ) : (
              <Card>
                <p className="text-sm text-slate-600">Keine Module aktiv.</p>
              </Card>
            )}
          </>
        )}
      </main>

      <footer className="container-page text-center text-xs text-slate-400">
        Berechnungen basieren auf realen Renditen und sind eine Orientierungshilfe – keine
        Anlageberatung.
      </footer>
    </div>
  );
}
