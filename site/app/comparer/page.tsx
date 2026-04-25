// See docs/specs/website/comparison-page.md §4-5.
// Thin route shell — body in ComparerPageBody (shared with /en/comparer).
import type { Metadata } from "next";
import { ComparerPageBody } from "@/components/pages/ComparerPageBody";

export const metadata: Metadata = {
  title: "Comparer les programmes · Élection 2027",
  description:
    "Comparer côte à côte 2 à 4 programmes de l'élection présidentielle 2027.",
};

export default function ComparerPage() {
  return <ComparerPageBody lang="fr" />;
}
