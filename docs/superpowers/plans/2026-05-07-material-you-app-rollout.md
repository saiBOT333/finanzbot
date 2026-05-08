# Material-You-App-Rollout — Implementierungsplan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Den vom Mockup-Pilot freigegebenen Material-You-Look (Indigo-Seed) in der echten React/Tailwind-App umsetzen — In-Place-Replacement aller UI-Primitives, der App-Shell, aller Modul-Screens, Print-View und Mobile-Layout.

**Architecture:** Tokens werden zuerst additiv neben den Werkstatt-Tokens registriert (Build bleibt grün), Komponenten Stück für Stück migriert (jede in einer eigenen Task), am Ende werden die Werkstatt-Tokens entfernt. Reversibilität ausschließlich über Git-Tag `werkstatt-final`.

**Tech Stack:** React 18 + TypeScript + Vite 5 + Tailwind 3 + Vitest. Roboto Flex via Google Fonts. Kein neues Framework, keine neuen Dependencies außer Schrift.

**Spec:** [`docs/superpowers/specs/2026-05-07-material-you-app-rollout-design.md`](../specs/2026-05-07-material-you-app-rollout-design.md)

**Mockup-Spec (Quelle für Tokens und Akzentregeln):** [`docs/superpowers/specs/2026-05-07-material-you-mockup-design.md`](../specs/2026-05-07-material-you-mockup-design.md)

**Worktree:** `C:\Users\realt\Documents\AI Projects\FinanzBot\.claude\worktrees\xenodochial-shaw-987d99` (Branch `claude/xenodochial-shaw-987d99`)

---

## File Structure

| Datei                                            | Verantwortung                                                                                                | Phase |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ | ----- |
| `index.html`                                     | Roboto-Flex-Link in `<head>`                                                                                  | 1     |
| `tailwind.config.ts`                             | M3 Token-Palette (additive in Phase 1, exklusiv in Phase 5)                                                   | 1+5   |
| `src/styles/globals.css`                         | M3 CSS Custom Properties, Body-Defaults, neue Eyebrow-Pill-Klasse, Print-Styles für M3                       | 1+5   |
| `src/components/ui/Button.tsx`                   | M3 Button mit Varianten `filled`, `tonal`, `text`, `outlined`                                                | 2     |
| `src/components/ui/Card.tsx`                     | M3 Tonal Card                                                                                                | 2     |
| `src/components/ui/Input.tsx`                    | M3 Filled Text Field                                                                                         | 2     |
| `src/components/ui/Field.tsx`                    | Wrapper mit Pill-Eyebrow + Supporting-Text                                                                   | 2     |
| `src/components/ui/Select.tsx`                   | M3 Filled Select                                                                                             | 2     |
| `src/components/ui/Tooltip.tsx`                  | M3 Plain Tooltip                                                                                             | 2     |
| `src/components/InfoTooltip.tsx`                 | M3 Filled Tonal Icon Button als Trigger                                                                      | 2     |
| `src/components/ui/Slider.tsx`                   | **NEU** — M3 Range Slider (kontrolliert)                                                                     | 2     |
| `src/components/ui/Chip.tsx`                     | **NEU** — M3 Chip                                                                                            | 2     |
| `src/components/ui/ChoiceChip.tsx`               | **NEU** — selektierbarer Chip (Single- oder Multi-Choice)                                                    | 2     |
| `src/App.tsx`                                    | App-Shell mit M3 Header/Footer/Module-Switcher                                                               | 3     |
| `src/components/WelcomeScreen.tsx`               | M3 Hero + Spec-Liste + Filled CTA                                                                            | 3     |
| `src/components/Wizard.tsx`                      | Linear Progress + Step-Chips                                                                                 | 3     |
| `src/components/NumberInput.tsx`                 | nutzt das neue Filled Text Field intern                                                                      | 3     |
| `src/modules/pension/steps/BasicsStep.tsx`       | Filled Text Fields, Slider (Inflation), ChoiceChips (Profil)                                                 | 4     |
| `src/modules/pension/steps/IncomeStep.tsx`       | Filled Text Fields                                                                                           | 4     |
| `src/modules/pension/steps/PensionInformationStep.tsx` | Filled Text Fields, Warnungen als Filled Card auf `error-container`                                    | 4     |
| `src/modules/pension/steps/AssumptionsStep.tsx`  | Slider (Realrenditen, Steuersatz), ChoiceChips (Auszahlungsmethode)                                          | 4     |
| `src/modules/pension/steps/ResultStep.tsx`       | Hero-Card, Stat-Grid, A/B-Tabelle, Tip-Card                                                                  | 4     |
| `src/modules/pension/PensionRechenweg.tsx`       | Tonal-Cards mit tabular-nums Tabellen                                                                        | 4     |
| `src/components/AssetsManager.tsx`               | M3-Karten + neue Buttons/Inputs                                                                              | 4     |
| `src/components/AllocationManager.tsx`           | M3-Karten + neue Buttons/Inputs                                                                              | 4     |
| `src/components/Disclosure.tsx`                  | M3 Outlined Card mit Chevron                                                                                 | 4     |

Phasen: **1** Foundation · **2** UI-Primitives · **3** Shell + Wizard · **4** Modul-Screens · **5** Cleanup + Print + Mobile + Final.

---

## Globale Konvention für alle Tasks

- **Working Directory:** `C:\Users\realt\Documents\AI Projects\FinanzBot\.claude\worktrees\xenodochial-shaw-987d99`
- Nach jedem Code-Task: `npm run typecheck && npm run test && npm run build` muss grün sein.
- Build muss in jedem Zwischenstand lauffähig bleiben — Werkstatt-Tokens werden bis Phase 5 nicht entfernt, deshalb darf eine teilmigrierte App auf Werkstatt-Klassen weiterhin zugreifen.
- Tailwind-Color-Tokens werden im Code als Klassen wie `bg-primary`, `text-on-surface`, `border-outline-variant` benutzt. CSS-Custom-Properties (`var(--m3-primary)`) nur dann, wenn ein Wert dynamisch ist (z. B. `color-mix`).
- Commits in Deutsch, Format `feat(m3): …` für neue Komponenten, `refactor(m3): …` für Migrationen, `chore(m3): …` für Konfig, `polish(m3): …` für Cleanups.

---

# Phase 1 — Foundation

## Task 1: Roboto Flex einbinden

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Roboto-Flex-Link in `<head>` einfügen**

In `index.html`, vor dem schließenden `</head>` ergänzen (zusätzlich zu allem, was schon dort steht — bestehende Links/Meta nicht entfernen):

```html
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Roboto+Flex:opsz,wght@8..144,400;8..144,500;8..144,600;8..144,700&display=swap" rel="stylesheet" />
```

- [ ] **Step 2: Verifizieren**

Run: `npm run build`
Expected: PASS — kein Fehler durch HTML-Änderung.

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "chore(m3): Roboto Flex via Google Fonts einbinden"
```

---

## Task 2: M3-Tokens additiv in `tailwind.config.ts`

**Files:**
- Modify: `tailwind.config.ts`

Ziel: M3-Farben und -Radii werden zusätzlich registriert. Werkstatt-Tokens bleiben bis Phase 5 erhalten.

- [ ] **Step 1: M3-Tokens ergänzen**

In `tailwind.config.ts`, im `theme.extend.colors`-Objekt **zusätzlich** zu den bestehenden Einträgen folgende Schlüssel einfügen (NICHT die bestehenden `paper`, `ink`, `mustard`, `brand`, `brick`, `rule` entfernen):

```ts
        // === Material 3 Indigo Seed === (additive — Werkstatt-Tokens bleiben)
        // Flache Top-Level-Keys nach M3-Konvention "on-X" für Inhaltsfarben.
        primary: "#2E4BAE",
        "on-primary": "#FFFFFF",
        "primary-container": "#DEE0FF",
        "on-primary-container": "#00105C",
        "secondary-container": "#E2E1EC",
        "on-secondary-container": "#1A1B23",
        tertiary: "#735471",
        "tertiary-container": "#FED7F7",
        "on-tertiary-container": "#2B122B",
        surface: "#FBFAFF",
        "surface-container": "#F0EFF7",
        "surface-container-high": "#E7E6F0",
        "surface-container-highest": "#DEDDE6",
        "on-surface": "#1A1B21",
        "on-surface-variant": "#45464F",
        outline: "#767680",
        "outline-variant": "#C7C5D0",
        error: "#BA1A1A",
        "error-container": "#FFDAD6",
        success: "#2E6A1F",
        "success-container": "#B6F2A1",
```

Im `theme.extend.fontFamily`-Objekt **zusätzlich** ergänzen:

```ts
        m3: ['"Roboto Flex"', "system-ui", "sans-serif"],
```

Im `theme.extend`-Objekt am Ende (auf gleicher Ebene wie `colors`, `fontFamily`, `letterSpacing`) ergänzen:

```ts
      borderRadius: {
        "m3-sm": "8px",
        "m3-md": "16px",
        "m3-lg": "24px",
        "m3-button": "20px",
        "m3-pill": "999px",
      },
      boxShadow: {
        "m3-elev1": "0 1px 2px 0 rgba(0,0,0,0.05)",
        "m3-elev2": "0 2px 6px 0 rgba(46, 75, 174, 0.10)",
      },
