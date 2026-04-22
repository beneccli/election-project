// See docs/specs/website/landing-page.md §5.1
//
// Landing page: France-level context, candidate grid (analyzed +
// pending), compare CTA, methodology, footer. Pure server component;
// client islands are imported as children.

import type { Metadata } from "next";
import { LandingNavBar } from "@/components/chrome/LandingNavBar";
import LandingHero from "@/components/landing/LandingHero";
import CandidateGrid from "@/components/landing/CandidateGrid";
import CompareCta from "@/components/landing/CompareCta";
import MethodologyBlock from "@/components/landing/MethodologyBlock";
import LandingFooter from "@/components/landing/LandingFooter";
import { listLandingCards } from "@/lib/landing-cards";

export const metadata: Metadata = {
  title: "Élection 2027 · Analyse multi-IA des programmes",
  description:
    "Que proposent vraiment les candidats à l'Élysée ? Analyse indépendante par 4 à 5 grands modèles d'IA. Désaccords préservés. Sources publiques.",
};

export default function HomePage() {
  const cards = listLandingCards();
  const analyzedCount = cards.filter((c) => c.status === "analyzed").length;
  const pendingCount = cards.length - analyzedCount;

  return (
    <>
      <LandingNavBar lang="fr" />
      <main>
        <LandingHero
          lang="fr"
          analyzedCount={analyzedCount}
          pendingCount={pendingCount}
        />
        <CandidateGrid cards={cards} lang="fr" />
        <CompareCta lang="fr" />
        <MethodologyBlock lang="fr" />
      </main>
      <LandingFooter lang="fr" />
    </>
  );
}
