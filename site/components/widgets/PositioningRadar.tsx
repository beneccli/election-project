// See docs/specs/website/nextjs-architecture.md §4.3
// Pure-SVG static radar. Server component.
//
// EDITORIAL: `radarValue` is a SHAPE input only — never surfaced as a
// numeric score to the reader. See positioning-shape.ts.
import type { RadarShape } from "@/lib/derived/positioning-shape";
import { AXES } from "@/lib/anchors";
import type { Lang } from "@/lib/i18n";
import { t } from "@/lib/i18n";

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
}: {
  shape: RadarShape;
  lang?: Lang;
}) {
  const n = shape.axes.length;
  const consensusPoints = shape.axes
    .map((ax, i) => {
      const [x, y] = toXY(i, ax.radarValue, n);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  // Axis labels from canonical anchor definitions (identical across
  // candidates). Fall back to axis key if anchors missing.
  const axisLabels = shape.axes.map((ax) => {
    const meta = AXES.find((a) => a.axis === ax.key);
    return meta ? t(meta.label, lang) : ax.key;
  });

  const ariaSummary = shape.axes
    .map((ax, i) => `${axisLabels[i]}: ${ax.interval[0]} à ${ax.interval[1]}${ax.hasDissent ? " (désaccord)" : ""}`)
    .join(". ");

  return (
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
          stroke="var(--rule)"
          strokeWidth={ri === 2 ? 1.5 : 0.75}
          strokeDasharray={ri === 2 ? undefined : "3,3"}
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
            stroke="var(--rule)"
            strokeWidth={0.75}
          />
        );
      })}
      {/* Consensus shape */}
      <polygon
        points={consensusPoints}
        fill="var(--accent)"
        fillOpacity={0.13}
        stroke="var(--accent)"
        strokeWidth={2}
      />
      {/* Axis labels + dissent badges */}
      {shape.axes.map((ax, i) => {
        const lr = R + 22;
        const a = angle(i, n);
        const lx = CX + lr * Math.cos(a);
        const ly = CY + lr * Math.sin(a);
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
  );
}