```

**Wichtig:** Tailwind 3 hat keine eingebauten Color-Tokens namens `primary`, `tertiary`, `surface`, `outline`, `error` oder `success` — die Top-Level-Keys oben sind also kollisionsfrei. Generierte Klassen sind z. B. `bg-primary`, `text-on-primary`, `bg-primary-container`, `text-on-primary-container`, `bg-surface`, `bg-surface-container-high`, `text-on-surface`, `text-on-surface-variant`, `border-outline-variant`, `bg-error-container`, `text-error`, `bg-success-container`. Der `on-X`-Prefix bezeichnet immer die Inhaltsfarbe (Text/Icon) auf der jeweiligen Surface.

- [ ] **Step 2: Verifizieren**

Run: `npm run build`
Expected: PASS — Tailwind kompiliert mit beiden Token-Sets.

- [ ] **Step 3: Commit**

```bash
git add tailwind.config.ts
git commit -m "chore(m3): Material-3-Tokens additiv in Tailwind registrieren"
```

---

## Task 3: M3-Basis in `globals.css`

**Files:**
- Modify: `src/styles/globals.css`

Ziel: CSS-Custom-Properties als Single-Source für dynamische Werte, Body-Default auf Roboto Flex und neue Surface-Farbe, Eyebrow-Pill als Utility-Klasse, M3-spezifische Print-Regeln.

- [ ] **Step 1: M3-Basis ergänzen**

Den `@layer base`-Block in `src/styles/globals.css` (Zeilen 5–31) **vollständig ersetzen** durch:

```css
@layer base {
  :root {
    /* M3 Indigo Seed — als CSS Custom Properties für dynamische Werte (color-mix etc.) */
    --m3-primary: #2E4BAE;
    --m3-on-primary: #FFFFFF;
    --m3-primary-container: #DEE0FF;
    --m3-on-primary-container: #00105C;
    --m3-secondary-container: #E2E1EC;
    --m3-on-secondary-container: #1A1B23;
    --m3-tertiary: #735471;
    --m3-tertiary-container: #FED7F7;
    --m3-on-tertiary-container: #2B122B;
    --m3-surface: #FBFAFF;
    --m3-surface-container: #F0EFF7;
    --m3-surface-container-high: #E7E6F0;
    --m3-surface-container-highest: #DEDDE6;
    --m3-on-surface: #1A1B21;
    --m3-on-surface-variant: #45464F;
    --m3-outline: #767680;
    --m3-outline-variant: #C7C5D0;
    --m3-error: #BA1A1A;
    --m3-error-container: #FFDAD6;
    --m3-success: #2E6A1F;
    --m3-success-container: #B6F2A1;
  }

  html {
    font-family: 'Roboto Flex', system-ui, sans-serif;
  }

  body {
    @apply min-h-screen text-on-surface;
    background-color: var(--m3-surface);
    font-variant-numeric: tabular-nums;
  }

  ::selection {
    background-color: var(--m3-primary-container);
    color: var(--m3-on-primary-container);
  }

  :focus-visible {
    @apply outline-none;
    box-shadow: 0 0 0 2px var(--m3-surface), 0 0 0 4px var(--m3-primary);
  }
}
```

Den `@layer components`-Block (Zeilen 33–78) **vollständig ersetzen** durch:

```css
@layer components {
  .container-page {
    @apply mx-auto w-full max-w-3xl px-5 py-10 sm:px-8;
  }

  /* M3 Eyebrow-Pill: kleines Label auf Primary-Container. */
  .m3-eyebrow {
    @apply inline-block rounded-m3-pill bg-primary-container px-3.5 py-1.5 text-[11px] font-medium uppercase tracking-[0.08em] text-on-primary-container;
  }

  /* M3 Eyebrow-Variant: für Sekundärbereiche (Surface-Container-High). */
  .m3-eyebrow-muted {
    @apply inline-block rounded-m3-pill bg-surface-container-high px-3.5 py-1.5 text-[11px] font-medium uppercase tracking-[0.08em] text-on-surface-variant;
  }

  /* Hero-Display-Zahl wie auf dem Ergebnis-Screen. */
  .m3-display {
    font-size: clamp(48px, 8vw, 96px);
    font-weight: 700;
    letter-spacing: -0.03em;
    line-height: 0.95;
  }
}
```

Den `@media print`-Block (Zeilen 80–115) **vollständig ersetzen** durch:

```css
/* ──────────────────────────────────────────────────────────────────────────
 * Print stylesheet (M3)
 * ──────────────────────────────────────────────────────────────────────── */
@media print {
  body {
    background: white !important;
    color: black !important;
  }

  header,
  footer,
  ol[aria-label],
  [data-print="hide"] {
    display: none !important;
  }

  .container-page {
    @apply max-w-full px-0 py-0;
  }

  /* Alle Tonal-Surfaces im Druck zu hellem Grau, Hero-Card weiß. */
  [class*="bg-primary-container"],
  [class*="bg-tertiary-container"],
  [class*="bg-surface-container"] {
    background: #f4f4f4 !important;
    color: black !important;
  }
  [class*="bg-primary"]:not([class*="container"]) {
    background: white !important;
    color: black !important;
    border: 1px solid #cccccc;
  }
  [class*="text-primary"],
  [class*="text-tertiary"] {
    color: black !important;
  }
  [class*="shadow-"] {
    box-shadow: none !important;
  }

  h2,
  h3 {
    page-break-after: avoid;
  }
}
```

- [ ] **Step 2: Verifizieren**

Run: `npm run build`
Expected: PASS. Wenn der Build wegen einer M3-Klasse die nicht in Tailwind aufgelöst werden kann scheitert, prüfe dass Task 2 die nötigen Token-Schlüssel registriert hat (`primary-container`, `surface-container-high` usw.).

- [ ] **Step 3: Visuelle Smoke-Test**

Run: `npm run dev -- --port 5174`
Expected: App startet, Roboto Flex ist sichtbar als Body-Schrift, Hintergrund ist hell-bläulich (`#FBFAFF`). Komponenten sehen noch aus wie Werkstatt — das ist OK in dieser Phase.

Nach dem Smoke-Test: Server stoppen mit Ctrl+C.

- [ ] **Step 4: Commit**

```bash
git add src/styles/globals.css
git commit -m "chore(m3): globals.css auf M3-Basis (Custom Properties, Eyebrow, Print)"
```

---

# Phase 2 — UI-Primitives

## Task 4: `Button.tsx` auf M3-Varianten umstellen

**Files:**
- Modify: `src/components/ui/Button.tsx`

Ziel: Button bekommt vier M3-Varianten — `filled` (Primary, Default), `tonal` (Secondary-Container), `text`, `outlined`.

- [ ] **Step 1: Datei vollständig ersetzen**

`src/components/ui/Button.tsx` ersetzen durch:

```tsx
import type { ButtonHTMLAttributes } from "react";

type Variant = "filled" | "tonal" | "text" | "outlined";
type Size = "md" | "sm";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

const base =
  "inline-flex items-center justify-center gap-2 font-medium tracking-[0.01em] transition-colors disabled:cursor-not-allowed disabled:opacity-40 rounded-m3-button focus-visible:outline-none";

const variants: Record<Variant, string> = {
  filled:
    "bg-primary text-on-primary hover:brightness-110 active:brightness-95",
  tonal:
    "bg-secondary-container text-on-secondary-container hover:brightness-95",
  text: "bg-transparent text-primary hover:bg-primary-container",
  outlined:
    "bg-transparent text-primary border border-outline hover:bg-primary-container",
};

const sizes: Record<Size, string> = {
  md: "h-11 px-6 text-[15px]",
  sm: "h-9 px-4 text-[14px]",
};

export function Button({
  variant = "filled",
  size = "md",
  className = "",
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`.trim()}
      {...rest}
    />
  );
}
```

**Hinweis zu den Klassen:** `text-on-primary` und `text-on-primary-container` lösen über die Tailwind-Color-Schlüssel `primary.on` und `primary.on-container` aus Task 2 auf. Falls Tailwind die Bindestrich-Variante nicht akzeptiert, weicht man auf `text-[color:var(--m3-on-primary)]` aus.

- [ ] **Step 2: Bestehende Verwendungen prüfen**

Run: `grep -rn "variant=\"primary\"\|variant=\"secondary\"\|variant=\"ghost\"" src/`

Erwartet: Liste aller alten Variant-Namen, die jetzt zu Build-Fehlern führen würden. Jede Stelle entweder anpassen oder als Default lassen (wenn keine Variant-Prop gesetzt war, ist Default jetzt `filled` statt `primary`).

Übersetzungen:
- `variant="primary"` → entfernen (ist jetzt Default `filled`) ODER explizit `variant="filled"`
- `variant="secondary"` → `variant="outlined"`
- `variant="ghost"` → `variant="text"`

Konkrete Edits an gefundenen Stellen durchführen.

- [ ] **Step 3: Verifizieren**

Run: `npm run typecheck && npm run build`
Expected: PASS. Falls TS-Fehler an Stellen die die alten Variant-Namen nutzen — Schritt 2 erneut ausführen.

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/Button.tsx src/
git commit -m "refactor(m3): Button auf filled/tonal/text/outlined umstellen"
```

---

## Task 5: `Card.tsx` auf M3 Tonal Card umstellen

**Files:**
- Modify: `src/components/ui/Card.tsx`

- [ ] **Step 1: Datei vollständig ersetzen**

`src/components/ui/Card.tsx` ersetzen durch:

```tsx
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
```

- [ ] **Step 2: Verifizieren**

Run: `npm run typecheck && npm run build`
Expected: PASS — kein Aufrufer braucht eine `variant`-Prop, alle Default-Aufrufe (`<Card>...</Card>`) bekommen jetzt `filled`.

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/Card.tsx
git commit -m "refactor(m3): Card auf Tonal-Surface mit Varianten filled/outlined/hero"
```

---

## Task 6: `Input.tsx` und `Field.tsx` auf M3 Filled Text Field

**Files:**
- Modify: `src/components/ui/Input.tsx`
- Modify: `src/components/ui/Field.tsx`

- [ ] **Step 1: `Input.tsx` ersetzen**

`src/components/ui/Input.tsx` ersetzen durch:

```tsx
import { forwardRef, type InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  invalid?: boolean;
};

