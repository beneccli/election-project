// See docs/specs/website/i18n.md §6 (fallback banner).
//
// Rendered when a non-FR locale was requested but no translation is
// published for the candidate, so the page falls back to FR canonical
// content. Dismissible for the current session (state lives in
// component memory; no persistence per spec §6.4).
"use client";

import { useState } from "react";
import { t, UI_STRINGS, type Lang } from "@/lib/i18n";

export function TranslationFallbackBanner({
  lang,
}: {
  lang: Exclude<Lang, "fr">;
}) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;
  const title = t(UI_STRINGS.TRANSLATION_FALLBACK_TITLE, lang);
  const body = t(UI_STRINGS.TRANSLATION_FALLBACK_BODY, lang);
  const dismissLabel = t(UI_STRINGS.TRANSLATION_FALLBACK_DISMISS, lang);
  return (
    <aside
      role="status"
      data-translation-fallback={lang}
      className="border-b border-rule bg-bg-elev"
    >
      <div className="mx-auto flex max-w-content items-start gap-4 px-8 py-3 text-sm text-text-secondary">
        <p className="flex-1">
          <strong className="font-semibold text-text">{title}.</strong> {body}
        </p>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label={dismissLabel}
          data-translation-fallback-dismiss
          className="shrink-0 rounded-full border border-border px-2 py-0.5 text-xs uppercase tracking-wider text-text-subtle transition-colors hover:border-text-subtle hover:text-text"
        >
          ×
        </button>
      </div>
    </aside>
  );
}
