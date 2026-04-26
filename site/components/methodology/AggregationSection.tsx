// See docs/specs/website/methodology-page.md §3.5.
import { t, UI_STRINGS, type Lang } from "@/lib/i18n";

export function AggregationSection({ lang }: { lang: Lang }) {
  return (
    <section id="agregation" className="px-6 py-12 border-b border-rule">
      <div className="mx-auto max-w-4xl">
        <h2 className="font-display text-2xl font-bold text-text">
          {t(UI_STRINGS.METHODOLOGY_AGGREGATION_TITLE, lang)}
        </h2>
        <p className="mt-4 max-w-prose text-sm leading-relaxed text-text-secondary">
          {t(UI_STRINGS.METHODOLOGY_AGGREGATION_BODY, lang)}
        </p>
      </div>
    </section>
  );
}
