import type { Config } from "tailwindcss";

/**
 * Werkstatt-Instrument — Theme Tokens
 *
 * Bauhaus / Swiss-Style / Braun-Designstudio:
 *   - paper  = kühles Off-White (Hintergrund)
 *   - card   = reines Weiß (Flächen)
 *   - ink    = nahezu schwarz (Text, Linien)
 *   - mustard= sparsam gesetztes Senf-Gelb (Akzent: aktiver Step, Hero, Fokus)
 *   - brick  = ziegelroter Negativ-Indikator
 *   - rule   = harte 1px-Linien-Farbe
 *
 * `brand-*` ist als Alias auf mustard beibehalten, damit bestehende
 * Tailwind-Klassen weiterhin auflösen.
 */

const mustard = {
  50: "#FFF8E1",
  100: "#FCEDB8",
  200: "#F5D87A",
  300: "#E8BF45",
  400: "#D4A017",
  500: "#B98810",
  600: "#9B6F09",
  700: "#7A5605",
  800: "#5A3F03",
  900: "#3F2C02",
};

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: {
          50: "#FAFAF7",
          100: "#F4F4F0",
          200: "#EAEAE2",
          300: "#D8D8CD",
        },
        ink: {
          50: "#E8E8E5",
          100: "#C8C8C2",
          300: "#8A8A82",
          500: "#5A5A52",
          700: "#2A2A26",
          800: "#1A1A18",
          900: "#0F0F0F",
        },
        mustard,
        brand: mustard, // Alias: bestehende `brand-*` → mustard
        brick: {
          50: "#F8E6E1",
          100: "#EFCBC2",
          400: "#C76B55",
          600: "#B14D3A",
          700: "#8C3725",
        },
        rule: {
          DEFAULT: "#0F0F0F",
          soft: "#C8C8C2",
        },

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
      },
      fontFamily: {
        display: ['"Geist"', "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        sans: ['"Geist"', "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: [
          '"Geist Mono"',
          '"JetBrains Mono"',
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "monospace",
        ],
        m3: ['"Roboto Flex"', "system-ui", "sans-serif"],
      },
      letterSpacing: {
        editorial: "0.18em",
        instrument: "0.22em",
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
