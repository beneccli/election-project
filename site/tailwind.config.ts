// See docs/specs/website/nextjs-architecture.md §5
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  // Dark mode is handled via the [data-theme="dark"] selector on <html>;
  // we do not use Tailwind's `dark:` variant. Tokens swap via CSS variables.
  darkMode: ["selector", '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        "bg-card": "var(--bg-card)",
        "bg-subtle": "var(--bg-subtle)",
        text: "var(--text)",
        "text-secondary": "var(--text-secondary)",
        "text-tertiary": "var(--text-tertiary)",
        accent: "var(--accent)",
        "accent-subtle": "var(--accent-subtle)",
        "risk-red": "var(--risk-red)",
        rule: "var(--rule)",
        "rule-light": "var(--rule-light)",
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-text)", "system-ui", "sans-serif"],
      },
      spacing: {
        "nav-h": "var(--nav-h)",
        "section-nav-h": "var(--section-nav-h)",
      },
      maxWidth: {
        content: "var(--content-max)",
      },
    },
  },
  plugins: [],
};

export default config;
