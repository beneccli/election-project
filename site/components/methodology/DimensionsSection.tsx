// See docs/specs/website/methodology-page.md §3.6.
import { t, UI_STRINGS, type Lang } from "@/lib/i18n";
import { DIMENSION_LABEL_KEYS } from "@/lib/methodology-content";

export function DimensionsSection({ lang }: { lang: Lang }) {
  return (
    <section id="dimensions" className="px-6 py-12 border-b border-rule">
      <div className="mx-auto max-w-4xl">
        <h2 className="font-display text-2xl font-bold text-text">
          {t(UI_STRINGS.METHODOLOGY_DIMENSIONS_TITLE, lang)}
        </h2>
        <p className="mt-4 max-w-prose text-sm leading-relaxed text-text-secondary">
          {t(UI_STRINGS.METHODOLOGY_DIMENSIONS_INTRO, lang)}
        </p>
        <ul className="mt-6 grid gap-2 md:grid-cols-2">
          {DIMENSION_LABEL_KEYS.map((key) => (
            <li
              key={key}
              className="rounded-md border border-rule bg-[color:var(--bg-card)] px-3 py-2 text-sm text-text"
            >
              {t(UI_STRINGS[key], lang)}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
