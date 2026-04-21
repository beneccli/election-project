"use client";
// See docs/specs/website/comparison-page.md §4.
//
// Placeholder rendering shared by the four comparison sections.
// Real implementations land in tasks 0093 (positioning), 0094 (domaines),
// 0095 (intergen), 0096 (risques).

import { COMPARISON_COLORS } from "@/lib/comparison-colors";
import { useComparison } from "./ComparisonBody";

export function CandidateSelector() {
  const { entries, slotOf, toggle, maxReached, excludeFictional } =
    useComparison();
  return (
    <section className="mb-12">
      <h2 className="mb-3 font-display text-lg font-semibold">
        Choisir 2 à 4 candidats
      </h2>
      <p className="mb-4 text-sm text-text-secondary">
        {excludeFictional
          ? "Les candidats fictifs sont exclus de la comparaison."
          : "Les candidats fictifs sont indiqués comme tels."}
      </p>
      <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {entries.map((entry) => {
          if (!entry.analyzable) {
            return (
              <li
                key={entry.id}
                className="rounded border border-rule bg-bg-subtle p-3 text-xs text-text-secondary opacity-60"
              >
                {entry.id} — indisponible ({entry.reason})
              </li>
            );
          }
          if (excludeFictional && entry.isFictional) return null;
          const slot = slotOf(entry.id);
          const selected = slot >= 0;
          const disabled = !selected && maxReached;
          const color = selected
            ? COMPARISON_COLORS[slot % COMPARISON_COLORS.length]
            : undefined;
          return (
            <li key={entry.id}>
              <button
                type="button"
                onClick={() => toggle(entry.id)}
                disabled={disabled}
                aria-pressed={selected}
                className={`w-full rounded border p-3 text-left text-sm transition ${
                  selected
                    ? "border-transparent text-white"
                    : "border-rule bg-bg hover:bg-bg-subtle"
                } ${disabled ? "cursor-not-allowed opacity-40" : ""}`}
                style={selected ? { backgroundColor: color } : undefined}
              >
                <span className="block font-medium">
                  {entry.displayName}
                  {entry.isFictional ? (
                    <span className="ml-1 text-xs font-normal opacity-70">
                      (fictif)
                    </span>
                  ) : null}
                </span>
                <span className="block text-xs opacity-80">{entry.party}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function Placeholder({ label }: { label: string }) {
  const { selectedIds } = useComparison();
  if (selectedIds.length < 2) return null;
  return (
    <section className="mb-12 rounded border border-dashed border-rule p-8">
      <h2 className="mb-2 font-display text-lg font-semibold">{label}</h2>
      <p className="text-sm text-text-secondary">
        À implémenter — {selectedIds.length} candidats sélectionnés.
      </p>
    </section>
  );
}

export function PositionnementComparisonPlaceholder() {
  return <Placeholder label="Positionnement" />;
}
export function DomainesComparisonPlaceholder() {
  return <Placeholder label="Domaines" />;
}
export function IntergenComparisonPlaceholder() {
  return <Placeholder label="Intergénérationnel" />;
}
export function RisquesComparisonPlaceholder() {
  return <Placeholder label="Risques" />;
}

export function ComparisonEmptyState() {
  return (
    <section className="rounded border border-rule bg-bg-subtle p-8 text-center">
      <p className="text-sm text-text-secondary">
        Sélectionnez au moins 2 candidats pour afficher la comparaison.
      </p>
    </section>
  );
}