/**
 * M3 Filled Text Field — gefärbte Surface, 2px Bottom-Border, oben abgerundet.
 * - Hover: leichte Aufhellung (über brightness)
 * - Focus: Bottom-Border wechselt zu Primary
 * - Invalid: Bottom-Border und Text in Error
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ invalid = false, className = "", ...rest }, ref) => {
    const tone = invalid
      ? "text-error border-error"
      : "text-on-surface border-on-surface-variant focus:border-primary";
    return (
      <input
        ref={ref}
        className={`block h-12 w-full rounded-t-m3-sm border-b-2 bg-surface-container-high px-4 text-[16px] tabular-nums placeholder:text-on-surface-variant focus:outline-none ${tone} ${className}`.trim()}
        {...rest}
      />
    );
  },
);
Input.displayName = "Input";
```

- [ ] **Step 2: `Field.tsx` ersetzen**

`src/components/ui/Field.tsx` ersetzen durch:

```tsx
import { useId, type ReactNode } from "react";

type FieldProps = {
  label: ReactNode;
  /** Optional inline element next to the label (z. B. ein Tooltip-Button). */
  adornment?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  children: (id: string) => ReactNode;
};

/**
 * M3 Field — Label oberhalb (kleiner uppercase Text), Eingabefeld unten,
 * Supporting Text (Hint/Error) darunter mit gleicher Höhe-Reservierung.
 */
export function Field({
  label,
  adornment,
  hint,
  error,
  required = false,
  children,
}: FieldProps) {
  const id = useId();
  const errorId = `${id}-error`;
  const showError = error != null;
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className="flex min-h-[16px] items-center gap-2 text-[12px] font-medium uppercase tracking-[0.04em] text-on-surface-variant"
      >
        <span>
          {label}
          {required && <span className="ml-1 text-primary">*</span>}
        </span>
        {adornment}
      </label>
      {children(id)}
      {showError ? (
        <p
          id={errorId}
          className="text-[12px] font-medium text-error"
        >
          {error}
        </p>
      ) : (
        hint && (
          <p className="text-[12px] leading-snug text-on-surface-variant">{hint}</p>
        )
      )}
    </div>
  );
}
```

- [ ] **Step 3: Verifizieren**

Run: `npm run typecheck && npm run test && npm run build`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/Input.tsx src/components/ui/Field.tsx
git commit -m "refactor(m3): Input/Field auf M3 Filled Text Field"
```

---

## Task 7: `Select.tsx` und `Tooltip.tsx` auf M3

**Files:**
- Modify: `src/components/ui/Select.tsx`
- Modify: `src/components/ui/Tooltip.tsx`

- [ ] **Step 1: `Select.tsx` ersetzen**

```tsx
import { forwardRef, type SelectHTMLAttributes } from "react";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

/**
 * M3 Filled Select — gleiche Surface wie Filled Text Field.
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = "", children, ...rest }, ref) => (
    <select
      ref={ref}
      className={`block h-12 w-full rounded-t-m3-sm border-b-2 border-on-surface-variant bg-surface-container-high px-4 text-[15px] text-on-surface focus:border-primary focus:outline-none ${className}`.trim()}
      {...rest}
    >
      {children}
    </select>
  ),
);
Select.displayName = "Select";
```

- [ ] **Step 2: `Tooltip.tsx` ersetzen**

```tsx
import { useState, type ReactNode } from "react";

type TooltipProps = {
  content: ReactNode;
  children: ReactNode;
};

/**
 * M3 Plain Tooltip — abgerundetes Panel auf inverse Surface.
 */
export function Tooltip({ content, children }: TooltipProps) {
  const [open, setOpen] = useState(false);
  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {children}
      {open && (
        <span
          role="tooltip"
          className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 w-64 -translate-x-1/2 rounded-m3-sm bg-on-surface px-3 py-2 text-[12px] leading-relaxed text-surface shadow-m3-elev2"
        >
          {content}
        </span>
      )}
    </span>
  );
}
```

- [ ] **Step 3: Verifizieren**

Run: `npm run typecheck && npm run test && npm run build`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/Select.tsx src/components/ui/Tooltip.tsx
git commit -m "refactor(m3): Select/Tooltip auf M3-Look"
```

---

## Task 8: `InfoTooltip.tsx` als M3 Filled Tonal Icon Button

**Files:**
- Modify: `src/components/InfoTooltip.tsx`

- [ ] **Step 1: Datei ersetzen**

```tsx
import type { ReactNode } from "react";
import { Tooltip } from "./ui/Tooltip";

type InfoTooltipProps = {
  content: ReactNode;
  label?: string;
};

export function InfoTooltip({ content, label = "Erklärung" }: InfoTooltipProps) {
  return (
    <Tooltip content={content}>
      <button
        type="button"
        aria-label={label}
        className="inline-flex h-6 w-6 items-center justify-center rounded-m3-pill bg-secondary-container text-[12px] font-semibold leading-none text-on-secondary-container transition-colors hover:brightness-95"
      >
        i
      </button>
    </Tooltip>
  );
}
```

- [ ] **Step 2: Verifizieren**

Run: `npm run typecheck && npm run test && npm run build`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/InfoTooltip.tsx
git commit -m "refactor(m3): InfoTooltip als Filled Tonal Icon Button"
```

---

## Task 9: NEU — `Slider.tsx`

**Files:**
- Create: `src/components/ui/Slider.tsx`

Ziel: Kontrollierte Range-Komponente, M3-Optik. Wird in BasicsStep (Inflation) und AssumptionsStep (Realrenditen, Steuersatz) genutzt.

- [ ] **Step 1: Datei anlegen**

`src/components/ui/Slider.tsx` mit folgendem Inhalt:

```tsx
import { useId, type ChangeEvent } from "react";

type SliderProps = {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  label?: string;
  /** Formatierte Anzeige rechts neben dem Label, z. B. "2,0 %". */
  display?: string;
  ariaLabel?: string;
};

/**
 * M3 Range Slider. Nutzt das native <input type="range"> als A11y-Träger und
 * stylet Track/Thumb über Tailwind/CSS. Der Fill-Anteil wird per CSS-Variable
 * `--fill-pct` aus dem aktuellen Wert berechnet.
 */
export function Slider({
  value,
  onChange,
  min,
  max,
  step = 1,
  label,
  display,
  ariaLabel,
}: SliderProps) {
  const id = useId();
  const pct = ((value - min) / (max - min)) * 100;
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange(Number(e.target.value));
  };
  return (
    <div className="space-y-2">
      {(label || display) && (
        <div className="flex items-baseline justify-between">
          {label && (
            <label htmlFor={id} className="text-[14px] text-on-surface-variant">
              {label}
            </label>
          )}
          {display && (
            <span className="text-[18px] font-semibold text-primary tabular-nums">
              {display}
            </span>
          )}
        </div>
      )}
      <div className="relative h-6 flex items-center">
        <div
          className="absolute inset-x-0 h-1.5 rounded-full bg-surface-container-high"
          aria-hidden
        />
        <div
          className="absolute h-1.5 rounded-full bg-primary"
          aria-hidden
          style={{ width: `${pct}%` }}
        />
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleChange}
          aria-label={ariaLabel ?? label}
          className="m3-slider absolute inset-0 w-full appearance-none bg-transparent cursor-pointer focus:outline-none"
          style={{ ["--fill-pct" as string]: `${pct}%` }}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Slider-Thumb-Styles in `globals.css` ergänzen**

Innerhalb des `@layer components`-Blocks von `src/styles/globals.css`, **vor** dem schließenden `}` des Blocks ergänzen:

```css
  /* M3 Slider — Thumb-Styles (kann nicht über Tailwind allein, weil Vendor-Selektoren). */
  .m3-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: var(--m3-primary);
    border: 3px solid var(--m3-surface);
    box-shadow: 0 0 0 8px color-mix(in srgb, var(--m3-primary) 0%, transparent);
    transition: box-shadow 0.15s;
    cursor: pointer;
  }
  .m3-slider:hover::-webkit-slider-thumb,
  .m3-slider:focus::-webkit-slider-thumb {
    box-shadow: 0 0 0 8px color-mix(in srgb, var(--m3-primary) 12%, transparent);
  }
  .m3-slider::-moz-range-thumb {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: var(--m3-primary);
    border: 3px solid var(--m3-surface);
    cursor: pointer;
  }
```

- [ ] **Step 3: Verifizieren**

Run: `npm run typecheck && npm run build`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/Slider.tsx src/styles/globals.css
git commit -m "feat(m3): Slider-Komponente"
```

---

## Task 10: NEU — `Chip.tsx` und `ChoiceChip.tsx`

**Files:**
- Create: `src/components/ui/Chip.tsx`
- Create: `src/components/ui/ChoiceChip.tsx`

- [ ] **Step 1: `Chip.tsx` anlegen**

`src/components/ui/Chip.tsx`:

