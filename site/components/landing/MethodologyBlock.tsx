// See docs/specs/website/landing-page.md §5.8
// Server component. Two paragraphs + 5 method pills + "En savoir plus".

import Link from "next/link";
import { t, UI_STRINGS, type Lang } from "@/lib/i18n";

const PILL_KEYS = [
  "LANDING_METHOD_PILL_DIVERSITY",
  "LANDING_METHOD_PILL_SOURCES",
  "LANDING_METHOD_PILL_SYMMETRY",
  "LANDING_METHOD_PILL_DISSENT",
  "LANDING_METHOD_PILL_OPEN",
] as const;

export default function MethodologyBlock({ lang }: { lang: Lang }) {
  return (
    <section id="methode" className="px-6 py-12">
      <div className="mx-auto max-w-6xl">
        <h2 className="font-display text-2xl text-text">
          {t(UI_STRINGS.LANDING_METHOD_TITLE, lang)}
        </h2>
        <div className="mt-4 grid gap-6 md:grid-cols-2">
          <p className="text-sm text-text-secondary leading-relaxed">
            {t(UI_STRINGS.LANDING_METHOD_BODY_1, lang)}
          </p>
          <p className="text-sm text-text-secondary leading-relaxed">
            {t(UI_STRINGS.LANDING_METHOD_BODY_2, lang)}
          </p>
        </div>
        <ul className="mt-6 flex flex-wrap gap-2">
          {PILL_KEYS.map((key) => (
            <li
              key={key}
              className="rounded-full border border-rule bg-[color:var(--bg-card)] px-3 py-1 text-xs text-text-secondary"
            >
              {t(UI_STRINGS[key], lang)}
            </li>
          ))}
        </ul>
        <div className="mt-6">
          <Link
            href="/methodologie"
            className="text-sm font-medium text-accent underline decoration-dotted underline-offset-4"
          >
            {t(UI_STRINGS.LANDING_METHOD_LEARN_MORE, lang)}
          </Link>
        </div>
      </div>
    </section>
  );
}
