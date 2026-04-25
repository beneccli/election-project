// See docs/specs/website/i18n.md §4, §6 (locale-parameterised candidate page)
import Link from "next/link";
import { notFound } from "next/navigation";
import { loadCandidate } from "@/lib/candidates";
import { NavBar } from "@/components/chrome/NavBar";
import { Hero } from "@/components/chrome/Hero";
import { SectionNav } from "@/components/chrome/SectionNav";
import { TransparencyFooter } from "@/components/chrome/TransparencyFooter";
import { TransparencyDrawer } from "@/components/chrome/TransparencyDrawer";
import { SyntheseSection } from "@/components/sections/SyntheseSection";
import { PositionnementSection } from "@/components/sections/PositionnementSection";
import { DomainesSection } from "@/components/sections/DomainesSection";
import { IntergenSection } from "@/components/sections/IntergenSection";
import { RisquesSection } from "@/components/sections/RisquesSection";
import { TranslationFallbackBanner } from "@/components/chrome/TranslationFallbackBanner";
import { t, UI_STRINGS, type Lang } from "@/lib/i18n";

export interface CandidatePageBodyProps {
  id: string;
  lang: Lang;
}

export function CandidatePageBody({ id, lang }: CandidatePageBodyProps) {
  let data;
  try {
    data = loadCandidate(id, lang);
  } catch {
    notFound();
  }
  const { meta, versionMeta, aggregated, translation } = data;
  // Per spec §4.1, comparer link stays language-coherent.
  const comparerHref =
    lang === "fr"
      ? `/comparer?c=${encodeURIComponent(id)}`
      : `/${lang}/comparer?c=${encodeURIComponent(id)}`;
  const compareLabel = t(UI_STRINGS.CANDIDATE_PAGE_COMPARE_LINK, lang);

  return (
    <>
      <NavBar meta={meta} lang={lang} />
      <Hero meta={meta} versionMeta={versionMeta} aggregated={aggregated} />
      {translation.status === "missing" ? (
        <TranslationFallbackBanner lang={translation.lang} />
      ) : null}
      <div className="border-b border-rule bg-bg">
        <div className="mx-auto flex max-w-content justify-end px-8 py-2">
          <Link
            href={comparerHref}
            data-cta="compare-from-candidate"
            className="inline-flex items-center gap-1 text-xs font-medium text-text-secondary underline decoration-dotted underline-offset-4 hover:text-text"
          >
            {compareLabel}
            <span aria-hidden>→</span>
          </Link>
        </div>
      </div>
      <SectionNav />
      <main className="mx-auto max-w-content px-8 pb-32">
        <SyntheseSection aggregated={aggregated} />
        <PositionnementSection aggregated={aggregated} />
        <DomainesSection aggregated={aggregated} />
        <IntergenSection aggregated={aggregated} />
        <RisquesSection aggregated={aggregated} />
      </main>
      <TransparencyFooter id={id} versionMeta={versionMeta} lang={lang} />
      <TransparencyDrawer
        id={id}
        versionMeta={versionMeta}
        aggregated={aggregated}
      />
    </>
  );
}
