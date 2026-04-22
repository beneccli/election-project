"use client";
// See docs/specs/website/comparison-page.md §5.2 (sticky selected header).
//
// Sticky under the ComparisonNavBar (top: var(--nav-h)). Renders only
// when ≥ 2 candidates are selected. Each chip shows the slot color dot,
// a small GradeBadge, name, and party so readers retain identity as
// they scroll through the matrices.

import {
  COMPARISON_COLORS,
  MIN_COMPARISON_CANDIDATES,
} from "@/lib/comparison-colors";
import { GradeBadge } from "@/components/widgets/GradeBadge";
import type { ComparisonProjection } from "@/lib/derived/comparison-projection";
import { useLang } from "@/lib/lang-context";
import { useComparison } from "./ComparisonBody";

function firstName(name: string): string {
  return name.split(/\s+/)[0] ?? name;
}

export function SelectedHeader() {
  const { entries, selectedIds } = useComparison();
  const { lang } = useLang();
  if (selectedIds.length < MIN_COMPARISON_CANDIDATES) return null;
  const selected: ComparisonProjection[] = selectedIds
    .map((id) => entries.find((e) => e.analyzable && e.id === id))
    .filter((e): e is ComparisonProjection =>
      Boolean(e && e.analyzable === true),
    );
  return (
    <div
      data-comparison-selected-header
      className="sticky top-nav-h z-[70] -mx-8 mb-8 border-b border-rule bg-bg/95 px-8 py-2 backdrop-blur"
    >
      <ul
        role="list"
        aria-label={
          lang === "en" ? "Selected candidates" : "Candidats sélectionnés"
        }
        className="flex flex-wrap items-center gap-3"
      >
        {selected.map((c, slot) => {
          const color = COMPARISON_COLORS[slot % COMPARISON_COLORS.length];
          const spectrumText =
            c.spectrumStatus === "absent" ? null : c.spectrumLabelDisplay;
          return (
            <li
              key={c.id}
              data-candidate={c.id}
              className="inline-flex items-center gap-2 rounded-full border border-rule bg-bg-subtle px-3 py-1.5 text-xs"
            >
              <span
                aria-hidden
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: color }}
              />
              <GradeBadge grade={c.overallGrade} size="sm" />
              <span className="font-semibold text-text">
                {firstName(c.displayName)}
              </span>
              <span className="text-text-tertiary">·</span>
              <span className="text-text-secondary">{c.partyShort}</span>
              {spectrumText ? (
                <>
                  <span className="text-text-tertiary">·</span>
                  <span
                    className="text-text-tertiary"
                    data-testid="selected-header-spectrum"
                    data-spectrum-status={c.spectrumStatus}
                  >
                    {spectrumText}
                  </span>
                </>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
