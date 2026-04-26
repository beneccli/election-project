// See docs/specs/website/methodology-page.md §3.9.
import { t, UI_STRINGS, type Lang } from "@/lib/i18n";

export function LimitationsSection({ lang }: { lang: Lang }) {
  const items = [
    UI_STRINGS.METHODOLOGY_LIMITS_MODELS,
    UI_STRINGS.METHODOLOGY_LIMITS_SOURCES,
    UI_STRINGS.METHODOLOGY_LIMITS_HUMAN,
  ];
  return (
    <section id="limites" className="px-6 py-12 border-b border-rule">
      <div className="mx-auto max-w-4xl">
        <h2 className="font-display text-2xl font-bold text-text">
          {t(UI_STRINGS.METHODOLOGY_LIMITS_TITLE, lang)}
        </h2>
        <div className="mt-6 space-y-4 text-sm leading-relaxed text-text-secondary">
          {items.map((s, i) => (
            <p key={i}>{t(s, lang)}</p>
          ))}
        </div>
      </div>
    </section>
  );
}
