"use client";
// See docs/specs/website/comparison-page.md §4 (Positionnement).
//
// Per-axis rows with slot-colored dots at each selected candidate's
// modal on a [-5, +5] track. The "⚡ ±K" spread marker appears when
// max − min ≥ 2 (strict inequality on 1). K is reported as the integer
// spread on an ordinal scale — NOT a mean.

import { AXES } from "@/lib/anchors";
import { useLang } from "@/lib/lang-context";
import { t } from "@/lib/i18n";
import type { ComparisonProjection } from "@/lib/derived/comparison-projection";

const SPREAD_THRESHOLD = 2;

function positionPct(value: number): number {
  // -5 → 0 %, +5 → 100 %
  const clamped = Math.max(-5, Math.min(5, value));
  return ((clamped + 5) / 10) * 100;
}

export function PositionnementRows({
  candidates,
  slotColors,
}: {
  candidates: ComparisonProjection[];
  slotColors: readonly string[];
}) {
  const { lang } = useLang();

  return (
    <ul className="flex flex-col gap-5">
      {AXES.map((axis, axisIndex) => {
        const label = t(axis.label, lang);
        const polarLow = t(axis.polarLow, lang);
        const polarHigh = t(axis.polarHigh, lang);

        const values: Array<{ id: string; name: string; value: number; color: string }>
          = [];
        const missing: string[] = [];
        candidates.forEach((c, slot) => {
          const v = c.positioning[axisIndex];
          const color = slotColors[slot % slotColors.length];
          if (v === null || v === undefined) {
            missing.push(c.displayName);
          } else {
            values.push({ id: c.id, name: c.displayName, value: v, color });
          }
        });

        const spread =
          values.length >= 2
            ? Math.max(...values.map((v) => v.value)) -
              Math.min(...values.map((v) => v.value))
            : 0;
        const showSpread = spread >= SPREAD_THRESHOLD;

        return (
          <li key={axis.axis}>
            <div className="mb-1 flex items-baseline justify-between">
              <span className="text-sm font-medium">{label}</span>
              {showSpread ? (
                <span
                  className="text-xs font-semibold"
                  style={{ color: "var(--risk-red)" }}
                  title="Écart inter-candidats sur cet axe (ordinal, en unités)"
                >
                  ⚡ ±{spread}
                </span>
              ) : missing.length > 0 ? (
                <span className="text-xs text-text-secondary">—</span>
              ) : null}
            </div>
            <div className="relative h-5 w-full rounded bg-bg-subtle">
              {/* Centre rule at 0 */}
              <div
                className="absolute top-0 h-full w-px bg-rule"
                style={{ left: "50%" }}
                aria-hidden
              />
              {values.map((v) => (
                <span
                  key={v.id}
                  className="absolute top-1/2 h-[9px] w-[9px] -translate-x-1/2 -translate-y-1/2 rounded-full ring-1 ring-bg"
                  style={{
                    left: `${positionPct(v.value)}%`,
                    backgroundColor: v.color,
                  }}
                  title={`${v.name}: ${v.value}`}
                  data-candidate={v.id}
                />
              ))}
            </div>
            <div className="mt-1 flex justify-between text-[11px] text-text-secondary">
              <span>{polarLow}</span>
              <span>{polarHigh}</span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
