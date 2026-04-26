// See docs/specs/website/methodology-page.md §3.8.
import { t, UI_STRINGS, type Lang } from "@/lib/i18n";
import { NOT_THIS_BULLETS } from "@/lib/methodology-content";

export function NotThisSection({ lang }: { lang: Lang }) {
  return (
    <section id="ce-que-non" className="px-6 py-12 border-b border-rule">
      <div className="mx-auto max-w-4xl">
        <h2 className="font-display text-2xl font-bold text-text">
          {t(UI_STRINGS.METHODOLOGY_NOT_THIS_TITLE, lang)}
        </h2>
        <ul className="mt-6 space-y-3 text-sm leading-relaxed text-text-secondary">
          {NOT_THIS_BULLETS.map((key) => (
            <li
              key={key}
              className="flex gap-3 border-l-2 border-rule pl-3"
            >
              <span className="text-text-tertiary">—</span>
              <span>{t(UI_STRINGS[key], lang)}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
