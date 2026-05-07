# Material-You-App-Rollout — Designspezifikation

**Datum:** 2026-05-07
**Worktree:** `claude/xenodochial-shaw-987d99`
**Vorgänger-Spec:** [`2026-05-07-material-you-mockup-design.md`](2026-05-07-material-you-mockup-design.md)
**Status:** Designvorschlag

## Ziel

Den vom Mockup-Pilot freigegebenen Material-You-Look (Indigo-Seed) in der echten React/Tailwind-App umsetzen. Die bestehende „Werkstatt"-Designsprache wird vollständig durch M3 ersetzt — UI-Primitives, App-Shell, alle Modul-Screens, Print-View, Mobile-Layout. In-Place-Replacement, kein Runtime-Toggle.

Reversibilität ausschließlich über Git: Tag `werkstatt-final` markiert den Werkstatt-Stand auf `main` (`619beb0`), bevor M3 gemergt wird. Side-by-Side-Vergleich vor dem Merge über zwei laufende Dev-Server (`main` auf 5173, M3-Worktree auf 5174).

## Nicht-Ziele

- **Kein** Runtime-Theme-Toggle und keine parallel existierenden M3-Komponenten neben Werkstatt-Komponenten.
- **Kein** Dark-Mode (kann später folgen).
- **Keine** Änderung an der Geschäftslogik, an Berechnungen (`lib/finance.ts`, `modules/pension/calculations.ts`) oder am State-Management. Nur Präsentationsschicht.
- **Keine** Erweiterung der Wizard-Schritte oder neue Module — der M3-Rollout ändert ausschließlich die Optik.
- **Kein** Wechsel des CSS-Frameworks. Tailwind 3 bleibt; nur die Tokens und Klassen werden ersetzt.

## Reversibilität

Vor dem Merge auf `main` wird auf `main`-HEAD (Werkstatt-Stand `619beb0`) das Tag `werkstatt-final` gesetzt. Rollback-Wege nach dem Merge:

- `git revert <merge-commit>` für einen sofortigen, nachvollziehbaren Rollback im Repo-Verlauf
- `git checkout -b werkstatt-rescue werkstatt-final` für einen frischen Branch vom alten Stand
- Tag bleibt dauerhaft als Wiederherstellungspunkt

Kein Code im Endstand verweist auf die alten Werkstatt-Tokens oder -Komponenten — der Rollback ist eine bewusste Git-Operation, kein nebenher betriebener Toggle.

## Scope der Migration

### Foundation (`tailwind.config.ts`, `src/styles/globals.css`, `index.html`)

- Werkstatt-Token-Set (paper, ink, mustard, brick) wird durch das M3-Indigo-Token-Set aus dem Mockup-Spec ersetzt.
- `font-family` wechselt von der aktuellen Display/Sans/Mono-Trias zu **Roboto Flex** (eine variable Schrift für alle Rollen). Mono entfällt komplett — tabellarische Zahlen lösen wir über `font-variant-numeric: tabular-nums` global im `body`.
- Print-Styles in `globals.css` werden auf die M3-Token aktualisiert (Hero-Number bleibt groß, Tonal-Surfaces im Druck dimmen).

### UI-Primitives (`src/components/ui/`, in-place ersetzt)

| Datei                  | Werkstatt heute                          | M3-Variante                                                    |
| ---------------------- | ---------------------------------------- | -------------------------------------------------------------- |
| `Button.tsx`           | `default` (schwarz filled), `ghost`, `link` | `filled` (Primary), `tonal` (Secondary-Container), `text`, `outlined` |
| `Card.tsx`             | Rahmen + Schatten                        | Tonal Card (`surface-container`), 16/24 px Radius              |
| `Input.tsx`            | dünner Border-Input                      | M3 Filled Text Field (gefärbte Surface, 2 px Bottom-Border)    |
| `Field.tsx`            | Mono-Eyebrow + Border-Input              | Pill-Eyebrow + Filled Text Field                               |
| `Select.tsx`           | nativer Select mit Border                | M3 Filled Select-Style                                         |
| `Tooltip.tsx`          | dezent                                   | M3 Plain Tooltip auf Surface-Container-High                    |

### Neue Primitives (`src/components/ui/`, neu angelegt)

