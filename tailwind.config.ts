import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: ["class"],
  content: ["./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}", "*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Custom colors to match HTML version
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "#6366f1", // From --primary-gradient start
          foreground: "#ffffff",
        },
        secondary: {
          DEFAULT: "#3b82f6", // From --secondary-gradient start
          foreground: "#ffffff",
        },
        destructive: {
          DEFAULT: "#ef4444",
          foreground: "#ffffff",
        },
        muted: {
          DEFAULT: "#f8fafc",
          foreground: "#64748b", // --text-secondary
        },
        accent: {
          DEFAULT: "#f1f5f9",
          foreground: "#1e293b", // --text-primary
        },
        popover: {
          DEFAULT: "#ffffff",
          foreground: "#1e293b", // --text-primary
        },
        card: {
          DEFAULT: "#ffffff",
          foreground: "#1e293b", // --text-primary
        },
        // Custom text colors from HTML
        "text-primary": "#1e293b",
        "text-secondary": "#64748b", 
        "text-tertiary": "#e7e5d8",
        "text-primary-light": "#ffffff",
        // Custom gradients as solid colors for fallback
        "primary-gradient": "#6366f1",
        "secondary-gradient": "#3b82f6",
        "tertiary-gradient": "#3f3f42",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        // Add custom border-radius values to match HTML version
        "2xl": "24px",
        "xl": "16px",
        "action": "8px",
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
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}

export default config
