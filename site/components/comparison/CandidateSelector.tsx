"use client";
// See docs/specs/website/comparison-page.md §5.1 (candidate selector).
//
// Horizontal tile grid. Each tile is a focusable toggle button with an
// accessible label including the candidate's name, party, and current
// top-level grade so screen-reader users get the same summary sighted
// readers do.

import { COMPARISON_COLORS } from "@/lib/comparison-colors";
import { GradeBadge } from "@/components/widgets/GradeBadge";
import { useLang } from "@/lib/lang-context";
import { useComparison } from "./ComparisonBody";

export function CandidateSelector() {
  const { entries, slotOf, toggle, maxReached, excludeFictional } =
    useComparison();
  const { lang } = useLang();
  return (
    <section className="mb-10">
      <h2 className="mb-3 font-display text-lg font-semibold">
        {lang === "en" ? "Pick 2 to 4 candidates" : "Choisir 2 à 4 candidats"}
      </h2>
      <p className="mb-4 text-sm text-text-secondary">
        {excludeFictional
          ? lang === "en"
            ? "Fictional candidates are excluded from the comparison."
            : "Les candidats fictifs sont exclus de la comparaison."
          : lang === "en"
            ? "Fictional candidates are labelled as such."
            : "Les candidats fictifs sont indiqués comme tels."}
      </p>
      <ul
        role="list"
        className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4"
      >
        {entries.map((entry) => {
          if (!entry.analyzable) {
            return (
              <li
                key={entry.id}
                className="rounded border border-rule bg-bg-subtle p-3 text-xs text-text-secondary opacity-60"
              >
                {entry.id}
                {" — "}
                {lang === "en" ? "unavailable" : "indisponible"}
                {` (${entry.reason})`}
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
          const grade = entry.overallGrade;
          const gradeLabel = grade;
          const spectrumText =
            entry.spectrumStatus === "absent"
              ? null
              : entry.spectrumLabelDisplay;
          const ariaLabel =
            lang === "en"
              ? `${selected ? "Deselect" : "Select"} ${entry.displayName}, ${entry.party}, overall grade ${gradeLabel}${spectrumText ? `, positioning ${spectrumText}` : ""}`
              : `${selected ? "Désélectionner" : "Sélectionner"} ${entry.displayName}, ${entry.party}, note globale ${gradeLabel}${spectrumText ? `, positionnement ${spectrumText}` : ""}`;
          return (
            <li key={entry.id}>
              <button
                type="button"
                onClick={() => toggle(entry.id)}
                disabled={disabled}
                aria-pressed={selected}
                aria-label={ariaLabel}
                data-candidate={entry.id}
                className={`flex w-full items-center gap-3 rounded border p-3 text-left text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  selected
                    ? "border-transparent text-white"
                    : "border-rule bg-bg hover:bg-bg-subtle"
                } ${disabled ? "cursor-not-allowed opacity-40" : ""}`}
                style={selected ? { backgroundColor: color } : undefined}
              >
                <span className="flex-shrink-0">
                  <GradeBadge grade={grade} size="sm" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">
                    {entry.displayName}
                    {entry.isFictional ? (
                      <span className="ml-1 text-xs font-normal opacity-70">
                        {lang === "en" ? "(fictional)" : "(fictif)"}
                      </span>
                    ) : null}
                  </span>
                  <span className="block truncate text-xs opacity-80">
                    {entry.party}
                  </span>
                  {spectrumText ? (
                    <span
                      className={`block truncate text-xs ${selected ? "opacity-70" : "text-text-tertiary"}`}
                      data-testid="selector-spectrum"
                      data-spectrum-status={entry.spectrumStatus}
                    >
                      {spectrumText}
                    </span>
                  ) : null}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