- **`Slider.tsx`** — kontrollierte Range-Komponente im M3-Look (Track, Fill, Thumb mit Halo, optional Tick-Marks). Wird in BasicsStep (Inflation) und AssumptionsStep (Realrenditen, Steuersatz) eingesetzt.
- **`Chip.tsx`** und **`ChoiceChip.tsx`** — `ChoiceChip` ist ein selektierbarer Button mit Selected-State (Secondary-Container + Häkchen). Wird in BasicsStep für die Profil-Voreinstellung und in AssumptionsStep für Auszahlungsmethode genutzt.

### Layout-/Composite-Komponenten

- **`Wizard.tsx`** — Mono-Stepper wird durch M3 Linear Progress Indicator + nummerierte Step-Chips ersetzt.
- **`WelcomeScreen.tsx`** — Hero-Headline mit Display-Schrift, Spec-Liste auf Tonal-Surface, Filled CTA.
- **`Disclosure.tsx`** — als M3 Outlined Card mit Chevron, kein harter Rahmen.
- **`NumberInput.tsx`** — wrapped das neue Filled Text Field.
- **`InfoTooltip.tsx`** — als M3 Filled Tonal Icon Button.
- **`AssetsManager.tsx`**, **`AllocationManager.tsx`** — bleiben strukturell, bekommen M3-Karten und neue Buttons/Inputs.

### App-Shell (`src/App.tsx`)

- Header verliert die Mono-Eyebrows und harten Linien. Statt dessen Pill-Eyebrows, sauberer Tonal-Hintergrund.
- Modul-Switcher (falls > 1 Modul aktiv): Choice-Chips.
- Action-Buttons (Import / Export / Zurücksetzen) als Tonal Icon Buttons.
- Footer-Disclaimer in Body-Schrift, Tonal-Surface.

### Modul-Screens (`src/modules/pension/steps/`)

- **`BasicsStep.tsx`** — Filled Text Fields für Alter, Slider für Inflation, ChoiceChips für Profil.
- **`IncomeStep.tsx`** — Filled Text Fields, Helper-Text als Supporting Text.
- **`PensionInformationStep.tsx`** — wie Mockup: Warnungen als Filled Card auf `error-container`.
- **`AssumptionsStep.tsx`** — Slider für Realrenditen und Steuersatz, ChoiceChips für Auszahlungsmethode.
- **`ResultStep.tsx`** — Hero-Card mit Display-Zahl auf `primary-container`, Stat-Grid in `surface-container-high`, A/B-Vergleichstabelle, Tip-Card auf Tertiary für Lesehinweis. Drucken-Button als Tonal.
- **`PensionRechenweg.tsx`** — Body-Text + Tabular-Nums-Tabellen in Tonal-Cards.

### Print-View

- `@media print` in `globals.css` neu schreiben: Hero-Card auf weiß setzen (Druckkosten sparen), Tonal-Surfaces als sehr hellgraue Flächen, Δ-Werte und Hero-Zahl in Schwarz, Indigo wird zu Schwarz konvertiert.
- `data-print="hide"`-Pattern bleibt für Buttons.

### Mobile-Layout

- M3 ist mobil-first; vorhandene `sm:`/`md:`-Breakpoints bleiben struktur-relevant. Stat-Grid wird auf Mobile zu Single-Column. Wizard-Step-Chips wickeln um. Hero-Number skaliert mit `clamp(48px, 8vw, 96px)`.

## Tokens (aus Mockup-Spec übernommen)

```
Primary                       #2E4BAE
On-Primary                    #FFFFFF
Primary-Container             #DEE0FF
On-Primary-Container          #00105C
Secondary-Container           #E2E1EC
On-Secondary-Container        #1A1B23
Tertiary                      #735471
Tertiary-Container            #FED7F7
On-Tertiary-Container         #2B122B
Surface                       #FBFAFF
Surface-Container             #F0EFF7
Surface-Container-High        #E7E6F0
Surface-Container-Highest     #DEDDE6
On-Surface                    #1A1B21
On-Surface-Variant            #45464F
Outline                       #767680
Outline-Variant               #C7C5D0
Error                         #BA1A1A
Error-Container               #FFDAD6
Success                       #2E6A1F
Success-Container             #B6F2A1
```

