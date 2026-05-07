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
      },
      letterSpacing: {
        editorial: "0.18em",
        instrument: "0.22em",
      },
    },
  },
  plugins: [],
} satisfies Config;
