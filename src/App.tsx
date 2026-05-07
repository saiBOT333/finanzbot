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
      <header className="bg-paper-100">
        <div className="mx-auto w-full max-w-3xl px-5 sm:px-8">
          <div className="flex items-end justify-between gap-3 pb-4 pt-6">
            <div className="min-w-0">
              <p className="eyebrow-muted">v1 · Modul 01 · Vorsorge</p>
              <h1 className="mt-1 font-display text-[28px] font-semibold leading-none tracking-[-0.02em] text-ink-900">
                FinanzBot<span className="text-mustard-400">.</span>
              </h1>
              <p className="mt-1.5 hidden font-mono text-[11px] uppercase tracking-instrument text-ink-500 sm:block">
                Lokal · Privatsphäre-by-Design
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
          {/* Werkstatt: harte 1px-Linie unter dem Header. */}
          <div aria-hidden className="hairline" />
        </div>
      </header>

      <main className="container-page space-y-8">
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
                      "border px-3 py-1.5 font-mono text-[11px] uppercase tracking-instrument transition-colors",
                      m.id === activeId
                        ? "border-ink-900 bg-ink-900 text-paper-50"
                        : "border-ink-900 bg-transparent text-ink-900 hover:bg-ink-900 hover:text-paper-50",
                    ].join(" ")}
                  >
                    <span className="mr-1.5">{m.icon}</span>
                    {m.name}
                  </button>
                ))}
              </nav>
            )}

            {active ? (
              <section>
                <div className="mb-8 space-y-3">
                  <div className="flex items-baseline gap-3">
                    <span className="section-number">01</span>
                    <span aria-hidden className="text-ink-300">—</span>
                    <p className="eyebrow-ink">Modul Vorsorge</p>
                  </div>
                  <h2 className="font-display text-4xl font-semibold leading-[1.02] tracking-[-0.02em] text-ink-900 sm:text-5xl">
                    <span className="mr-3 align-baseline text-3xl">{active.icon}</span>
                    {active.name}
                  </h2>
                  <p className="max-w-prose font-sans text-[14px] leading-relaxed text-ink-500">
                    {active.description}
                  </p>
                </div>
                <Card>
                  <active.Component />
                </Card>
              </section>
            ) : (
              <Card>
                <p className="font-sans text-sm text-ink-500">Keine Module aktiv.</p>
              </Card>
            )}
          </>
        )}
      </main>

      <footer className="container-page">
        <div aria-hidden className="mb-4 hairline-soft w-full" />
        <p className="text-center font-mono text-[10.5px] uppercase tracking-instrument leading-relaxed text-ink-500">
          Realgerechnete Orientierung · Keine Anlageberatung · Lokal &amp; quelloffen
        </p>
      </footer>
    </div>
  );
}
