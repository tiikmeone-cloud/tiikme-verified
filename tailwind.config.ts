import type { Config } from "tailwindcss";

export default {
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  future: {
    // Drops :hover variants on touch devices — reduces unused CSS on mobile
    // without any visual change on desktop.
    hoverOnlyWhenSupported: true,
  },
  theme: {
    container: { center: true, padding: "2rem", screens: { "2xl": "1400px" } },
    extend: {
      fontFamily: {
        sans: ['"Inter Tight"', '"Inter"', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      colors: {
        // Tailwind semantic
        border: "var(--border)",
        "border-2": "var(--border-2)",
        input: "var(--border-2)",
        ring: "var(--brand)",
        background: "var(--bg)",
        foreground: "var(--text-1)",

        // OFFICIAL TIIKME BRAND
        brand: {
          DEFAULT: "#FF5A1F",
          hover: "#F04A12",
          press: "#D93E08",
          50: "#FEF3E8",
          900: "#7A3D0E",
          // legacy compat
          "2": "#F04A12",
          dim: "rgba(255, 90, 31, 0.12)",
          glow: "rgba(255, 90, 31, 0.20)",
        },
        midnight: {
          DEFAULT: "#21205A",
          800: "#1A194A",
          700: "#2B2A6B",
        },
        paper: "#FAFAF7",
        ink: {
          DEFAULT: "#0A0A0B",
          "2": "#3A3A3A",
        },
        line: "#ECECEA",

        // Surfaces (paper)
        surface: {
          DEFAULT: "var(--surface)",
          "2": "var(--surface-2)",
          "3": "var(--surface-3)",
          primary: "#FFFFFF",
          card: "#FFFFFF",
        },

        // Text
        "t1": "var(--text-1)",
        "t2": "var(--text-2)",
        "t3": "var(--text-3)",

        // Legacy
        "accent-orange": "#FF5A1F",
        "accent-pink": "#FF5A1F",
        "text-primary": "#0A0A0B",
        "text-secondary": "#3A3A3A",
        "text-on-dark": "#FAFAF7",

        // shadcn semantic
        primary: { DEFAULT: "#FF5A1F", foreground: "#FFFFFF" },
        secondary: { DEFAULT: "var(--surface-2)", foreground: "var(--text-1)" },
        destructive: { DEFAULT: "var(--danger)", foreground: "#FFFFFF" },
        muted: { DEFAULT: "var(--surface-2)", foreground: "var(--text-2)" },
        accent: { DEFAULT: "var(--brand-dim)", foreground: "var(--text-1)" },
        popover: { DEFAULT: "var(--surface)", foreground: "var(--text-1)" },
        card: { DEFAULT: "var(--surface)", foreground: "var(--text-1)" },
        sidebar: {
          DEFAULT: "var(--sidebar-background)",
          foreground: "var(--sidebar-foreground)",
          primary: "var(--sidebar-primary)",
          "primary-foreground": "var(--sidebar-primary-foreground)",
          accent: "var(--sidebar-accent)",
          "accent-foreground": "var(--sidebar-accent-foreground)",
          border: "var(--sidebar-border)",
          ring: "var(--sidebar-ring)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" } },
        "accordion-up": { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" } },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
