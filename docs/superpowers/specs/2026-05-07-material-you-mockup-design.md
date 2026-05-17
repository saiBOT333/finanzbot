# Material-You-Mockup-Pilot — Designspezifikation

**Datum:** 2026-05-07
**Branch (Worktree):** `claude/xenodochial-shaw-987d99`
**Status:** Designvorschlag, freigegeben durch User

## Ziel

Testweise Übersetzung der bestehenden FinanzBot-Designsprache („Werkstatt") in Googles Material-You / Material-3-Sprache. Hochauflösendes HTML-Mockup ohne Eingriff in den App-Code. Output dient als Entscheidungsgrundlage, ob der M3-Look später in den echten Code übernommen wird.

Der bestehende „Werkstatt"-Look bleibt unverändert. Das Mockup wird parallel über die Brainstorming-Visual-Companion ausgeliefert, nicht als App-Build.

## Nicht-Ziele

- **Keine** Änderung an React-Komponenten, Tailwind-Konfiguration oder App-Code.
- **Keine** Implementierung als wiederverwendbares Designsystem.
- **Keine** Dark-Mode-Variante (nur Light für den Pilot).
- **Keine** mobile Breakpoint-Studie — Desktop-First, eine Breite (1280 px Container).
- **Keine** vollständige App-Abdeckung — nur drei Schlüssel-Screens.

## Mockup-Inhalt (3 Screens)

Eine einzelne HTML-Datei mit Tab-Switcher oben. Alle Daten hardcoded gegen ein realistisches Beispiel-Profil (35 J., 3.200 € Netto, Konservativ → 2.341 €/Monat Rente).

### Screen 1 — Welcome

Übernimmt Inhalte aus `src/components/WelcomeScreen.tsx`:

- Hero-Headline: „Wie viel musst du sparen, damit die Rente reicht?"
- Vier Spec-Zeilen: Dauer · Privatsphäre · Vorbereitung · Backup
- Filled-Button „Loslegen →"
- Disclaimer-Zeile „Keine Anlageberatung · Orientierungshilfe"

### Screen 2 — Wizard-Step (BasicsStep)

Repräsentativer Eingabe-Schritt:

- M3 Linear Progress Indicator + 5 nummerierte Step-Chips oben
- Headline „Eckdaten" + Subheadline
- M3 Filled Text Fields: Alter, gewünschtes Renteneintrittsalter
- M3 Slider: Inflationsannahme
- M3 Choice Chips: Profil-Auswahl (Konservativ / Investor / Eigene Einstellungen)
- Tooltip-Icons als M3 Filled Tonal Icon Buttons
- Nav-Buttons unten: Zurück (Text-Button) + Weiter (Filled-Button)

### Screen 3 — Ergebnis

Das Schaufenster:

- Hero-Sparrate als Display-Zahl auf Tonal-Surface (Primary-Container-Background)
- Drei Stat-Cards: Sparquote, Rentenlücke, Kapitalbedarf — in `surface-container-high`
- A/B-Vergleichstabelle Konservativ vs Investor (kleine Tabelle, AKTIV-Badge auf gewähltem Profil)
- „Lesehinweis"-Card in `tertiary-container` (Tonal Plum) — markiert die Real-vs-Nominal-Erläuterung
- Sekundär-Action „Drucken" als Tonal Button

## Designsystem-Tokens (Material 3, Indigo-Seed)

### Farben (Light Scheme)

```
Primary                       #2E4BAE   Buttons, FAB, aktive States
On-Primary                    #FFFFFF
Primary-Container             #DEE0FF   sekundäre Buttons, Chips, Hero-Surface
On-Primary-Container          #00105C
Secondary-Container           #E2E1EC   neutrale Tonal-Surfaces
On-Secondary-Container        #1A1B23
Tertiary                      #735471   Akzent für Δ-Werte, Wow-Momente (sparsam)
Tertiary-Container            #FED7F7
On-Tertiary-Container         #2B122B
Surface                       #FBFAFF   App-Background
Surface-Container             #F0EFF7   Standard-Karten
Surface-Container-High        #E7E6F0   gehobene Karten
Surface-Container-Highest     #DEDDE6
On-Surface                    #1A1B21
On-Surface-Variant            #45464F
Outline                       #767680
Outline-Variant               #C7C5D0
Error                         #BA1A1A
Error-Container               #FFDAD6
Success                       #2E6A1F   positive Sparquoten-Bewertung (Custom-Token)
Success-Container             #B6F2A1
```

### Typografie

- Schriftfamilie: **Roboto Flex** (variabel) für alle Rollen
- **Display Large** (Hero-Zahlen): 57 px / Weight 700 / `letter-spacing: -0.02em`
- **Headline Medium** (Section-Titel): 28 px / 500
- **Title Medium** (Card-Header): 16 px / 500
- **Body Large** (Fließtext): 16 px / 400 / `line-height: 1.5`
- **Label Large** (Buttons, Chips): 14 px / 500 / `letter-spacing: 0.01em`
- **Label Small** (Eyebrows): 11 px / 500 / `text-transform: uppercase` / `letter-spacing: 0.08em`
- Zahlen mit `font-variant-numeric: tabular-nums`
- Die bisher genutzte Mono-Schrift entfällt vollständig

### Shape

- Karten / Surfaces: 16 px Radius (Standard), 24 px (große Hero-Cards)
- Buttons: 20 px Radius (Filled & Outlined), Pill-shape (kapsuliert) bei FAB
- Text Fields: 4 px Radius oben, 0 unten (M3 Filled-Variante)
- Chips: 8 px Radius

### Elevation (über Tonal-Surfaces, keine Schatten)

- Level 0: `surface` (App-Hintergrund)
- Level 1: `surface-container` (Standard-Karten)
- Level 2: `surface-container-high` (gehobene Karten, Hero)
- Level 3: `surface-container-highest` (Modal-Sheets — im Pilot ungenutzt)

Schlagschatten nur dezent für FAB / Sticky-Header (Box-Shadow `0 2px 6px rgba(46, 75, 174, 0.08)`).

## Komponenten-Mapping (Werkstatt → M3)

| Werkstatt-Element                       | Material 3-Pendant                                            |
| --------------------------------------- | ------------------------------------------------------------- |
| `Card` mit harter 1px-Border            | Filled Card / Tonal Surface, 16–24 px Radius                  |
| Mono-Eyebrow `01 — MODUL VORSORGE`      | M3 Label Large in Pill-Form (Primary-Container-Background)    |
| `hairline` Divider                      | `outline-variant` 1 px — oder weglassen, wenn Surface trennt  |
| Primärer Filled-Button (schwarz)        | M3 Filled Button (Primary)                                    |
| Ghost-Button                            | M3 Text-Button                                                |
| Wizard-Stepper als Mono-Liste           | M3 Linear Progress Indicator + nummerierte Step-Chips         |
| Tooltip-Icon                            | M3 Filled Tonal Icon Button                                   |
| Hero-Sparrate als gigantische Mono-Zahl | Display-Large auf Primary-Container-Surface                   |
| Sparquoten-Einordnungs-Banner           | M3 Filled Card mit kontextueller Surface (success/warning)    |
| „Achtung"-Box (Renteninfo fehlt)        | M3 Filled Card auf `error-container` mit Icon-Slot links      |
| Stat-Block (Label + Mono-Zahl)          | M3 Outlined Card oder `surface-container-high` mit Title-Wert |
| A/B-Vergleichstabelle                   | M3 Data Table, AKTIV-Badge als Filled Chip                    |

## „Wichtige Stellen deutlich machen" — Akzentregeln

1. **Eine Hero-Zahl pro Screen** in Display-Large auf Primary-Container-Surface.
2. **Aktive States** (gewählter Wizard-Step, gewähltes Profil) bekommen `primary-container`-Background — nie nur Border.
3. **Tertiary-Color (Plum #735471)** ausschließlich für Δ-Werte oder einzelne „Wow"-Momente. Maximal eine Tertiary-Fläche pro Screen.
4. **Warnungen** als Filled Card auf `error-container`, Icon-Slot links.
5. **Sekundäre Stats** in `surface-container-high` — Outline statt sichtbarer Linie.
6. **Sparquoten-Einordnung** nutzt das Custom-Success-Token (#2E6A1F) wenn ≥ Zielkorridor, sonst Tertiary.

## Lieferform

- **Eine Datei:** `.superpowers/brainstorm/<session>/content/werkstatt-m3-mockup.html`
- **Aufbau:** Tab-Switcher oben (Welcome / Wizard / Ergebnis), je Tab ein Section-Block
- **Kein** React, **kein** Tailwind-Build — reines HTML + CSS (Custom Properties für Tokens) + minimales JS für Tab-Switch
- **Visualisierung:** über laufende Visual-Companion-Session unter localhost:51332 (Auto-Reload bei neuer Datei)
- **Persistenz:** liegt im Worktree und überlebt Server-Neustart

## Annahmen & offene Punkte

- Roboto Flex wird via Google Fonts CDN geladen (offline-Vorbehalt akzeptiert für ein Mockup).
- Beispieldaten sind ausgedacht, aber realistisch — keine echten User-Profile.
- Screen-Reader-/A11y-Tests sind im Mockup-Stadium nicht Teil der Lieferung.
- Falls Roboto Flex an einer Stelle visuell nicht trägt (z. B. extreme Display-Größen), darf manuell auf Roboto Serif für Akzent-Headlines gewechselt werden — wird im Mockup dokumentiert.
- Der Pilot trifft **keine** Aussage darüber, ob/wie M3 in den echten React-Code überführt wird. Diese Entscheidung erfolgt nach visueller Beurteilung.

## Erfolgskriterium

Nach dem Klick durch alle drei Screens kann der User entscheiden:

- **Fortsetzen:** Material You als neue FinanzBot-Designsprache übernehmen (separater Plan)
- **Verwerfen:** Werkstatt-Look bleibt
- **Mischform:** einzelne M3-Bausteine (z. B. Tonal Surfaces, Akzentregeln) ins Werkstatt-Design adaptieren
