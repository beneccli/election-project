"use client";

// See docs/specs/website/landing-page.md §5.4
//
// Pure-SVG area chart, ported from the Landing Page.html prototype
// `makeAreaChart()`. React-native: no inline template strings, no
// charting library, OKLCH colors read from CSS variables at runtime
// so the chart follows theme changes.

import { useEffect, useId, useMemo, useState } from "react";
import type { ContextSeries } from "@/lib/landing-context";
import { t, type Lang } from "@/lib/i18n";

interface Props {
  series: ContextSeries;
  lang: Lang;
  widthPx?: number;
  heightPx?: number;
  /** Explicit year tick labels. Defaults to first / middle / last. */
  labelYears?: number[];
}

interface ThemeColors {
  stroke: string;
  fill: string;
  text: string;
  rule: string;
}

const DEFAULTS = {
  width: 520,
  height: 88,
  padT: 8,
  padR: 8,
  padB: 24,
  padL: 8,
} as const;

const SSR_FALLBACK: ThemeColors = {
  stroke: "#0057ff",
  fill: "#0057ff",
  text: "#333",
  rule: "#ccc",
};

function readThemeColors(token: "accent" | "risk-red"): ThemeColors {
  if (typeof document === "undefined") {
    return SSR_FALLBACK;
  }
  const style = getComputedStyle(document.documentElement);
  const strokeVar = token === "risk-red" ? "--risk-red" : "--accent";
  return {
    stroke: style.getPropertyValue(strokeVar).trim() || SSR_FALLBACK.stroke,
    fill: style.getPropertyValue(strokeVar).trim() || SSR_FALLBACK.fill,
    text: style.getPropertyValue("--text-tertiary").trim() || SSR_FALLBACK.text,
    rule: style.getPropertyValue("--rule-light").trim() || SSR_FALLBACK.rule,
  };
}

/**
 * Subscribe to `data-theme` attribute changes on <html>.
 *
 * The hook deliberately returns the SSR fallback on the first client
 * render so server-rendered HTML matches the initial DOM (avoids a
 * hydration mismatch). Actual OKLCH values are read in an effect,
 * triggering a single re-render after mount.
 */
