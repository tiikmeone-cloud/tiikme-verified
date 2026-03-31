import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: { center: true, padding: "2rem", screens: { "2xl": "1400px" } },
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--bg))",
        foreground: "hsl(var(--text-1))",
        brand: {
          DEFAULT: "hsl(var(--brand))",
          hover: "hsl(var(--brand-hover))",
          dim: "hsl(var(--brand-dim))",
          glow: "hsl(var(--brand-glow))",
        },
        surface: {
          DEFAULT: "hsl(var(--surface))",
          "2": "hsl(var(--surface-2))",
        },
        "t1": "hsl(var(--text-1))",
        "t2": "hsl(var(--text-2))",
        "t3": "hsl(var(--text-3))",
        primary: { DEFAULT: "hsl(var(--brand))", foreground: "hsl(var(--primary-foreground))" },
        secondary: { DEFAULT: "hsl(var(--surface-2))", foreground: "hsl(var(--text-1))" },
        destructive: { DEFAULT: "hsl(var(--danger))", foreground: "hsl(0 0% 100%)" },
        muted: { DEFAULT: "hsl(var(--surface))", foreground: "hsl(var(--text-2))" },
        accent: { DEFAULT: "hsl(var(--brand-dim))", foreground: "hsl(var(--text-1))" },
        popover: { DEFAULT: "hsl(var(--surface-2))", foreground: "hsl(var(--text-1))" },
        card: { DEFAULT: "hsl(var(--surface))", foreground: "hsl(var(--text-1))" },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
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
