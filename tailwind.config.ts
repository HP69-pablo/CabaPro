import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/modules/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
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
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
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
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        slate: {
          50: "rgb(var(--slate-50) / <alpha-value>)",
          100: "rgb(var(--slate-100) / <alpha-value>)",
          200: "rgb(var(--slate-200) / <alpha-value>)",
          300: "rgb(var(--slate-300) / <alpha-value>)",
          400: "rgb(var(--slate-400) / <alpha-value>)",
          500: "rgb(var(--slate-500) / <alpha-value>)",
          600: "rgb(var(--slate-600) / <alpha-value>)",
          700: "rgb(var(--slate-700) / <alpha-value>)",
          800: "rgb(var(--slate-800) / <alpha-value>)",
          900: "rgb(var(--slate-900) / <alpha-value>)",
          950: "rgb(var(--slate-950) / <alpha-value>)",
        },
        brand: {
          accent: "rgb(var(--brand-accent) / <alpha-value>)",
          teal: {
            50: "rgb(var(--brand-primary-light) / <alpha-value>)",
            100: "rgb(var(--brand-primary-light) / <alpha-value>)",
            200: "rgb(var(--brand-primary) / 0.2)",
            300: "rgb(var(--brand-primary) / 0.4)",
            400: "rgb(var(--brand-primary) / 0.6)",
            500: "rgb(var(--brand-primary) / 0.8)",
            600: "rgb(var(--brand-primary) / <alpha-value>)",
            DEFAULT: "rgb(var(--brand-primary) / <alpha-value>)",
            700: "rgb(var(--brand-primary) / <alpha-value>)",
            800: "rgb(var(--brand-primary-hover) / <alpha-value>)",
            900: "rgb(var(--brand-primary-hover) / <alpha-value>)",
            950: "rgb(var(--brand-primary-hover) / <alpha-value>)",
          },
          coral: {
            50: "rgb(var(--brand-secondary-light) / <alpha-value>)",
            100: "rgb(var(--brand-secondary-light) / <alpha-value>)",
            200: "rgb(var(--brand-secondary) / 0.2)",
            300: "rgb(var(--brand-secondary) / 0.4)",
            400: "rgb(var(--brand-secondary) / 0.6)",
            DEFAULT: "rgb(var(--brand-secondary) / <alpha-value>)",
            500: "rgb(var(--brand-secondary) / <alpha-value>)",
            600: "rgb(var(--brand-secondary-hover) / <alpha-value>)",
            700: "rgb(var(--brand-secondary-hover) / <alpha-value>)",
            800: "rgb(var(--brand-secondary-hover) / <alpha-value>)",
            900: "rgb(var(--brand-secondary-hover) / <alpha-value>)",
          },
          primary: "rgb(var(--brand-primary) / <alpha-value>)",
          "primary-hover": "rgb(var(--brand-primary-hover) / <alpha-value>)",
          "primary-light": "rgb(var(--brand-primary-light))",
          secondary: "rgb(var(--brand-secondary) / <alpha-value>)",
          "secondary-hover": "rgb(var(--brand-secondary-hover) / <alpha-value>)",
          "secondary-light": "rgb(var(--brand-secondary-light))",
          bg: "rgb(var(--brand-bg) / <alpha-value>)",
          card: "rgb(var(--brand-card) / <alpha-value>)",
          border: "rgb(var(--brand-border) / <alpha-value>)",
          text: "rgb(var(--brand-text) / <alpha-value>)",
          muted: "rgb(var(--brand-muted) / <alpha-value>)",
        },
      },
      backgroundColor: {
        white: "rgb(var(--surface) / <alpha-value>)",
      },
      borderRadius: {
        "3xl": "1.5rem",
        "2xl": "1.25rem",
        xl: "1rem",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