```tsx
import type { HTMLAttributes, ReactNode } from "react";

type Tone = "neutral" | "active" | "done" | "warning";

type ChipProps = HTMLAttributes<HTMLSpanElement> & {
  children: ReactNode;
  tone?: Tone;
  leading?: ReactNode;
};

const tones: Record<Tone, string> = {
  neutral: "bg-surface-container text-on-surface-variant",
  active: "bg-primary-container text-on-primary-container",
  done: "bg-success-container text-on-surface",
  warning: "bg-error-container text-on-surface",
};

/**
 * M3 Assist/Filter-Chip (read-only). Nicht interaktiv — für Status, Labels.
 * Für selektierbare Chips siehe ChoiceChip.
 */
export function Chip({
  className = "",
  tone = "neutral",
  leading,
  children,
  ...rest
}: ChipProps) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-m3-pill px-3.5 py-1.5 text-[13px] font-medium ${tones[tone]} ${className}`.trim()}
      {...rest}
    >
      {leading}
      {children}
    </span>
  );
}
```

- [ ] **Step 2: `ChoiceChip.tsx` anlegen**

`src/components/ui/ChoiceChip.tsx`:

```tsx
import type { ButtonHTMLAttributes, ReactNode } from "react";

type ChoiceChipProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  selected?: boolean;
  children: ReactNode;
};

/**
 * M3 Filter/Choice Chip (selektierbar). Im selected-State Secondary-Container
 * mit Häkchen-Prefix, sonst Outlined.
 */
export function ChoiceChip({
  selected = false,
  className = "",
  children,
  type = "button",
  ...rest
}: ChoiceChipProps) {
  const tone = selected
    ? "bg-secondary-container text-on-secondary-container border-transparent"
    : "bg-transparent text-on-surface border-outline hover:bg-surface-container";
  return (
    <button
      type={type}
      className={`inline-flex items-center gap-2 rounded-m3-sm border px-4 py-2.5 text-[14px] font-medium transition-colors ${tone} ${className}`.trim()}
      aria-pressed={selected}
      {...rest}
    >
      {selected && <span aria-hidden>✓</span>}
      {children}
    </button>
  );
}
```

- [ ] **Step 3: Verifizieren**

Run: `npm run typecheck && npm run build`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/Chip.tsx src/components/ui/ChoiceChip.tsx
git commit -m "feat(m3): Chip + ChoiceChip"
```

---

# Phase 3 — Shell, Welcome, Wizard

## Task 11: `App.tsx` auf M3-Shell umstellen

**Files:**
- Modify: `src/App.tsx`

Ziel: Header, Module-Switcher und Footer in M3-Optik. Der bestehende State-Code (Module-Loading, Welcome-Tracking, Import/Export) bleibt unverändert — nur das JSX ab `return (` wird angepasst.

- [ ] **Step 1: Datei lesen, Render-Block vollständig identifizieren**

Lies `src/App.tsx` ein. Der `return`-Block beginnt typischerweise um Zeile 65–70. Alles **ab `return (` bis `</div>` auf der vorletzten Zeile** wird ersetzt. Die Funktions-Logik (`useState`, `useRef`, `handleExport`, `handleReset`, `handleImportClick` usw.) bleibt **unverändert**.

- [ ] **Step 2: Render-Block ersetzen**

Den kompletten `return ( … );`-Block in `App.tsx` ersetzen durch:

```tsx
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 bg-surface/95 backdrop-blur">
        <div className="container-page py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-baseline gap-3">
              <span className="m3-eyebrow">FinanzBot</span>
              <span className="text-[14px] text-on-surface-variant">
                Modulare Finanzplanung · lokal · quelloffen
              </span>
            </div>
            <div className="flex flex-shrink-0 gap-1">
              <Button variant="text" size="sm" onClick={handleImportClick} title="Daten importieren">
                <span aria-hidden className="sm:hidden">📥</span>
                <span className="hidden sm:inline">Import</span>
              </Button>
              <Button variant="text" size="sm" onClick={handleExport} title="Daten exportieren">
                <span aria-hidden className="sm:hidden">📤</span>
                <span className="hidden sm:inline">Export</span>
              </Button>
              <Button
                variant="text"
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
                    <span aria-hidden>{m.icon}</span>
                    {m.name}
                  </ChoiceChip>
                ))}
              </nav>
            )}

            {active ? (
              <section className="space-y-8">
                <div className="space-y-3">
                  <span className="m3-eyebrow">Modul Vorsorge</span>
                  <h2 className="text-[40px] sm:text-[48px] font-semibold leading-[1.05] tracking-[-0.02em] text-on-surface">
                    <span className="mr-3 align-baseline text-3xl">{active.icon}</span>
                    {active.name}
                  </h2>
                  <p className="max-w-prose text-[15px] leading-relaxed text-on-surface-variant">
                    {active.description}
                  </p>
                </div>
                <Card>
                  <active.Component />
                </Card>
              </section>
            ) : (
              <Card>
                <p className="text-[14px] text-on-surface-variant">Keine Module aktiv.</p>
              </Card>
            )}
          </>
        )}
      </main>

      <footer className="container-page py-6">
        <p className="text-center text-[12px] tracking-[0.04em] text-on-surface-variant">
          Realgerechnete Orientierung · Keine Anlageberatung · Lokal &amp; quelloffen
        </p>
      </footer>
    </div>
  );
```

- [ ] **Step 3: Import für `ChoiceChip` ergänzen**

In `src/App.tsx`, in den oberen Imports ergänzen:

```tsx
import { ChoiceChip } from "./components/ui/ChoiceChip";
```

- [ ] **Step 4: Verifizieren**

Run: `npm run typecheck && npm run test && npm run build`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx
git commit -m "refactor(m3): App-Shell — Header/Footer/Module-Switcher in M3"
```

---

## Task 12: `WelcomeScreen.tsx` auf M3 umstellen

**Files:**
- Modify: `src/components/WelcomeScreen.tsx`

- [ ] **Step 1: Datei vollständig ersetzen**

```tsx
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";

type Props = {
  onStart: () => void;
};

export function WelcomeScreen({ onStart }: Props) {
  return (
    <Card>
      <div className="space-y-7">
        <div className="space-y-3">
          <span className="m3-eyebrow">Modul Vorsorge · Setup</span>
          <h2 className="text-[44px] sm:text-[56px] font-bold leading-[1.05] tracking-[-0.02em] text-on-surface max-w-[18ch]">
            Wie viel musst du sparen,
            <br />
            damit die Rente reicht
            <span className="text-primary">?</span>
          </h2>
          <p className="max-w-prose text-[16px] leading-[1.6] text-on-surface-variant">
            In fünf Schritten errechnen wir deine Rentenlücke und die monatliche Sparrate, mit
            der du sie schließt — nach der konservativen Finanztip-Methodik (gemischtes
            Portfolio, real gerechnet, Annuität über 30 Jahre). Anlage-Allokation,
            Auszahlungsmethode und alle Annahmen kannst du frei anpassen.
          </p>
        </div>

        <ul className="rounded-m3-md bg-surface-container">
          <Spec n="01" label="Dauer">
            <strong className="font-semibold">~2 Minuten</strong> für den ersten Durchlauf.
          </Spec>
          <Spec n="02" label="Privatsphäre">
            <strong className="font-semibold">Daten bleiben lokal</strong> im Browser
            (localStorage). Nichts wird an einen Server gesendet.
          </Spec>
          <Spec n="03" label="Vorbereitung">
            Monatliches <strong className="font-semibold">Netto-Einkommen</strong>, idealerweise
            den Brief der Deutschen Rentenversicherung (Renteninformation) zur Hand.
          </Spec>
          <Spec n="04" label="Backup">
            Per <strong className="font-semibold">Export</strong> oben rechts kannst du deine
            Eingaben jederzeit als JSON-Datei sichern und später importieren.
          </Spec>
        </ul>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[12px] tracking-[0.04em] text-on-surface-variant">
            Keine Anlageberatung · Orientierungshilfe
          </p>
          <Button onClick={onStart} className="w-full sm:w-auto">
            Loslegen →
          </Button>
        </div>
      </div>
    </Card>
  );
}

function Spec({
  n,
  label,
  children,
}: {
  n: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <li className="grid grid-cols-[40px_140px_1fr] items-baseline gap-3 px-6 py-4 text-[14px] text-on-surface border-b border-outline-variant last:border-b-0 sm:grid-cols-[44px_160px_1fr]">
      <span aria-hidden className="font-semibold text-primary text-[14px] tabular-nums">
        {n}
      </span>
      <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-on-surface-variant">
        {label}
      </span>
      <span>{children}</span>
    </li>
  );
}
```

- [ ] **Step 2: Verifizieren**

Run: `npm run typecheck && npm run test && npm run build`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/WelcomeScreen.tsx
git commit -m "refactor(m3): WelcomeScreen mit Hero, Spec-Liste und Filled CTA"
```

---

## Task 13: `Wizard.tsx` auf M3 Linear Progress + Step Chips

**Files:**
- Modify: `src/components/Wizard.tsx`

Ziel: Den Mono-Tick-Stepper durch einen schmalen Progress-Bar plus nummerierte Step-Chips ersetzen. Logik (State, Step-Switching, Block-Reasons) bleibt erhalten.

- [ ] **Step 1: Datei lesen**

Lies `src/components/Wizard.tsx`. Notiere die bestehende Props-Signatur und welche Slots gerendert werden (Stepper, Content, Nav-Buttons, Block-Reason-Hinweis).

- [ ] **Step 2: Render-Block migrieren**

Der Stepper-Bereich (typischerweise eine `<ol>` mit Tick-Marks und Mono-Labels) wird ersetzt durch:

