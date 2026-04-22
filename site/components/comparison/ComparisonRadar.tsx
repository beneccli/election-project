"use client";
// See docs/specs/website/comparison-page.md §4 (Positionnement).
//
// Overlaid per-candidate radar for the /comparer page. Renders exactly
// N polygons for N selected candidates — NO median, NO average polygon
// (editorial principle: no cardinal averaging, no synthesized ranking).

import { AXES } from "@/lib/anchors";
import { useLang } from "@/lib/lang-context";
import { t } from "@/lib/i18n";
import {
  axisLabelXY,
  makeRadarGeometry,
  polygonPoints,
  ringPoints,
} from "@/lib/derived/radar-geometry";
import type { ComparisonProjection } from "@/lib/derived/comparison-projection";

const SIZE = 300;

export function ComparisonRadar({
  candidates,
  slotColors,
}: {
  candidates: ComparisonProjection[];
  slotColors: readonly string[];
}) {
  const { lang } = useLang();
  const g = makeRadarGeometry(SIZE);
  const n = AXES.length;

  const axisLabels = AXES.map((a) => t(a.label, lang));

  return (
    <svg
      width={SIZE}
      height={SIZE}
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      role="img"
      aria-label={`Positionnement comparé — ${candidates
        .map((c) => c.displayName)
        .join(", ")}`}
      style={{ overflow: "visible" }}
    >
      {/* Concentric grid */}
      {[0, 0.25, 0.5, 0.75, 1].map((tRing, ri) => (
        <polygon
          key={ri}
          points={ringPoints(tRing, n, g)}
          fill="none"
          strokeWidth={ri === 2 ? 1.5 : 0.75}
          strokeDasharray={ri === 2 ? undefined : "3,3"}
          className="stroke-rule dark:stroke-gray-600"
        />
      ))}
      {/* Spokes */}
      {AXES.map((_, i) => {
        const p = ringPoints(1, n, g).split(" ")[i];
        const [x2, y2] = p.split(",").map(Number);
        return (
          <line
            key={i}
            x1={g.cx}
            y1={g.cy}
            x2={x2}
            y2={y2}
            strokeWidth={0.75}
            className="stroke-rule dark:stroke-gray-600"
          />
        );
      })}
      {/* Per-candidate polygons. Null modals collapse to 0 for shape. */}
      {candidates.map((c, slot) => {
        const values = c.positioning.map((v) => (v === null ? 0 : v));
        const allNull = c.positioning.every((v) => v === null);
        if (allNull) return null;
        const color = slotColors[slot % slotColors.length];
        return (
          <polygon
            key={c.id}
            points={polygonPoints(values, g)}
            fill={color}
            fillOpacity={0.12}
            stroke={color}
            strokeWidth={2}
            strokeLinejoin="round"
            data-candidate={c.id}
          />
        );
      })}
      {/* Axis labels */}
      {AXES.map((_, i) => {
        const [x, y] = axisLabelXY(i, n, g, 24);
        return (
          <text
            key={i}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-text-secondary"
            style={{ fontSize: 11, fontWeight: 500 }}
          >
            {axisLabels[i]}
          </text>
        );
      })}
    </svg>
  );
}
