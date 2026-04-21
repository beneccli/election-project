"use client";
// See docs/specs/website/comparison-page.md §5.
//
// Empty-state panel rendered by <ComparisonBody> when fewer than 2
// candidates are selected. The picker itself moved to <CandidateSelector>
// in task 0097; this file now only hosts the empty state.

export function ComparisonEmptyState() {
  return (
    <section
      data-comparison-empty
      className="rounded border border-rule bg-bg-subtle p-8 text-center"
    >
      <p className="text-sm text-text-secondary">
        Sélectionnez au moins 2 candidats pour afficher la comparaison.
      </p>
    </section>
  );
}
