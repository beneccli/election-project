"use client";
// See docs/specs/website/nextjs-architecture.md §4.3
// See docs/specs/website/visual-components.md §4.1
// See docs/specs/website/candidate-page-polish.md §5.1
// Client-rendered SVG radar + DOM overlay for per-axis hover tooltips
// and optional per-model polygon overlays.
//
// EDITORIAL: `radarValue` is a SHAPE input only — never surfaced as a
// numeric score to the reader. See positioning-shape.ts.
import { useMemo } from "react";
import type { RadarShape } from "@/lib/derived/positioning-shape";
import { AXES } from "@/lib/anchors";
import { AXIS_KEYS } from "@/lib/derived/keys";
import type { Lang } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { modelColor } from "@/lib/model-color";
import { Tooltip } from "./Tooltip";

const SIZE = 280;
const CX = SIZE / 2;
const CY = SIZE / 2;
const R = 108;

function angle(i: number, n: number): number {
  return (Math.PI * 2 * i) / n - Math.PI / 2;
}

function toXY(i: number, val: number, n: number): [number, number] {
  const r = ((val + 5) / 10) * R;
  return [CX + r * Math.cos(angle(i, n)), CY + r * Math.sin(angle(i, n))];
}

export function PositioningRadar({
  shape,
  lang = "fr",
  highlight = null,
}: {
  shape: RadarShape;
  lang?: Lang;
  /** Single-selection highlight matching Candidate Page.html:
   *  - `null` → render consensus polygon (thick) plus every model overlay
   *    (thin). Consensus is the headline shape and must dominate.
   *  - model id → render only that model's polygon (no consensus fill).
   *  See docs/specs/website/candidate-page-polish.md §5.1. */
  highlight?: string | null;
}) {
  const n = shape.axes.length;
  const consensusPoints = shape.axes
    .map((ax, i) => {
      const [x, y] = toXY(i, ax.radarValue, n);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  // Per-model overlay polygon points — memoized so repeated enable/disable
  // doesn't re-compute unchanged polygons. See candidate-page-polish.md §5.1.
  const modelPolygons = useMemo(() => {
    return shape.models.map((m) => {
      const points = AXIS_KEYS.map((axisKey, i) => {
        const [x, y] = toXY(i, m.values[axisKey], n);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      }).join(" ");
      return {
        id: m.id,
        points,
        color: modelColor(m.id),
      };
    });
  }, [shape.models, n]);

  // Axis labels from canonical anchor definitions (identical across
  // candidates). Fall back to axis key if anchors missing.
  const axisLabels = shape.axes.map((ax) => {
    const meta = AXES.find((a) => a.axis === ax.key);
    return meta ? t(meta.label, lang) : ax.key;
  });

  const ariaSummary = shape.axes
    .map((ax, i) => `${axisLabels[i]}: ${ax.interval[0]} à ${ax.interval[1]}${ax.hasDissent ? " (désaccord)" : ""}`)
    .join(". ");

  // Pre-compute label coordinates — reused for label text AND for
  // overlay hit-areas.
  const labelCoords = shape.axes.map((_, i) => {
    const lr = R + 22;
    const a = angle(i, n);
    return {
      x: CX + lr * Math.cos(a),
      y: CY + lr * Math.sin(a),
    };
  });

  return (
    <div className="relative" style={{ width: SIZE, height: SIZE }}>
      <svg
      width={SIZE}
      height={SIZE}
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      role="img"
      aria-label={`Positionnement politique. ${ariaSummary}`}
      style={{ overflow: "visible" }}
    >
      {/* Concentric grid */}
      {[0, 0.25, 0.5, 0.75, 1].map((t_, ri) => (
        <polygon
          key={ri}
          points={shape.axes
            .map((_, i) => {
              const r = t_ * R;
              return `${CX + r * Math.cos(angle(i, n))},${CY + r * Math.sin(angle(i, n))}`;
            })
            .join(" ")}
          fill="none"
          strokeWidth={ri === 2 ? 1.5 : 0.75}
          strokeDasharray={ri === 2 ? undefined : "3,3"}
          className="stroke-rule dark:stroke-gray-600"
        />
      ))}
      {/* Spokes */}
      {shape.axes.map((_, i) => {
        const [x1, y1] = toXY(i, -5, n);
        const [x2, y2] = toXY(i, 5, n);
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            strokeWidth={0.75}
            className="stroke-rule dark:stroke-gray-600"
          />
        );
      })}
      {/* Per-model overlays render FIRST (underneath) when consensus is
          selected so the thicker consensus polygon dominates. When a
          single model is highlighted, render only that model. */}
      {highlight === null
        ? modelPolygons.map((m) => (
            <polygon
              key={`model-${m.id}`}
              points={m.points}
              fill={m.color}
              fillOpacity={0.07}
              stroke={m.color}
              strokeWidth={1.25}
              strokeOpacity={0.75}
              strokeLinejoin="round"
              data-model={m.id}
            />
          ))
        : modelPolygons
            .filter((m) => m.id === highlight)
            .map((m) => (
              <polygon
                key={`model-${m.id}`}
                points={m.points}
                fill={m.color}
                fillOpacity={0.18}
                stroke={m.color}
                strokeWidth={1.75}
                strokeOpacity={0.95}
                strokeLinejoin="round"
                data-model={m.id}
              />
            ))}
      {/* Consensus polygon — rendered last so it sits on top when shown.
          Thick filled shape vs thin model outlines = visual dominance. */}
      {highlight === null ? (
        <polygon
          points={consensusPoints}
          fill="var(--accent)"
          fillOpacity={0.16}
          stroke="var(--accent)"
          strokeWidth={3}
          strokeLinejoin="round"
        />
      ) : null}
      {/* Axis labels + dissent badges */}
      {shape.axes.map((ax, i) => {
        const { x: lx, y: ly } = labelCoords[i];
        const a = angle(i, n);
        const ta =
          Math.abs(Math.cos(a)) < 0.1 ? "middle" : lx < CX ? "end" : "start";
        return (
          <g key={ax.key}>
            <text
              x={lx}
              y={ly + 4}
              textAnchor={ta}
              fontSize={9}
              fontFamily="var(--font-text), DM Sans, sans-serif"
              fill="var(--text-secondary)"
              fontWeight={500}
              letterSpacing="0.04em"
              style={{ textTransform: "uppercase" }}
            >
              {axisLabels[i]}
            </text>
            {ax.hasDissent ? (
              <text
                x={lx}
                y={ly + 16}
                textAnchor={ta}
                fontSize={8}
                fontFamily="var(--font-text), DM Sans, sans-serif"
                fill="var(--risk-red)"
                fontWeight={700}
                letterSpacing="0.04em"
              >
                ⚡ dissent
              </text>
            ) : null}
          </g>
        );
      })}
      <circle cx={CX} cy={CY} r={2.5} fill="var(--rule)" />
    </svg>
      {/* DOM overlay — one hit-area per axis carries hover + focus.
          Positioned at the axis label with a 24×24 (minimum) touch target.
          The SVG is decorative for pointer users; interaction lives here. */}
      {shape.axes.map((ax, i) => {
        const { x: lx, y: ly } = labelCoords[i];
        const a = angle(i, n);
        // Let the tooltip escape away from the radar body: axes in the
        // upper half open upward, lower half open downward.
        const tooltipSide: "top" | "bottom" = ly < CY ? "top" : "bottom";
        // Align the hit-area horizontally with the label based on anchor.
        const anchor =
          Math.abs(Math.cos(a)) < 0.1
            ? "middle"
            : lx < CX
              ? "end"
              : "start";
        const HIT_W = 72;
        const HIT_H = 28;
        const left =
          anchor === "middle"
            ? lx - HIT_W / 2
            : anchor === "end"
              ? lx - HIT_W + 4
              : lx - 4;
        const top = ly - HIT_H / 2 + 4;
        return (
          <Tooltip
            key={`hit-${ax.key}`}
            as="button"
            side={tooltipSide}
            className="!absolute cursor-help rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            style={{
              left,
              top,
              width: HIT_W,
              height: HIT_H,
              background: "transparent",
              border: "none",
              padding: 0,
            }}
            content={
              <div className="space-y-0.5">
                <div className="text-[11px] font-semibold uppercase tracking-wider">
                  {axisLabels[i]}
                </div>
                <div>
                  Intervalle de consensus : {formatSigned(ax.interval[0])} à{" "}
                  {formatSigned(ax.interval[1])}
                </div>
                {ax.modal !== null ? (
                  <div>Valeur modale : {formatSigned(ax.modal)}</div>
                ) : (
                  <div>Valeur modale : non résolue (milieu d&apos;intervalle)</div>
                )}
                <div>
                  {ax.hasDissent
                    ? `Désaccord : ${ax.dissentCount} modèle${ax.dissentCount > 1 ? "s" : ""}`
                    : "Consensus"}
                </div>
              </div>
            }
          >
            <span
              aria-label={`${axisLabels[i]}: intervalle ${formatSigned(ax.interval[0])} à ${formatSigned(ax.interval[1])}${ax.hasDissent ? `, désaccord ${ax.dissentCount} modèles` : ", consensus"}`}
              className="block h-full w-full"
            />
          </Tooltip>
        );
      })}
    </div>
  );
}

function formatSigned(n: number): string {
  return n > 0 ? `+${n}` : `${n}`;
}
