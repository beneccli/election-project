"use client";

// See docs/specs/website/nextjs-architecture.md §5.3
import { useEffect, useState } from "react";

type Theme = "light" | "dark";
const STORAGE_KEY = "e27-theme";

function readInitial(): Theme {
  if (typeof document === "undefined") return "light";
  const attr = document.documentElement.getAttribute("data-theme");
  return attr === "dark" ? "dark" : "light";
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(readInitial);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* storage unavailable; ignore */
    }
  }, [theme]);

  const next = theme === "dark" ? "light" : "dark";
  const label = theme === "dark" ? "Mode clair" : "Mode sombre";

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      aria-label={label}
      className="inline-flex items-center gap-1.5 rounded-md border border-rule px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-text-secondary transition-colors hover:border-accent hover:text-accent"
    >
      {theme === "dark" ? "☀︎" : "☾"}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
