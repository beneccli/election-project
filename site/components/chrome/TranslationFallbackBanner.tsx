// See docs/specs/website/i18n.md §6 (fallback banner)
//
// Minimal placeholder rendered when a non-FR locale was requested but
// the translation file is not yet published, so the page falls back
// to FR canonical content. Full visual treatment lives in task 0126.
import type { Lang } from "@/lib/i18n";

const COPY: Record<Exclude<Lang, "fr">, { title: string; body: string }> = {
  en: {
    title: "Translation pending",
    body: "An English translation of this analysis is not yet published. The content below is shown in French — the canonical source.",
  },
};

export function TranslationFallbackBanner({
  lang,
}: {
  lang: Exclude<Lang, "fr">;
}) {
  const copy = COPY[lang];
  return (
    <aside
      role="status"
      data-translation-fallback={lang}
      className="border-b border-rule bg-bg-elev"
    >
      <div className="mx-auto max-w-content px-8 py-3 text-sm text-text-secondary">
        <strong className="font-semibold text-text">{copy.title}.</strong>{" "}
        {copy.body}
      </div>
    </aside>
  );
}
