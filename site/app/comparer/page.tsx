// See docs/specs/website/comparison-page.md §4-5.
import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: "Comparer les programmes · Élection 2027",
  description:
    "Comparer côte à côte 2 à 4 programmes de l'élection présidentielle 2027.",
};

export default function ComparerPage() {
  const entries = listComparisonProjections();
  const excludeFictional = process.env.EXCLUDE_FICTIONAL === "1";
  return (
    <>
      <ComparisonNavBar />
      <main className="mx-auto max-w-[1100px] px-8 pb-24 pt-10">
        <header className="mb-10">
          <div
            className="mb-3 font-sans text-sm font-semibold uppercase tracking-[0.12em] text-accent"
            data-comparison-kicker
          >
            Comparaison
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight">
            Confronter les programmes
          </h1>
          <p className="mt-3 max-w-prose text-sm text-text-secondary">
            Sélectionnez 2 à 4 candidats pour les comparer côte à côte sur les
            mêmes dimensions. Les scores affichés sont ceux déjà publiés sur
            chaque fiche candidat — aucune analyse supplémentaire n'est
            produite ici. La comparaison ne classe pas les candidats ; elle
            les juxtapose.
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