function useThemeColors(token: "accent" | "risk-red"): ThemeColors {
  const [colors, setColors] = useState<ThemeColors>(SSR_FALLBACK);
  useEffect(() => {
    setColors(readThemeColors(token));
    if (typeof window === "undefined") return;
    const observer = new MutationObserver(() => {
      setColors(readThemeColors(token));
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => observer.disconnect();
  }, [token]);
  return colors;
}

function defaultYearLabels(points: ContextSeries["points"]): number[] {
  if (points.length <= 3) return points.map(([y]) => y);
  const first = points[0][0];
  const last = points[points.length - 1][0];
  const mid = points[Math.floor(points.length / 2)][0];
  return [first, mid, last];
}

export default function StakesAreaChart({
  series,
  lang,
  widthPx = DEFAULTS.width,
  heightPx = DEFAULTS.height,
  labelYears,
}: Props) {
  const theme = useThemeColors(series.colorToken);
  const gradientId = useId();
  const gradientProjId = useId();
  const titleId = useId();

  const geom = useMemo(() => {
    const cw = widthPx - DEFAULTS.padL - DEFAULTS.padR;
    const ch = heightPx - DEFAULTS.padT - DEFAULTS.padB;
    const pts = series.points;
    const xMin = pts[0][0];
    const xMax = pts[pts.length - 1][0];
    const xScale = (yr: number): number =>
      DEFAULTS.padL + ((yr - xMin) / (xMax - xMin)) * cw;
    const yScale = (v: number): number =>
      DEFAULTS.padT +
      ch -
      ((v - series.yMin) / (series.yMax - series.yMin)) * ch;

    const line = `M${pts.map(([yr, v]) => `${xScale(yr).toFixed(1)},${yScale(v).toFixed(1)}`).join(" L")}`;

    const proj = series.projectionFrom;
    const splitIdx = proj
      ? Math.max(0, pts.findIndex((d) => d[0] >= proj))
      : pts.length - 1;

    const solidRange = pts.slice(0, splitIdx + 1);
    const projRange = proj ? pts.slice(splitIdx) : [];
    const baseY = (DEFAULTS.padT + ch).toFixed(1);

    const toArea = (range: typeof pts): string => {
      if (range.length < 2) return "";
      const body = range
        .map(([yr, v]) => `${xScale(yr).toFixed(1)},${yScale(v).toFixed(1)}`)
        .join(" L");
      const rx = xScale(range[range.length - 1][0]).toFixed(1);
      const lx = xScale(range[0][0]).toFixed(1);
      return `M${body} L${rx},${baseY} L${lx},${baseY} Z`;
    };

    return {
      cw,
      ch,
      xScale,
      yScale,
      line,
      solidArea: toArea(solidRange),
      projArea: proj ? toArea(projRange) : "",
    };
  }, [series, widthPx, heightPx]);

  const years = labelYears ?? defaultYearLabels(series.points);
  const ariaLabel = t(series.title, lang);
  const sourceLabel = t(series.source.label, lang);
  const projectionLabel = "projection →";

  return (
    <div className="flex flex-col gap-2">
      <svg
        viewBox={`0 0 ${widthPx} ${heightPx}`}
        preserveAspectRatio="none"
        role="img"
        aria-labelledby={titleId}
        className="block w-full h-auto"
      >
        <title id={titleId}>{ariaLabel}</title>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={theme.fill} stopOpacity="0.35" />
            <stop offset="100%" stopColor={theme.fill} stopOpacity="0.02" />
          </linearGradient>
          <linearGradient id={gradientProjId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={theme.fill} stopOpacity="0.15" />
            <stop offset="100%" stopColor={theme.fill} stopOpacity="0.01" />
          </linearGradient>
        </defs>

        {geom.solidArea && (
          <path d={geom.solidArea} fill={`url(#${gradientId})`} />
        )}
        {geom.projArea && (
          <path d={geom.projArea} fill={`url(#${gradientProjId})`} />
        )}

        <path
          d={geom.line}
          fill="none"
          stroke={theme.stroke}
          strokeWidth={1.5}
        />

        {series.refLine && (
          <g data-testid="ref-line">
            <line
              x1={DEFAULTS.padL}
              y1={geom.yScale(series.refLine.y).toFixed(1)}
              x2={widthPx - DEFAULTS.padR}
              y2={geom.yScale(series.refLine.y).toFixed(1)}
              strokeWidth={1}
              strokeDasharray="3,3"
              className="stroke-red-800 dark:stroke-red-500"
            >
              <title>{t(series.refLine.label, lang)}</title>
            </line>
            <text
              x={widthPx - DEFAULTS.padR - 2}
              y={(geom.yScale(series.refLine.y) - 3).toFixed(1)}
              textAnchor="end"
              fontFamily="DM Sans, sans-serif"
              className="text-sm fill-red-800 dark:fill-red-500"
            >
              {t(series.refLine.label, lang)}
            </text>
          </g>
        )}

        {series.projectionFrom != null && (
          <g data-testid="projection-separator">
            <line
              x1={geom.xScale(series.projectionFrom).toFixed(1)}
              y1={DEFAULTS.padT}
              x2={geom.xScale(series.projectionFrom).toFixed(1)}
              y2={DEFAULTS.padT + geom.ch}
              strokeDasharray="2,3"
              className="stroke-gray-500 dark:stroke-gray-300 stroke-1"
            />
            <text
              x={(geom.xScale(series.projectionFrom) + 4).toFixed(1)}
              y={(DEFAULTS.padT + 10).toFixed(1)}
              fontFamily="DM Sans, sans-serif"
              className="text-sm fill-gray-800 dark:fill-gray-300"
            >
              {projectionLabel}
            </text>
          </g>
        )}

        {years.map((yr, i) => (
          <text
            key={yr}
            x={(geom.xScale(yr) + (i == 0 ? 10 : (i == 2 ? -10 : 0))).toFixed(1)}
            y={heightPx - 4}
            textAnchor="middle"
            fontSize={12}
            fill={theme.text}
            fontFamily="DM Sans, sans-serif"
          >
            {yr}
          </text>
        ))}
      </svg>

      <a
        href={series.source.url}
        target="_blank"
        rel="noopener noreferrer"
        className="self-start text-sm text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] underline underline-offset-2 decoration-dotted"
      >
        Source: {sourceLabel}
      </a>
    </div>
  );
}