```tsx
<div className="space-y-3" aria-label="Wizard-Fortschritt">
  <div className="h-1 w-full overflow-hidden rounded-full bg-surface-container-high" aria-hidden>
    <div
      className="h-full bg-primary transition-[width] duration-200"
      style={{ width: `${((stepIndex + 1) / steps.length) * 100}%` }}
    />
  </div>
  <ol className="flex flex-wrap gap-2">
    {steps.map((s, idx) => {
      const status =
        idx < stepIndex ? "done" : idx === stepIndex ? "active" : "pending";
      const tone =
        status === "active"
          ? "bg-primary-container text-on-primary-container"
          : status === "done"
            ? "bg-surface-container text-on-surface-variant"
            : "bg-surface-container text-on-surface-variant";
      const numTone =
        status === "active"
          ? "bg-primary text-on-primary"
          : status === "done"
            ? "bg-success text-on-primary"
            : "bg-outline-variant text-on-surface";
      return (
        <li
          key={s.id}
          className={`inline-flex items-center gap-2 rounded-m3-pill px-3.5 py-1.5 text-[13px] font-medium ${tone}`}
          aria-current={status === "active" ? "step" : undefined}
        >
          <span
            aria-hidden
            className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold ${numTone}`}
          >
            {status === "done" ? "✓" : idx + 1}
          </span>
          {s.label}
        </li>
      );
    })}
  </ol>
</div>
```

**Wichtig:** Die Variablennamen `steps`, `stepIndex`, `s.id`, `s.label` müssen den tatsächlichen Variablen in der bestehenden `Wizard.tsx` entsprechen — beim Lesen in Step 1 abgleichen und ggf. anpassen. Wenn die bestehende Implementierung `currentStep` statt `stepIndex` nennt, hier konsistent ersetzen.

Die Nav-Buttons („Zurück" / „Weiter") nutzen die neuen Button-Varianten:

- „Zurück" → `<Button variant="text">`
- „Weiter" → `<Button>` (Default `filled`)

Block-Reason-Hinweis (falls vorhanden) wird zu:

```tsx
<p className="rounded-m3-md bg-error-container px-4 py-3 text-[13px] text-on-surface">
  {blockReason}
</p>
```

- [ ] **Step 3: Verifizieren**

Run: `npm run typecheck && npm run test && npm run build`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/components/Wizard.tsx
git commit -m "refactor(m3): Wizard-Stepper als Progress-Bar + Step-Chips"
```

---

## Task 14: `NumberInput.tsx` auf M3-Input umlenken

**Files:**
- Modify: `src/components/NumberInput.tsx`

Ziel: NumberInput ist ein Wrapper, der das `<Input>`-Primitive nutzt — nach Phase 2 sollten viele Klassen schon stimmen. Hier nur die Werkstatt-spezifischen Klassen entfernen, die noch im Wrapper hardcoded sein könnten.

- [ ] **Step 1: Datei lesen, Werkstatt-Klassen finden**

Run: `grep -n "ink-\|paper-\|mustard-\|brick-\|font-mono\|tracking-instrument" src/components/NumberInput.tsx`
Expected: Liste von Zeilen die migriert werden müssen.

- [ ] **Step 2: Klassen-Mapping anwenden**

Für jede gefundene Stelle die folgende Mapping-Tabelle anwenden (Werkstatt → M3):

| Werkstatt-Klasse                                 | M3-Ersatz                                                |
| ------------------------------------------------ | -------------------------------------------------------- |
| `text-ink-900` / `text-ink-800`                  | `text-on-surface`                                        |
| `text-ink-700` / `text-ink-500`                  | `text-on-surface-variant`                                |
| `text-ink-300`                                   | `text-outline`                                           |
| `text-ink-200` / `text-ink-100` / `text-ink-50` / `text-ink-0` | `text-outline-variant`                                   |
| `bg-ink-900` / `bg-ink-800`                      | `bg-on-surface`                                          |
| `bg-ink-700`                                     | `bg-on-surface-variant`                                  |
| `bg-ink-100` / `bg-ink-50`                       | `bg-surface-container`                                   |
| `bg-paper-50` / `bg-paper-100` / `bg-paper-200` / `bg-paper-300` | `bg-surface-container`                                   |
| `text-paper-50` / `text-paper-100`               | `text-on-primary`                                        |
| `bg-mustard-400` / `bg-mustard-500`              | `bg-primary`                                             |
| `bg-mustard-50` / `bg-mustard-100`               | `bg-primary-container`                                   |
| `text-mustard-400` / `text-mustard-500` / `text-mustard-600` / `text-mustard-700` | `text-primary`                                           |
| `border-mustard-400`                             | `border-primary`                                         |
| `border-ink-900` / `border-ink-800`              | `border-on-surface-variant`                              |
| `border-ink-700`                                 | `border-outline`                                         |
| `border-ink-100` / `border-ink-50`               | `border-outline-variant`                                 |
| `border-brick-600` / `border-brick-700`          | `border-error`                                           |
| `text-brick-700` / `text-brick-600`              | `text-error`                                             |
| `bg-brick-50` / `bg-brick-100`                   | `bg-error-container`                                     |
| `font-mono`                                      | (entfernen — Roboto Flex überall)                        |
| `font-display` / `font-sans`                     | (entfernen — ist jetzt Default)                          |
| `tracking-instrument` / `tracking-editorial`     | `tracking-[0.04em]`                                      |
| `eyebrow` / `eyebrow-ink` / `eyebrow-muted`      | `m3-eyebrow` (Custom-Component-Klasse)                   |
| `section-number`                                 | `text-[14px] font-semibold text-primary tabular-nums`    |
| `tick-mark` / `tick-mark-active` / `tick-mark-done` | (entfernen — ersetzt durch Step-Chips aus Task 13)       |
| `hairline`                                       | (entfernen — Tonal-Surfaces trennen visuell)             |
| `hairline-soft`                                  | `border-t border-outline-variant`                        |

- [ ] **Step 3: Verifizieren**

Run: `grep -n "ink-\|paper-\|mustard-\|brick-\|font-mono\|tracking-instrument\|font-display" src/components/NumberInput.tsx`
Expected: keine Treffer.

Run: `npm run typecheck && npm run test && npm run build`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/components/NumberInput.tsx
git commit -m "refactor(m3): NumberInput-Wrapper auf M3-Klassen"
```

---

# Phase 4 — Modul-Screens

Wichtig: Phase 4 nutzt die **Klassen-Mapping-Tabelle aus Task 14** als Grundlage für alle mechanischen Klassen-Tausche. Was darüber hinaus geht (neue Komponenten wie Slider/ChoiceChip einsetzen, struktureller Umbau für M3-Patterns) ist in jeder Task explizit beschrieben.

## Task 15: `BasicsStep.tsx` migrieren

**Files:**
- Modify: `src/modules/pension/steps/BasicsStep.tsx`

- [ ] **Step 1: Mechanisches Klassen-Mapping anwenden**

Run: `grep -n "ink-\|paper-\|mustard-\|brick-\|font-mono\|tracking-instrument\|font-display" src/modules/pension/steps/BasicsStep.tsx`

Für jeden Treffer das Mapping aus Task 14 anwenden.

- [ ] **Step 2: Slider für Inflationsannahme einsetzen**

Falls Inflation aktuell als Number-Input vorliegt, durch den neuen Slider ersetzen:

```tsx
import { Slider } from "../../../components/ui/Slider";

// Im Render:
<Slider
  value={inflation}
  onChange={setInflation}
  min={0}
  max={5}
  step={0.1}
  label="Inflationsannahme p. a."
  display={`${inflation.toFixed(1).replace(".", ",")} %`}
/>
```

**Wichtig:** Variablennamen (`inflation`, `setInflation`) müssen dem Store-/Props-Pattern entsprechen das `BasicsStep.tsx` aktuell nutzt. Falls der Wert über einen Store kommt: `value={state.inflation}` und `onChange={(v) => store.set({ inflation: v })}` (an existierenden Store-Pattern anpassen).

- [ ] **Step 3: ChoiceChip für Profil-Voreinstellung einsetzen**

Falls die Profil-Auswahl aktuell als `<select>` oder Button-Gruppe vorliegt, durch ChoiceChips ersetzen:

```tsx
import { ChoiceChip } from "../../../components/ui/ChoiceChip";

// Im Render:
<div className="flex flex-wrap gap-2">
  <ChoiceChip selected={profile === "konservativ"} onClick={() => setProfile("konservativ")}>
    Konservativ
  </ChoiceChip>
  <ChoiceChip selected={profile === "investor"} onClick={() => setProfile("investor")}>
    Investor
  </ChoiceChip>
  <ChoiceChip selected={profile === "custom"} onClick={() => setProfile("custom")}>
    Eigene Einstellungen
  </ChoiceChip>
</div>
```

Profil-Werte (`"konservativ"`, `"investor"`, `"custom"`) an die in `src/modules/pension/presets.ts` definierten Schlüssel angleichen — vorher kurz anschauen.

- [ ] **Step 4: Verifizieren**

Run: `grep -n "ink-\|paper-\|mustard-\|brick-\|font-mono\|tracking-instrument\|font-display" src/modules/pension/steps/BasicsStep.tsx`
Expected: keine Treffer.

Run: `npm run typecheck && npm run test && npm run build`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/modules/pension/steps/BasicsStep.tsx
git commit -m "refactor(m3): BasicsStep mit Slider und ChoiceChips"
```

---

## Task 16: `IncomeStep.tsx` migrieren

**Files:**
- Modify: `src/modules/pension/steps/IncomeStep.tsx`

- [ ] **Step 1: Klassen-Mapping anwenden**

Run: `grep -n "ink-\|paper-\|mustard-\|brick-\|font-mono\|tracking-instrument\|font-display" src/modules/pension/steps/IncomeStep.tsx`

Für jeden Treffer das Mapping aus Task 14 anwenden.

- [ ] **Step 2: Verifizieren**

Run: `grep -n "ink-\|paper-\|mustard-\|brick-\|font-mono\|tracking-instrument\|font-display" src/modules/pension/steps/IncomeStep.tsx`
Expected: keine Treffer.

