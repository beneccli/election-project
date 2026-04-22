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
  const selectedCount = entries.filter((entry) => slotOf(entry.id) >= 0).length;
  const maxSelectable = maxReached ? 4 : entries.length;

  return (
    <section className="mb-10 border-t border-rule pt-10">
      <h2 className="mb-3 uppercase text-sm text-text-secondary font-semibold">
        {lang === "en" ? `Selected candidates (${selectedCount}/${maxSelectable})` : `Candidats sélectionnés (${selectedCount}/${maxSelectable})`}
      </h2>
      <ul
        role="list"
        className="flex gap-3"
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
                className={`h-full flex flex-col items-start min-w-[160px] gap-3 rounded-lg border border-2 p-3 text-left text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  disabled ? "cursor-not-allowed opacity-40" : ""} ${
                  selected ? "bg-bg-card" : "bg-bg-subtle"
                }`}
                style={selected ? { border: `2px solid ${color}` } : undefined}
              >
                <div className="flex justify-between gap-3">
                  <div style={{ width:6, height:6, borderRadius:"50%", background: selected ? color : 'black', marginTop:2, flexShrink:0 }} />
                  {selected && <GradeBadge grade={grade} size="sm" />}
                </div>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">
                    {entry.displayName}
                    {entry.isFictional ? (
                      <span className="ml-1 text-xs font-normal opacity-70">
                        {lang === "en" ? "(fictional)" : "(fictif)"}
                      </span>
                    ) : null}
                  </span>
                  {/* <span className="block truncate text-xs opacity-80">
                    {entry.party}
                  </span> */}
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
                {selected && (
                  <div style={{ width:"100%", height:3, borderRadius:2, background: color, marginTop: 2 }} />
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
