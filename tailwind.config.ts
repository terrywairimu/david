import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: ["class"],
  content: ["./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}", "*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Custom colors to match HTML version
        border: "#e2e8f0", // Direct light grey color
        input: "#e2e8f0", // Direct light grey color
        ring: "#3b82f6", // Direct blue color
        background: "#ffffff", // Direct white color
        foreground: "#1e293b", // Direct dark color
        primary: {
          DEFAULT: "#3b82f6", // Direct blue color instead of CSS custom property
          foreground: "#ffffff",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "#f8fafc", // Direct light grey color
          foreground: "#64748b", // Direct medium grey color
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "#ffffff", // Direct white color
          foreground: "#1e293b", // Direct dark color
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
        
        // Chart colors for analytics - matching seller analytics
        "chart-1": "hsl(var(--chart-1))",
        "chart-2": "hsl(var(--chart-2))",
        "chart-3": "hsl(var(--chart-3))",
        "chart-4": "hsl(var(--chart-4))",
        "chart-5": "hsl(var(--chart-5))",
        
        // Additional semantic colors
        "success": "hsl(var(--success))",
        "error": "hsl(var(--error))",
        "warning": "hsl(var(--warning))",
        "info": "hsl(var(--info))",
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
