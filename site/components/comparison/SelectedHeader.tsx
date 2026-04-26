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
import { t, UI_STRINGS } from "@/lib/i18n";
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
      className="sticky top-nav-h z-[70] -mx-8 mb-16 border-b-2 border-rule bg-bg/95 px-8 py-2 backdrop-blur"
    >
      <ul
        role="list"
        aria-label={t(UI_STRINGS.COMPARISON_SELECTED_HEADER, lang)}
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
              className="inline-flex items-center gap-2 px-3 text-xs border-r border-rule"
              style={{ borderRightWidth: slot === selectedIds.length - 1 ? 0 : 1 }}
            >
              <span
                aria-hidden
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: color }}
              />
              <GradeBadge grade={c.overallGrade} size="sm" />

              <div className="flex flex-col">
                <span className="font-semibold text-sm">
                  {firstName(c.displayName)}
                </span>
                {spectrumText ? (
                  <>
                    <span
                      className="text-text-tertiary text-xs"
                      data-testid="selected-header-spectrum"
                      data-spectrum-status={c.spectrumStatus}
                    >
                      {spectrumText}
                    </span>
                  </>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
