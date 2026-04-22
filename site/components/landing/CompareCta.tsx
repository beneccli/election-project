// See docs/specs/website/landing-page.md §5.7
// Server component. CTA pointing at /comparer with two preselected
// candidates when available. No "Bientôt" badge — comparison is live.

import Link from "next/link";
import { buildCompareCtaHref } from "@/lib/compare-cta";
import { t, UI_STRINGS, type Lang } from "@/lib/i18n";
import type { CandidateIndexEntry } from "@/lib/candidates";

interface Props {
  lang: Lang;
  /** Optional injection point for tests. */
  entries?: CandidateIndexEntry[];
}

export default function CompareCta({ lang, entries }: Props) {
  const href = buildCompareCtaHref(entries);
  return (
    <section className="border-y border-rule bg-[color:var(--bg-subtle)] px-6 py-12">
      <div className="mx-auto flex max-w-6xl flex-col items-start gap-4 md:flex-row md:items-center md:justify-between md:gap-8">
        <div>
          <h2 className="font-display text-2xl text-text">
            {t(UI_STRINGS.LANDING_COMPARE_TITLE, lang)}
          </h2>
          <p className="mt-2 max-w-3xl text-sm text-text-secondary">
            {t(UI_STRINGS.LANDING_COMPARE_BODY, lang)}
          </p>
        </div>
        <Link
          href={href}
          data-cta="compare"
          className="inline-flex flex-shrink-0 items-center gap-2 rounded border border-accent bg-accent px-4 py-2 text-sm font-semibold uppercase tracking-wide text-bg no-underline transition-colors hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
        >
          {t(UI_STRINGS.LANDING_COMPARE_CTA, lang)}
          <span aria-hidden>›</span>
        </Link>
      </div>
    </section>
  );
}
