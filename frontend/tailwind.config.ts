import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      // ── Xebia brand colour system ────────────────────────────────────────
      colors: {
        // Primary
        velvet: {
          DEFAULT: "#831B84",
          dark: "#5A0F5A",
          light: "#A84CA9",
          subtle: "#F5E8F5",
        },
        "blue-dark": "#150027",

        // Greyscale
        grey: {
          50: "#F9F9F9",
          100: "#F2F2F2",
          200: "#E5E5E5",
          300: "#D4D4D4",
          400: "#A3A3A3",
          500: "#737373",
          600: "#525252",
          700: "#404040",
          800: "#262626",
          900: "#171717",
        },

        // Chart / status accents (Velvet secondary palette)
        chart: {
          1: "#831B84",
          2: "#B84DB9",
          3: "#E07FE1",
          4: "#5A0F5A",
          5: "#D4A0D4",
        },

        // Semantic
        success: "#22C55E",
        warning: "#F59E0B",
        error: "#EF4444",
        info: "#3B82F6",

        // Maturity band colours
        maturity: {
          planning: "#EF4444",       // red
          experimenting: "#F97316",  // orange
          standardizing: "#EAB308",  // yellow
          scaling: "#22C55E",        // green
          optimizing: "#831B84",     // velvet
        },
      },

      // ── Typography ────────────────────────────────────────────────────────
      fontFamily: {
        sans: ["Suisse Intl", "Inter", "system-ui", "sans-serif"],
        mono: ["Suisse Intl Mono", "JetBrains Mono", "monospace"],
      },
      fontSize: {
        xs: ["0.75rem", { lineHeight: "1rem" }],
        sm: ["0.875rem", { lineHeight: "1.25rem" }],
        base: ["1rem", { lineHeight: "1.5rem" }],
        lg: ["1.125rem", { lineHeight: "1.75rem" }],
        xl: ["1.25rem", { lineHeight: "1.75rem" }],
        "2xl": ["1.5rem", { lineHeight: "2rem" }],
        "3xl": ["1.875rem", { lineHeight: "2.25rem" }],
        "4xl": ["2.25rem", { lineHeight: "2.5rem" }],
        "5xl": ["3rem", { lineHeight: "1.15" }],
      },

      // ── Layout ────────────────────────────────────────────────────────────
      spacing: {
        "sidebar": "15rem",         // 240px nav sidebar
        "topbar": "3.5rem",         // 56px top bar
      },

      borderRadius: {
        DEFAULT: "0.375rem",
        sm: "0.25rem",
        md: "0.375rem",
        lg: "0.5rem",
        xl: "0.75rem",
        "2xl": "1rem",
        full: "9999px",
      },

      boxShadow: {
        card: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
        elevated: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
      },

      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
      },
    },
  },
  plugins: [animate],
};

export default config;