Run: `npm run typecheck && npm run test && npm run build`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/modules/pension/steps/IncomeStep.tsx
git commit -m "refactor(m3): IncomeStep auf M3-Klassen"
```

---

## Task 17: `PensionInformationStep.tsx` migrieren

**Files:**
- Modify: `src/modules/pension/steps/PensionInformationStep.tsx`

- [ ] **Step 1: Klassen-Mapping anwenden**

Run: `grep -n "ink-\|paper-\|mustard-\|brick-\|font-mono\|tracking-instrument\|font-display" src/modules/pension/steps/PensionInformationStep.tsx`

Mapping aus Task 14 anwenden.

- [ ] **Step 2: Warnungen als M3 Filled Card auf `error-container` strukturieren**

Bestehende Warnungs-Boxes (typischerweise mit `border-brick-` oder `bg-brick-50`) bekommen die Form:

```tsx
<div className="rounded-m3-md bg-error-container p-4 flex gap-3 items-start">
  <span aria-hidden className="text-xl">▲</span>
  <div className="space-y-1">
    <p className="text-[12px] font-medium uppercase tracking-[0.04em] text-on-surface-variant">
      Achtung · Renteninformation fehlt
    </p>
    <p className="text-[14px] leading-relaxed text-on-surface">
      {warningBody}
    </p>
  </div>
</div>
```

Den ursprünglichen Body-Text als `warningBody` belassen; nur den Wrapper umstrukturieren.

- [ ] **Step 3: Verifizieren**

Run: `grep -n "ink-\|paper-\|mustard-\|brick-\|font-mono\|tracking-instrument\|font-display" src/modules/pension/steps/PensionInformationStep.tsx`
Expected: keine Treffer.

Run: `npm run typecheck && npm run test && npm run build`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/modules/pension/steps/PensionInformationStep.tsx
git commit -m "refactor(m3): PensionInformationStep mit M3-Warnung"
```

---

## Task 18: `AssumptionsStep.tsx` migrieren

**Files:**
- Modify: `src/modules/pension/steps/AssumptionsStep.tsx`

- [ ] **Step 1: Klassen-Mapping anwenden**

Run: `grep -n "ink-\|paper-\|mustard-\|brick-\|font-mono\|tracking-instrument\|font-display" src/modules/pension/steps/AssumptionsStep.tsx`

Mapping aus Task 14 anwenden.

- [ ] **Step 2: Slider für Realrenditen + Steuersatz**

An den Stellen wo Realrendite (Aktien/Anleihen) und Steuersatz aktuell als Number-Inputs vorliegen, in Slider umstellen — Range nach realistischen Werten:

```tsx
import { Slider } from "../../../components/ui/Slider";

// Realrendite Aktien:
<Slider
  value={equityReal}
  onChange={setEquityReal}
  min={0}
  max={10}
  step={0.1}
  label="Reale Erwartung Aktien-Anteil"
  display={`${equityReal.toFixed(1).replace(".", ",")} %`}
/>

// Steuersatz:
<Slider
  value={taxRate}
  onChange={setTaxRate}
  min={0}
  max={42}
  step={1}
  label="Persönlicher Steuersatz"
  display={`${taxRate} %`}
/>
```

Variablennamen an State-Pattern angleichen.

- [ ] **Step 3: ChoiceChip für Auszahlungsmethode**

Falls Auszahlungsmethode (Annuität / Entnahmeplan / etc.) als Select oder Radio-Gruppe vorliegt:

```tsx
import { ChoiceChip } from "../../../components/ui/ChoiceChip";

<div className="flex flex-wrap gap-2">
  {payoutOptions.map((opt) => (
    <ChoiceChip
      key={opt.value}
      selected={payoutMethod === opt.value}
      onClick={() => setPayoutMethod(opt.value)}
    >
      {opt.label}
    </ChoiceChip>
  ))}
</div>
```

Werte/Optionen aus dem bestehenden Code übernehmen — nicht erfinden.

- [ ] **Step 4: Verifizieren**

Run: `grep -n "ink-\|paper-\|mustard-\|brick-\|font-mono\|tracking-instrument\|font-display" src/modules/pension/steps/AssumptionsStep.tsx`
Expected: keine Treffer.

Run: `npm run typecheck && npm run test && npm run build`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/modules/pension/steps/AssumptionsStep.tsx
git commit -m "refactor(m3): AssumptionsStep mit Slider und ChoiceChips"
```

---

## Task 19: `ResultStep.tsx` migrieren — der zentrale Screen

**Files:**
- Modify: `src/modules/pension/steps/ResultStep.tsx`

Ziel: Der Hero-Sparrate-Block (Zeilen 116–149 im aktuellen Stand mit der gigantischen Mono-Zahl) wird durch eine M3 Hero-Card ersetzt. Stat-Block, A/B-Vergleichstabelle, „Drucken"-Button und Lesehinweis bekommen die M3-Form.

- [ ] **Step 1: Klassen-Mapping anwenden**

Run: `grep -n "ink-\|paper-\|mustard-\|brick-\|font-mono\|tracking-instrument\|font-display" src/modules/pension/steps/ResultStep.tsx`

Mapping aus Task 14 anwenden — aber **noch nicht** für die Hero-Sektion (Schritt 2 ersetzt sie strukturell).

- [ ] **Step 2: Hero-Sparrate als M3 Hero-Card**

Der bestehende Hero-Block (mit „eyebrow Output · 01" + Mono-Display-Zahl) wird ersetzt durch:

```tsx
<Card variant="hero">
  <div className="flex items-start justify-between gap-3">
    <div>
      <span className="m3-eyebrow bg-primary text-on-primary">Output · 01</span>
      <p className="mt-2 text-[12px] uppercase tracking-[0.08em] opacity-85">
        Empfohlene monatliche Sparrate
      </p>
    </div>
    <Button
      variant="tonal"
      size="sm"
      onClick={() => window.print()}
      data-print="hide"
      title="Ergebnis drucken oder als PDF speichern"
    >
      🖨 Drucken
    </Button>
  </div>

  <div className="mt-6">
    <p className="m3-display text-on-primary-container">
      {formatEUR(result.monthlySavings, true)}
    </p>
    <div className="mt-3 flex items-center gap-3">
      <span aria-hidden className="inline-block h-[3px] w-12 bg-primary rounded-full" />
      <span className="text-[12px] uppercase tracking-[0.08em] opacity-85">
        Monatlich · Real · Heutige Kaufkraft
      </span>
    </div>
  </div>

  <div className="mt-6 grid grid-cols-1 gap-x-8 gap-y-3 border-t border-primary/20 pt-5 sm:grid-cols-2">
    <div>
      <p className="text-[11px] uppercase tracking-[0.08em] opacity-85">Sparquote</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">
        {formatPercent(result.savingsRatePct / 100)}
      </p>
      <p className="mt-1 text-[12px] leading-snug opacity-85">
        vom aktuellen Netto-Einkommen
      </p>
    </div>
    <div>
      <p className="text-[11px] uppercase tracking-[0.08em] opacity-85">Alternativ · Nominal fix</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">
        {formatEUR(result.fixedNominalSavings, true)}
      </p>
      <p className="mt-1 text-[12px] leading-snug opacity-85">
        gleichbleibender Betrag, ohne jährliche Inflationsanpassung
      </p>
    </div>
  </div>
</Card>
```

- [ ] **Step 3: „Lesehinweis"-Block als Tip-Card auf Tertiary**

Den bisherigen Lesehinweis-Block (typischerweise `bg-paper-50` mit Border) ersetzen durch:

```tsx
<div className="rounded-m3-md bg-tertiary-container text-on-tertiary-container p-4 flex gap-3 items-start">
  <span aria-hidden className="text-xl leading-none">💡</span>
  <div className="space-y-1.5">
    <p className="text-[12px] font-medium uppercase tracking-[0.08em] opacity-85">
      Lesehinweis
    </p>
    <p className="text-[13px] leading-relaxed">
      Der Hauptbetrag gilt in heutiger Kaufkraft. Um real gleich zu bleiben, musst du ihn
      jedes Jahr um die Inflation anpassen (z. B. +2 %). Steigt dein Gehalt mit der
      Inflation, bleibt die Sparquote konstant.
    </p>
  </div>
</div>
```

- [ ] **Step 4: Stat-Cards als M3 Surface-Container-High**

Die drei Stat-Blöcke (Rentenlücke, Kapitalbedarf, Vorhandenes Vermögen) als kleine Cards:

```tsx
<div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
  <Stat
    label="Rentenlücke pro Monat (heute)"
    value={formatEUR(result.gapToday)}
    hint={`In ${result.yearsToRetirement} Jahren entspricht das ca. ${formatEUR(result.gapAtRetirementNominal)}`}
    tooltip={tooltips.gapToday}
  />
  {/* ... */}
