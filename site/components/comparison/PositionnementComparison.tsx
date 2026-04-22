"use client";
// See docs/specs/website/comparison-page.md §4 (Positionnement).
import { COMPARISON_COLORS } from "@/lib/comparison-colors";
import { useComparison } from "./ComparisonBody";
import { ComparisonRadar } from "./ComparisonRadar";
import { PositionnementRows } from "./PositionnementRows";
import type { ComparisonProjection } from "@/lib/derived/comparison-projection";

export function PositionnementComparison() {
  const { entries, selectedIds } = useComparison();
  if (selectedIds.length < 2) return null;

  const selected: ComparisonProjection[] = selectedIds
    .map((id) => entries.find((e) => e.analyzable && e.id === id))
    .filter((e): e is ComparisonProjection =>
      Boolean(e && e.analyzable === true),
    );
  if (selected.length < 2) return null;

  return (
    <section id="positionnement" className="mb-16">
      <header className="mb-5">
        <h2 className="font-display text-xl font-semibold">Positionnement</h2>
        <p className="mt-1 max-w-prose text-sm text-text-secondary">
          Position modale de chaque programme sur cinq axes politiques. Les
          polygones superposés et les dots par axe restituent les écarts sans
          les lisser — chaque ligne est ordinale, aucune moyenne n'est
          calculée.
        </p>
      </header>
      <div className="grid items-start gap-10 md:grid-cols-[auto_1fr]">
        <div className="flex justify-center md:justify-start">
          <ComparisonRadar
            candidates={selected}
            slotColors={COMPARISON_COLORS}
          />
        </div>
        <PositionnementRows
          candidates={selected}
          slotColors={COMPARISON_COLORS}
        />
      </div>
    </section>
  );
}
