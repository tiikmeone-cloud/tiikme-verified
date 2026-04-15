import type { Config } from "tailwindcss";

export default {
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: { center: true, padding: "2rem", screens: { "2xl": "1400px" } },
    extend: {
      fontFamily: {
        sans: ['"Inter"', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      colors: {
        border: "var(--border)",
        "border-2": "var(--border-2)",
        input: "var(--border-2)",
        ring: "var(--brand)",
        background: "var(--bg)",
        foreground: "var(--text-1)",
        brand: {
          DEFAULT: "var(--brand)",
          "2": "var(--brand-2)",
          dim: "var(--brand-dim)",
          glow: "var(--brand-glow)",
        },
        surface: {
          DEFAULT: "var(--surface)",
          "2": "var(--surface-2)",
          "3": "var(--surface-3)",
          primary: "#F0F2F7",
          card: "#E8ECF4",
        },
        "t1": "var(--text-1)",
        "t2": "var(--text-2)",
        "t3": "var(--text-3)",
        "accent-orange": "#E8733A",
        "accent-pink": "#FF6B9D",
        "text-primary": "#1A1A2E",
        "text-secondary": "#6B7094",
        "text-on-dark": "#F0F2F7",
        primary: { DEFAULT: "var(--brand)", foreground: "#FFFFFF" },
        secondary: { DEFAULT: "var(--surface-2)", foreground: "var(--text-1)" },
        destructive: { DEFAULT: "var(--danger)", foreground: "#FFFFFF" },
        muted: { DEFAULT: "var(--surface)", foreground: "var(--text-2)" },
        accent: { DEFAULT: "var(--brand-dim)", foreground: "var(--text-1)" },
        popover: { DEFAULT: "var(--surface-2)", foreground: "var(--text-1)" },
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