</div>
```

Die `<Stat>`-Hilfskomponente innerhalb von `ResultStep.tsx` wird intern auf M3 umgestellt — sie war Werkstatt-spezifisch. Ersetze ihre interne Struktur durch:

```tsx
function Stat({ label, value, hint, tooltip }: StatProps) {
  return (
    <div className="rounded-m3-md bg-surface-container-high p-5">
      <div className="flex items-baseline gap-2">
        <p className="text-[11px] font-medium uppercase tracking-[0.04em] text-on-surface-variant">
          {label}
        </p>
        {tooltip && <InfoTooltip content={tooltip} />}
      </div>
      <p className="mt-2 text-[28px] font-semibold tabular-nums text-on-surface">
        {value}
      </p>
      {hint && (
        <p className="mt-1 text-[12px] leading-snug text-on-surface-variant">{hint}</p>
      )}
    </div>
  );
}
```

Die Props-Signatur (`StatProps`) bleibt wie sie aktuell definiert ist.

- [ ] **Step 5: A/B-`ProfileComparison` migrieren**

Die `ProfileComparison`-Komponente (aktuell als kompakte Tabelle innerhalb von ResultStep oder als Sub-Component) bekommt M3-Form:

```tsx
<div className="rounded-m3-md bg-surface-container p-6">
  <h3 className="text-[16px] font-medium text-on-surface">A/B-Vergleich · Profile bei identischen Eingaben</h3>
  <p className="mt-1 text-[13px] text-on-surface-variant">
    Konservativ rechnet mit 3 % real, Investor mit 5 % real.
  </p>
  <table className="mt-4 w-full border-collapse">
    <thead>
      <tr className="border-b border-outline-variant">
        <th className="py-3 text-left text-[12px] uppercase tracking-[0.04em] text-on-surface-variant font-medium">Profil</th>
        <th className="py-3 text-right text-[12px] uppercase tracking-[0.04em] text-on-surface-variant font-medium">Sparrate / Monat</th>
        <th className="py-3 text-right text-[12px] uppercase tracking-[0.04em] text-on-surface-variant font-medium">Sparquote</th>
      </tr>
    </thead>
    <tbody>
      {/* Bestehende Zeilen-Render-Logik beibehalten, nur td-Klassen anpassen: */}
      {/* td: "py-3 text-[14px] text-on-surface" */}
      {/* td.num (Spalten 2/3): "py-3 text-right text-[14px] font-semibold tabular-nums text-on-surface" */}
      {/* td.delta (Δ-Zeile): "py-3 text-right text-[14px] font-semibold tabular-nums text-tertiary" */}
      {/* AKTIV-Badge: <span className="ml-2 inline-block rounded-m3-pill bg-primary text-on-primary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em]">Aktiv</span> */}
    </tbody>
  </table>
</div>
```

Die existierende Map-Logik über die Profile übernehmen, nur Klassen tauschen. Die Δ-Zeile (Differenz-Zeile) ist **die einzige Stelle auf dem Ergebnis-Screen, die Tertiary nutzt** außer der Tip-Card.

- [ ] **Step 6: Verifizieren**

Run: `grep -n "ink-\|paper-\|mustard-\|brick-\|font-mono\|tracking-instrument\|font-display" src/modules/pension/steps/ResultStep.tsx`
Expected: keine Treffer.

Run: `npm run typecheck && npm run test && npm run build`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/modules/pension/steps/ResultStep.tsx
git commit -m "refactor(m3): ResultStep — Hero-Card, Stat-Grid, A/B, Tip-Card"
```

---

## Task 20: `PensionRechenweg.tsx` migrieren

**Files:**
- Modify: `src/modules/pension/PensionRechenweg.tsx`

- [ ] **Step 1: Klassen-Mapping anwenden**

Run: `grep -n "ink-\|paper-\|mustard-\|brick-\|font-mono\|tracking-instrument\|font-display" src/modules/pension/PensionRechenweg.tsx`

Mapping aus Task 14 anwenden. Tabellenstruktur belassen, nur `font-mono`-Aufrufe entfernen (Body-Schrift hat tabular-nums global).

- [ ] **Step 2: Verifizieren**

Run: `grep -n "ink-\|paper-\|mustard-\|brick-\|font-mono\|tracking-instrument\|font-display" src/modules/pension/PensionRechenweg.tsx`
Expected: keine Treffer.

Run: `npm run typecheck && npm run test && npm run build`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/modules/pension/PensionRechenweg.tsx
git commit -m "refactor(m3): PensionRechenweg auf M3-Klassen"
```

---

## Task 21: Hilfs-Komponenten — `AssetsManager`, `AllocationManager`, `Disclosure`

**Files:**
- Modify: `src/components/AssetsManager.tsx`
- Modify: `src/components/AllocationManager.tsx`
- Modify: `src/components/Disclosure.tsx`

- [ ] **Step 1: `Disclosure.tsx` umstellen**

Bestehende Disclosure-Wrapper (typischerweise mit hartem Border und Mono-Header) ersetzen durch:

```tsx
import { useState, type ReactNode } from "react";

type DisclosureProps = {
  title: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
};

/**
 * M3 Disclosure — Outlined Card mit Chevron, expand/collapse.
 */
export function Disclosure({ title, defaultOpen = false, children }: DisclosureProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-m3-md border border-outline-variant overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left text-[15px] font-medium text-on-surface hover:bg-surface-container"
        aria-expanded={open}
      >
        <span>{title}</span>
        <span aria-hidden className={`transition-transform ${open ? "rotate-180" : ""}`}>
          ▾
        </span>
      </button>
      {open && (
        <div className="border-t border-outline-variant px-5 py-4 text-[14px] text-on-surface">
          {children}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: `AssetsManager.tsx` und `AllocationManager.tsx` migrieren**

Für jede der beiden Dateien:

Run: `grep -n "ink-\|paper-\|mustard-\|brick-\|font-mono\|tracking-instrument\|font-display" src/components/<file>.tsx`

Mapping aus Task 14 anwenden. Karten-/Sektions-Wrapper bekommen `rounded-m3-md bg-surface-container p-4` statt der harten Border.

- [ ] **Step 3: Verifizieren**

Run: `grep -n "ink-\|paper-\|mustard-\|brick-\|font-mono\|tracking-instrument\|font-display" src/components/AssetsManager.tsx src/components/AllocationManager.tsx src/components/Disclosure.tsx`
Expected: keine Treffer in allen drei Dateien.

Run: `npm run typecheck && npm run test && npm run build`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/components/AssetsManager.tsx src/components/AllocationManager.tsx src/components/Disclosure.tsx
git commit -m "refactor(m3): AssetsManager, AllocationManager, Disclosure auf M3"
```

---

# Phase 5 — Cleanup, Print, Mobile, Final-Sweep

## Task 22: Werkstatt-Tokens aus Tailwind und globals entfernen

**Files:**
- Modify: `tailwind.config.ts`
- Modify: `src/styles/globals.css`

- [ ] **Step 1: Repo-weit prüfen, dass keine Werkstatt-Klassen mehr genutzt werden**

Run: `grep -rn "ink-\|paper-\|mustard-\|brick-\|brand-\|rule-\|font-mono\|tracking-instrument\|font-display" src/`
Expected: keine Treffer. Falls doch, entsprechende Stellen migrieren bevor weiter (Mapping aus Task 14).

Run: `grep -rn "tick-mark\|hairline\|eyebrow-ink\|eyebrow-muted\b\|eyebrow\b\|section-number" src/`
Expected: keine Treffer auf alte CSS-Klassen aus dem Werkstatt-Components-Layer. Falls doch — finde-und-ersetze:
- `eyebrow` / `eyebrow-ink` / `eyebrow-muted` → `m3-eyebrow`
- `section-number` → `text-[14px] font-semibold text-primary tabular-nums`
- `tick-mark*` → entfernen (gibt's in M3 nicht mehr; Wizard-Stepper aus Task 13 ersetzt das)
- `hairline` / `hairline-soft` → `border-t border-outline-variant` an den Eltern-Container hängen

- [ ] **Step 2: Werkstatt-Tokens aus `tailwind.config.ts` entfernen**

`tailwind.config.ts` so umschreiben, dass nur noch die M3-Tokens und die Roboto-Flex-Familie übrig bleiben. Vollständiger neuer Inhalt:

```ts
import type { Config } from "tailwindcss";

/**
 * Material 3 Indigo Seed — exklusives Token-Set nach M3-Rollout.
 */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#2E4BAE",
        "on-primary": "#FFFFFF",
        "primary-container": "#DEE0FF",
        "on-primary-container": "#00105C",
        "secondary-container": "#E2E1EC",
        "on-secondary-container": "#1A1B23",
        tertiary: "#735471",
        "tertiary-container": "#FED7F7",
        "on-tertiary-container": "#2B122B",
        surface: "#FBFAFF",
        "surface-container": "#F0EFF7",
        "surface-container-high": "#E7E6F0",
        "surface-container-highest": "#DEDDE6",
        "on-surface": "#1A1B21",
        "on-surface-variant": "#45464F",
        outline: "#767680",
        "outline-variant": "#C7C5D0",
        error: "#BA1A1A",
        "error-container": "#FFDAD6",
        success: "#2E6A1F",
        "success-container": "#B6F2A1",
      },
      fontFamily: {
        sans: ['"Roboto Flex"', "system-ui", "sans-serif"],
      },
      borderRadius: {
        "m3-sm": "8px",
        "m3-md": "16px",
        "m3-lg": "24px",
        "m3-button": "20px",
        "m3-pill": "999px",
      },
      boxShadow: {
        "m3-elev1": "0 1px 2px 0 rgba(0,0,0,0.05)",
        "m3-elev2": "0 2px 6px 0 rgba(46, 75, 174, 0.10)",
      },
    },
  },
  plugins: [],
} satisfies Config;
```

- [ ] **Step 3: Werkstatt-Klassen aus `globals.css` entfernen**

Im `@layer components`-Block die Werkstatt-spezifischen Klassen (`tick-mark`, `tick-mark-active`, `tick-mark-done`, `hairline`, `hairline-soft`) entfernen — falls beim Migrieren in Step 1 noch nicht passiert.

Endgültiger `@layer components`-Block (zur Verifikation, sollte schon nach Phase 1 so aussehen wenn Step 1 sauber war):

```css
@layer components {
  .container-page {
    @apply mx-auto w-full max-w-3xl px-5 py-10 sm:px-8;
  }

  .m3-eyebrow {
    @apply inline-block rounded-m3-pill bg-primary-container px-3.5 py-1.5 text-[11px] font-medium uppercase tracking-[0.08em] text-on-primary-container;
  }

  .m3-eyebrow-muted {
    @apply inline-block rounded-m3-pill bg-surface-container-high px-3.5 py-1.5 text-[11px] font-medium uppercase tracking-[0.08em] text-on-surface-variant;
  }

  .m3-display {
    font-size: clamp(48px, 8vw, 96px);
    font-weight: 700;
    letter-spacing: -0.03em;
    line-height: 0.95;
  }

  .m3-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: var(--m3-primary);
    border: 3px solid var(--m3-surface);
    box-shadow: 0 0 0 8px color-mix(in srgb, var(--m3-primary) 0%, transparent);
    transition: box-shadow 0.15s;
    cursor: pointer;
  }
  .m3-slider:hover::-webkit-slider-thumb,
  .m3-slider:focus::-webkit-slider-thumb {
    box-shadow: 0 0 0 8px color-mix(in srgb, var(--m3-primary) 12%, transparent);
  }
  .m3-slider::-moz-range-thumb {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: var(--m3-primary);
    border: 3px solid var(--m3-surface);
    cursor: pointer;
  }
}
```

- [ ] **Step 4: Verifizieren**

Run: `npm run typecheck && npm run test && npm run build`
Expected: PASS — ohne Werkstatt-Tokens darf der Build nicht scheitern. Falls doch: nicht migrierte Stelle finden, Mapping anwenden, erneut testen.

Run: `grep -rn "ink-\|paper-\|mustard-\|brand-\|brick-\|rule-\|tick-mark\|hairline\|tracking-instrument" src/`
Expected: keine Treffer.

- [ ] **Step 5: Commit**

```bash
git add tailwind.config.ts src/styles/globals.css src/
git commit -m "chore(m3): Werkstatt-Tokens entfernt — M3 ist exklusiv"
```

---

## Task 23: Print-View visuell prüfen

**Files:**
- Smoke-Test, ggf. nachbessern in `src/styles/globals.css`

- [ ] **Step 1: Dev-Server starten**

Run: `npm run dev -- --port 5174`
Expected: App startet. Im Browser auf `http://localhost:5174` öffnen, durch den Wizard zum Ergebnis-Screen klicken (oder Beispieldaten eingeben).

