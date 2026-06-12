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
        // Display-Schrift für Headlines, Hero-Zahlen und die Wortmarke.
        display: ['"Bricolage Grotesque"', '"Roboto Flex"', "system-ui", "sans-serif"],
      },
      // M3-Typo-Rollen — statt Ad-hoc-Pixelwerten in den Komponenten.
      fontSize: {
        "label-sm": ["11px", { lineHeight: "16px" }],
        "label-md": ["12px", { lineHeight: "16px" }],
        "label-lg": ["14px", { lineHeight: "20px" }],
        "body-sm": ["13px", { lineHeight: "1.6" }],
        "body-md": ["14px", { lineHeight: "1.6" }],
        "body-lg": ["16px", { lineHeight: "1.6" }],
        "title-sm": ["18px", { lineHeight: "1.3" }],
        "title-md": ["24px", { lineHeight: "1.25", letterSpacing: "-0.02em" }],
        "title-lg": ["28px", { lineHeight: "1.15", letterSpacing: "-0.01em" }],
        headline: ["32px", { lineHeight: "1.1", letterSpacing: "-0.02em" }],
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
