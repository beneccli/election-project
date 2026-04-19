"use client";

import { useLang } from "@/lib/lang-context";
import { t, UI_STRINGS } from "@/lib/i18n";

export function LanguageToggle() {
  const { lang, setLang } = useLang();
  const next: typeof lang = lang === "fr" ? "en" : "fr";
  const label =
    next === "en"
      ? t(UI_STRINGS.TOGGLE_LANG_EN, lang)
      : t(UI_STRINGS.TOGGLE_LANG_FR, lang);

  return (
    <button
      type="button"
      onClick={() => setLang(next)}
      aria-label={label}
      className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-xs font-medium uppercase tracking-wider text-text-subtle transition-colors hover:border-text-subtle hover:text-text"
    >
      <span>{lang.toUpperCase()}</span>
      <span aria-hidden="true">→</span>
      <span>{next.toUpperCase()}</span>
    </button>
  );
}