- [ ] **Step 2: Druckvorschau im Browser öffnen**

Im Browser: Strg+P (oder Cmd+P).
Expected: 
- Header und Footer sind ausgeblendet
- Hero-Card (auf Primary-Container) wird zu hell-grauer Fläche
- Tip-Card (Tertiary) wird zu hell-grauer Fläche
- Schwarzer Text auf weißem/hell-grauem Hintergrund
- Alle Buttons mit `data-print="hide"` sind weg
- Hero-Display-Zahl ist groß und schwarz
- Δ-Werte in der Vergleichstabelle sind schwarz (nicht mehr Tertiary)

- [ ] **Step 3: Falls Probleme — Print-Stylesheet nachbessern**

Falls eine Surface noch farbig erscheint oder ein Button nicht ausgeblendet wird, in `globals.css` im `@media print`-Block ergänzen. Häufige Stellen:

- Eine zu farbige Card: zusätzlich `[class*="bg-XYZ"] { background: white !important; }` ergänzen
- Ein Button der nicht ausgeblendet wird: `data-print="hide"` an der Stelle nachziehen oder `button:not(.keep-in-print) { display: none !important; }`

Nach Anpassung erneut Druckvorschau prüfen.

- [ ] **Step 4: Dev-Server stoppen** (Ctrl+C)

- [ ] **Step 5: Commit (falls Änderung)**

```bash
git add src/styles/globals.css
git commit -m "polish(m3): Print-Stylesheet nachgezogen"
```

Falls keine Änderung nötig war: Step überspringen.

---

## Task 24: Mobile-Layout-Verifikation

**Files:**
- Smoke-Test, ggf. nachbessern in einzelnen Komponenten

- [ ] **Step 1: Dev-Server starten und mobile Breite simulieren**

Run: `npm run dev -- --port 5174`
Im Browser DevTools öffnen (F12), Geräte-Toolbar (Ctrl+Shift+M) auf 375 px Breite (iPhone SE) stellen.

- [ ] **Step 2: Durchklicken**

Reihenfolge testen: Welcome → Wizard-Step 1–5 → Ergebnis. Auf jedem Screen prüfen:

- Kein horizontaler Scroll
- Hero-Texte umbrechen sauber
- Wizard-Step-Chips wickeln auf 2–3 Zeilen
- Hero-Sparrate-Zahl skaliert kleiner (über `clamp()`)
- Stat-Cards stapeln sich auf eine Spalte
- A/B-Tabelle: horizontal scrollbar oder Ziffern lesbar
- Buttons (Drucken, Loslegen) bleiben tappable (mind. 44 px Höhe)

- [ ] **Step 3: Falls Probleme — gezielt nachbessern**

Häufige Mobile-Probleme:
- A/B-Tabelle bricht — wrap die Tabelle in `<div className="overflow-x-auto">…</div>` in `ResultStep.tsx`
- Hero-Eyebrow + Drucken-Button zu eng — auf Mobile zu `flex-col` mit `sm:flex-row` umstellen

- [ ] **Step 4: Dev-Server stoppen**

- [ ] **Step 5: Commit (falls Änderung)**

```bash
git add src/
git commit -m "polish(m3): Mobile-Layout nachgezogen"
```

---

## Task 25: Final-Sweep + Tag setzen

**Files:**
- Keine Änderungen, nur Verifikation und Tagging

- [ ] **Step 1: Vollständige Verifikation**

Run: `npm run lint && npm run typecheck && npm run test && npm run build`
Expected: ALLE PASS.

- [ ] **Step 2: Komplette Werkstatt-Sucheraussage**

Run: `grep -rn "ink-\|paper-\|mustard-\|brand-\|brick-\|rule-\|tick-mark\|hairline\|tracking-instrument\|font-display\|font-mono\|Werkstatt-Card\|Werkstatt-Input\|Werkstatt-Field\|Werkstatt-Tooltip" src/`
Expected: keine Treffer in Code-Dateien (nur in Doc-Kommentaren akzeptabel, wenn überhaupt).

- [ ] **Step 3: Side-by-Side-Vergleich**

In **zwei Terminals**:

Terminal 1 (Werkstatt-Stand):
```bash
cd "C:\Users\realt\Documents\AI Projects\FinanzBot"
npm run dev
```
Erwartet auf http://localhost:5173 — der alte Werkstatt-Look.

Terminal 2 (M3-Worktree):
```bash
cd "C:\Users\realt\Documents\AI Projects\FinanzBot\.claude\worktrees\xenodochial-shaw-987d99"
npm run dev -- --port 5174
```
Erwartet auf http://localhost:5174 — der neue M3-Look.

Beide Browser-Fenster nebeneinander öffnen. Gleiche Eingaben in beiden Apps machen, Wizard durchklicken, Ergebnis vergleichen.

- [ ] **Step 4: Tag `werkstatt-final` setzen (auf main)**

```bash
cd "C:\Users\realt\Documents\AI Projects\FinanzBot"
git tag -a werkstatt-final 619beb0 -m "Letzter Stand des Werkstatt-Looks vor Material-3-Rollout"
git push origin werkstatt-final
```

(Falls kein Remote gesetzt: nur `git tag` lokal. Push optional.)

- [ ] **Step 5: Hand-off**

Im M3-Worktree alle Dev-Server stoppen. Fertig — der M3-Stand ist auf dem Branch `claude/xenodochial-shaw-987d99` zum Mergen bereit. Nutzer entscheidet ob/wann.

---

## Self-Review-Notiz

**Spec-Coverage:**
- ✅ Tag-Strategie → Task 25 Step 4
- ✅ Tailwind-Token-Migration → Tasks 2, 22
- ✅ Roboto Flex → Tasks 1, 22
- ✅ UI-Primitives Button/Card/Input/Field/Select/Tooltip → Tasks 4–7
- ✅ NEU Slider → Task 9
- ✅ NEU Chip + ChoiceChip → Task 10
- ✅ InfoTooltip als Tonal-Icon-Button → Task 8
- ✅ App-Shell → Task 11
- ✅ WelcomeScreen → Task 12
- ✅ Wizard-Wrapper → Task 13
- ✅ NumberInput → Task 14
- ✅ Module-Screens (Basics, Income, Renteninfo, Assumptions, Result) → Tasks 15–19
- ✅ PensionRechenweg → Task 20
- ✅ AssetsManager + AllocationManager + Disclosure → Task 21
- ✅ Print-View → Task 23 (initial in Task 3, nachgezogen in 23)
- ✅ Mobile → Task 24
- ✅ Akzentregeln eingehalten in Task 19 (Tertiary nur Δ + Tip-Card)
- ✅ Erfolgskriterium (Tests, Build, Lint, keine Werkstatt-Token, Side-by-Side, Tag) → Task 25

**Placeholder-Scan:** Keine "TBD"/"TODO"/"später" gefunden. Stellen wo der Implementierer Variablennamen anpassen muss (z. B. `inflation`/`setInflation` in BasicsStep) sind explizit markiert mit Hinweis "an State-Pattern angleichen — nicht erfinden".

**Type-Konsistenz:** Button-Variante `filled` ist konsistent über alle Aufrufer-Tasks. Card-Variante `hero` taucht zuerst in Task 5 auf und wird in Task 19 genutzt. ChoiceChip-Prop `selected` ist über Task 10, 11, 15, 18 konsistent. Slider-Props (`value`, `onChange`, `min`, `max`, `step`, `label`, `display`) sind über Task 9, 15, 18 konsistent.
