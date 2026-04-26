// See docs/specs/website/methodology-page.md §3.10.
import { t, UI_STRINGS, type Lang } from "@/lib/i18n";

export function GovernanceSection({ lang }: { lang: Lang }) {
  const lines = [
    UI_STRINGS.METHODOLOGY_GOVERNANCE_MAINTAINER,
    UI_STRINGS.METHODOLOGY_GOVERNANCE_FUNDING,
    UI_STRINGS.METHODOLOGY_GOVERNANCE_AFFILIATION,
    UI_STRINGS.METHODOLOGY_GOVERNANCE_COST,
    UI_STRINGS.METHODOLOGY_GOVERNANCE_SOURCE,
  ];
  return (
    <section id="gouvernance" className="px-6 py-12">
      <div className="mx-auto max-w-4xl">
        <h2 className="font-display text-2xl font-bold text-text">
          {t(UI_STRINGS.METHODOLOGY_GOVERNANCE_TITLE, lang)}
        </h2>
        <ul className="mt-6 space-y-3 text-sm leading-relaxed text-text-secondary">
          {lines.map((s, i) => (
            <li
              key={i}
              className="rounded-md border border-rule bg-[color:var(--bg-card)] px-4 py-3"
            >
              {t(s, lang)}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
