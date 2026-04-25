// See docs/specs/website/i18n.md §4 (locale-parameterised comparison page)
// See docs/specs/website/comparison-page.md §4-5
import { Suspense } from "react";
import { ComparisonNavBar } from "@/components/chrome/ComparisonNavBar";
import { listComparisonProjections } from "@/lib/comparison-projections";
import { ComparisonBody } from "@/components/comparison/ComparisonBody";
import { ComparisonEmptyState } from "@/components/comparison/ComparisonSectionsPlaceholder";
import { CandidateSelector } from "@/components/comparison/CandidateSelector";
import { SelectedHeader } from "@/components/comparison/SelectedHeader";
import { PositionnementComparison } from "@/components/comparison/PositionnementComparison";
import { DomainesComparison } from "@/components/comparison/DomainesComparison";
import { IntergenComparison } from "@/components/comparison/IntergenComparison";
import { RisquesComparison } from "@/components/comparison/RisquesComparison";
import { ComparisonTransparencyFooter } from "@/components/comparison/ComparisonTransparencyFooter";
import type { Lang } from "@/lib/i18n";
import { t, UI_STRINGS } from "@/lib/i18n";

export interface ComparerPageBodyProps {
  lang: Lang;
}

export function ComparerPageBody({ lang }: ComparerPageBodyProps) {
  const entries = listComparisonProjections(lang);
  const excludeFictional = process.env.EXCLUDE_FICTIONAL === "1";
  return (
    <>
      <ComparisonNavBar lang={lang} />
      <main className="mx-auto max-w-[1100px] px-8 pb-24 pt-10">
        <header className="mb-10">
          <div
            className="mb-3 font-sans text-sm font-semibold uppercase tracking-[0.12em] text-accent"
            data-comparison-kicker
          >
            {t(UI_STRINGS.COMPARER_PAGE_KICKER, lang)}
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight">
            {t(UI_STRINGS.COMPARER_PAGE_H1, lang)}
          </h1>
          <p className="mt-3 max-w-prose text-sm text-text-secondary">
            {t(UI_STRINGS.COMPARER_PAGE_LEAD, lang)}
          </p>
        </header>
        <Suspense fallback={null}>
          <ComparisonBody
            entries={entries}
            excludeFictional={excludeFictional}
            emptyState={<ComparisonEmptyState />}
          >
            <CandidateSelector />
            <SelectedHeader />
            <PositionnementComparison />
            <DomainesComparison />
            <IntergenComparison />
            <RisquesComparison />
            <ComparisonTransparencyFooter />
          </ComparisonBody>
        </Suspense>
      </main>
    </>
  );
}
