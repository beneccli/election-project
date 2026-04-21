// See docs/specs/website/comparison-page.md §4.
import type { Metadata } from "next";
import { Suspense } from "react";
import { ComparisonNavBar } from "@/components/chrome/ComparisonNavBar";
import { listComparisonProjections } from "@/lib/comparison-projections";
import { ComparisonBody } from "@/components/comparison/ComparisonBody";
import {
  CandidateSelector,
  ComparisonEmptyState,
  DomainesComparisonPlaceholder,
  IntergenComparisonPlaceholder,
  RisquesComparisonPlaceholder,
} from "@/components/comparison/ComparisonSectionsPlaceholder";
import { PositionnementComparison } from "@/components/comparison/PositionnementComparison";

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
      <main className="mx-auto max-w-content px-8 pb-32 pt-10">
        <header className="mb-10">
          <h1 className="font-display text-3xl font-bold tracking-tight">
            Comparer les programmes
          </h1>
          <p className="mt-3 max-w-prose text-sm text-text-secondary">
            Sélectionnez 2 à 4 candidats pour les comparer côte à côte sur les
            mêmes dimensions. Les scores affichés sont ceux déjà publiés sur
            chaque fiche candidat — aucune analyse supplémentaire n'est
            produite ici.
          </p>
        </header>
        <Suspense fallback={null}>
          <ComparisonBody
            entries={entries}
            excludeFictional={excludeFictional}
            emptyState={<ComparisonEmptyState />}
          >
            <CandidateSelector />
            <PositionnementComparison />
            <DomainesComparisonPlaceholder />
            <IntergenComparisonPlaceholder />
            <RisquesComparisonPlaceholder />
          </ComparisonBody>
        </Suspense>
      </main>
    </>
  );
}