Implementierung in Tailwind: jedes Token wird sowohl als CSS Custom Property in `globals.css` (`:root { --m3-primary: #2E4BAE; ... }`) als auch als Tailwind-Color (`primary`, `on-primary`, `primary-container` …) im `tailwind.config.ts` registriert. Komponenten dürfen beide Wege nutzen — Inline-Style nur, wenn ein dynamisches Token-Sampling nötig ist.

## Akzentregeln (aus Mockup-Spec übernommen)

1. **Eine Hero-Stelle pro Screen** in Display-Größe.
2. **Aktive States** bekommen `primary-container`-Background, nie nur Border.
3. **Tertiary** nur sparsam: max. eine Tertiary-Fläche pro Screen, Ergebnis-Screen darf zwei (Δ + Tip).
4. **Warnungen** als Filled Card auf `error-container`, Icon-Slot links.
5. **Sekundäre Stats** in `surface-container-high`.
6. **Custom-Success-Token** ausschließlich für die positive Sparquoten-Bewertung im Ergebnis-Screen.

## Test-Strategie

- Unit-Tests (`*.test.ts` für Berechnungen, Defaults, Presets, Explain-Texte) sind UI-frei und müssen ohne Änderung grün bleiben — `npm run test` ist die Akzeptanz.
- Aktuell gibt es keine UI-Snapshot- oder RTL-Tests, die auf konkrete CSS-Klassen prüfen — somit kein Test-Bruch durch CSS-Wechsel zu erwarten.
- Visuelle Verifikation: Side-by-Side-Vergleich Werkstatt (5173) vs M3 (5174) für jeden Screen.

## Migration-Reihenfolge (Begründung)

1. **Foundation zuerst** — Tokens und Schrift sind Voraussetzung für alle Komponenten.
2. **UI-Primitives bevor Composites** — Button/Card/Input werden in mehreren Screens verwendet, eine späte Änderung wäre Mehrarbeit.
3. **Neue Primitives (Slider, ChoiceChip) bevor BasicsStep/AssumptionsStep**, weil diese Screens sie nutzen.
4. **App-Shell + WelcomeScreen + Wizard-Wrapper** — der visuell sichtbare Rahmen, in den die Module gerendert werden.
5. **Modul-Screens in Wizard-Reihenfolge** (Basics → Income → Renteninfo → Assumptions → Result) — so kann nach jedem Schritt durchgeklickt werden.
6. **Hilfs-Komponenten** (`AssetsManager`, `AllocationManager`, `Disclosure`, `PensionRechenweg`).
7. **Print + Mobile Polish** zum Schluss.
8. **Final-Sweep** gegen das Mockup, dann Tag setzen.

Nach jedem Migrationsschritt soll `npm run test` und `npm run build` grün sein. Der Worktree muss jederzeit lauffähig bleiben — auch in Zwischenständen — damit der Side-by-Side-Vergleich funktioniert.

## Annahmen & offene Punkte

- **Roboto Flex** wird via Google Fonts CDN geladen (online-Vorbehalt akzeptiert; eine späte Self-Hosting-Optimierung ist denkbar).
- **`@types/node` 25.6.0** und Vite 5 sind unverändert kompatibel mit den geplanten Änderungen.
- Die bestehende **Tailwind-Konfiguration** wird umgeschrieben; Komponenten die alte Farben (`text-ink-900`, `bg-paper-50`, `bg-mustard-400`, `border-brick-600`) benutzen müssen alle migriert werden, sonst scheitert der Build (Tailwind kennt diese Farben nach der Umstellung nicht mehr).
- Die **Mockup-Hero-Zahl von 96 px** weicht von der Spec-Display-Large-Definition (57 px) ab. Wir übernehmen die 96 px als bewusste Steigerung des Mockup-Eindrucks und dokumentieren es in `globals.css`.

## Erfolgskriterium

- `npm run typecheck`, `npm run test`, `npm run build`, `npm run lint` alle grün im M3-Worktree
- Alle Wizard-Screens, Welcome, Result, Profile-Vergleich, Print-View und Mobile-Layout im neuen Look durchklickbar
- Keine Werkstatt-Token mehr im Code (`grep -r 'ink-\|paper-\|mustard-\|brick-' src/` liefert keine Treffer)
- Side-by-Side-Vergleich Werkstatt vs M3 lieferbar (Dev-Server auf 5173 + 5174)
- Tag `werkstatt-final` auf `main`-HEAD gesetzt vor Merge
