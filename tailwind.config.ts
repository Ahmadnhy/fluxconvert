import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "on-secondary": "#ffffff",
        "background": "#f9f9fc",
        "outline-variant": "#c2c7cd",
        "on-primary-fixed": "#001e2e",
        "secondary-fixed": "#dce4e9",
        "on-tertiary": "#ffffff",
        "tertiary-fixed": "#ffdcbe",
        "surface-container-low": "#f3f3f6",
        "primary-container": "#547a95",
        "primary-fixed-dim": "#a5cbe9",
        "on-secondary-container": "#5c6468",
        "on-tertiary-fixed": "#2c1600",
        "tertiary-fixed-dim": "#f1bc8a",
        "error-container": "#ffdad6",
        "surface": "#f9f9fc",
        "on-error-container": "#93000a",
        "surface-dim": "#dadadc",
        "secondary-container": "#d9e1e6",
        "on-tertiary-fixed-variant": "#633f17",
        "on-primary-container": "#fffeff",
        "surface-variant": "#e2e2e5",
        "inverse-surface": "#2f3133",
        "primary": "#3b617b",
        "on-surface-variant": "#42474d",
        "on-secondary-fixed": "#151d20",
        "surface-bright": "#f9f9fc",
        "tertiary-container": "#986d41",
        "surface-container-high": "#e8e8ea",
        "error": "#ba1a1a",
        "surface-container-lowest": "#ffffff",
        "tertiary": "#7c552b",
        "on-surface": "#1a1c1e",
        "inverse-on-surface": "#f0f0f3",
        "on-tertiary-container": "#fffeff",
        "on-secondary-fixed-variant": "#40484c",
        "inverse-primary": "#a5cbe9",
        "surface-container-highest": "#e2e2e5",
        "secondary": "#576064",
        "outline": "#72787d",
        "on-background": "#1a1c1e",
        "secondary-fixed-dim": "#c0c8cd",
        "on-primary-fixed-variant": "#224b64",
        "surface-container": "#eeeef0",
        "on-error": "#ffffff",
        "on-primary": "#ffffff",
        "surface-tint": "#3c627c",
        "primary-fixed": "#c8e6ff"
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        lg: "0.5rem",
        xl: "0.75rem",
        full: "9999px"
      },
      spacing: {
        base: "8px",
        gutter: "24px",
        md: "24px",
        lg: "48px",
        sm: "12px",
        xs: "4px",
        xl: "80px",
        "container-max": "1120px"
      },
      fontFamily: {
        h2: ["var(--font-manrope)", "Manrope", "sans-serif"],
        "label-caps": ["var(--font-inter)", "Inter", "sans-serif"],
        "body-lg": ["var(--font-inter)", "Inter", "sans-serif"],
        h3: ["var(--font-manrope)", "Manrope", "sans-serif"],
        "body-sm": ["var(--font-inter)", "Inter", "sans-serif"],
        "body-md": ["var(--font-inter)", "Inter", "sans-serif"],
        h1: ["var(--font-manrope)", "Manrope", "sans-serif"]
      },
      fontSize: {
        h2: ["32px", { lineHeight: "1.3", letterSpacing: "-0.01em", fontWeight: "600" }],
        "label-caps": ["12px", { lineHeight: "1", letterSpacing: "0.05em", fontWeight: "600" }],
        "body-lg": ["18px", { lineHeight: "1.6", letterSpacing: "0", fontWeight: "400" }],
        h3: ["24px", { lineHeight: "1.4", letterSpacing: "0", fontWeight: "600" }],
        "body-sm": ["14px", { lineHeight: "1.5", letterSpacing: "0", fontWeight: "400" }],
        "body-md": ["16px", { lineHeight: "1.6", letterSpacing: "0", fontWeight: "400" }],
        h1: ["40px", { lineHeight: "1.2", letterSpacing: "-0.02em", fontWeight: "700" }]
      }
    }
  },
  plugins: [],
};

export default config;
