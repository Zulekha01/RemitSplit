import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: {
        "2xl": "1280px",
      },
    },
    extend: {
      fontFamily: {
        serif: ["'Playfair Display'", "'Times New Roman'", "serif"],
        body: ["'Lora'", "Georgia", "serif"],
        sans: ["'Inter'", "'Helvetica Neue'", "sans-serif"],
        mono: ["'JetBrains Mono'", "'Courier New'", "monospace"],
      },
      colors: {
        paper: "#F9F9F7",
        ink: "#111111",
        divider: "#E5E5E0",
        editorial: "#CC0000",
        border: "#111111",
        input: "#111111",
        ring: "#111111",
        background: "#F9F9F7",
        foreground: "#111111",
        primary: {
          DEFAULT: "#111111",
          foreground: "#F9F9F7",
        },
        secondary: {
          DEFAULT: "#E5E5E0",
          foreground: "#111111",
        },
        destructive: {
          DEFAULT: "#CC0000",
          foreground: "#F9F9F7",
        },
        muted: {
          DEFAULT: "#E5E5E0",
          foreground: "#666666",
        },
        accent: {
          DEFAULT: "#CC0000",
          foreground: "#F9F9F7",
        },
        popover: {
          DEFAULT: "#F9F9F7",
          foreground: "#111111",
        },
        card: {
          DEFAULT: "#F9F9F7",
          foreground: "#111111",
        },
        neutral: {
          100: "#F5F5F5",
          200: "#E5E5E5",
          400: "#A3A3A3",
          500: "#737373",
          600: "#525252",
          700: "#404040",
        },
      },
      borderRadius: {
        none: "0px",
        sm: "0px",
        md: "0px",
        lg: "0px",
        xl: "0px",
        "2xl": "0px",
        "3xl": "0px",
        full: "0px",
      },
    },
  },
  plugins: [],
};
export default config;
