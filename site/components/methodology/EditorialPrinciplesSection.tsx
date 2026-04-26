// See docs/specs/website/methodology-page.md §3.3.
import { t, UI_STRINGS, type Lang } from "@/lib/i18n";
import { EDITORIAL_PRINCIPLES } from "@/lib/methodology-content";

export function EditorialPrinciplesSection({ lang }: { lang: Lang }) {
  return (
    <section id="principes" className="px-6 py-12 border-b border-rule">
      <div className="mx-auto max-w-5xl">
        <h2 className="font-display text-2xl font-bold text-text">
          {t(UI_STRINGS.METHODOLOGY_PRINCIPLES_TITLE, lang)}
        </h2>
        <ol className="mt-6 grid gap-4 md:grid-cols-2">
          {EDITORIAL_PRINCIPLES.map((p, idx) => (
            <li
              key={p.key}
              data-principle={p.key}
              className="rounded-md border border-rule bg-[color:var(--bg-card)] p-5"
            >
              <div className="text-xs font-semibold uppercase tracking-[0.1em] text-text-tertiary">
                {String(idx + 1).padStart(2, "0")}
              </div>
              <h3 className="mt-1 font-display text-lg font-semibold text-text">
                {t(UI_STRINGS[p.titleKey], lang)}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-text">
                {t(UI_STRINGS[p.statementKey], lang)}
              </p>
              <p className="mt-3 text-xs leading-relaxed text-text-secondary">
                {t(UI_STRINGS[p.exampleKey], lang)}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
