"use client";

// See docs/specs/website/i18n.md §4 (URL is the source of truth)
import { createContext, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { Lang } from "./i18n";

type LangContextValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
};

const LangContext = createContext<LangContextValue | null>(null);

/**
 * Provider seeded by the route segment (`/` → fr, `/en/...` → en).
 * No localStorage read — the URL is canonical. The toggle (task 0126)
 * navigates to the sibling URL rather than mutating client state.
 */
export function LangProvider({
  initial,
  children,
}: {
  initial: Lang;
  children: ReactNode;
}) {
  const [lang, setLangState] = useState<Lang>(initial);

  const value = useMemo<LangContextValue>(
    () => ({ lang, setLang: setLangState }),
    [lang],
  );

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang(): LangContextValue {
  const ctx = useContext(LangContext);
  if (!ctx) {
    // Safe fallback when a consumer renders outside the provider (e.g.
    // unit-test rendering of a leaf component). Treated as read-only FR.
    return { lang: "fr", setLang: () => {} };
  }
  return ctx;
}
