// See docs/specs/website/i18n.md §4 (locale-parameterised page bodies)
// See docs/specs/website/landing-page.md §5.1
import { LandingNavBar } from "@/components/chrome/LandingNavBar";
import LandingHero from "@/components/landing/LandingHero";
import CandidateGrid from "@/components/landing/CandidateGrid";
import CompareCta from "@/components/landing/CompareCta";
import MethodologyBlock from "@/components/landing/MethodologyBlock";
import LandingFooter from "@/components/landing/LandingFooter";
import { listLandingCards } from "@/lib/landing-cards";
import type { Lang } from "@/lib/i18n";

export interface LandingPageBodyProps {
  lang: Lang;
}

export function LandingPageBody({ lang }: LandingPageBodyProps) {
  const cards = listLandingCards(lang);
  return (
    <>
      <LandingNavBar lang={lang} />
      <main>
        <LandingHero lang={lang} />
        <CandidateGrid cards={cards} lang={lang} />
        <CompareCta lang={lang} />
        <MethodologyBlock lang={lang} />
      </main>
      <LandingFooter lang={lang} />
    </>
  );
}
