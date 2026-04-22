// See docs/specs/website/comparison-page.md §4.
//
// Shared ring / axis / coordinate math for radar visualizations.
// Extracted so `PositioningRadar` (candidate page) and
// `ComparisonRadar` (comparison page) render identical geometry.

export interface RadarGeometry {
  size: number;
  cx: number;
  cy: number;
  r: number;
}

export function makeRadarGeometry(size: number, padding = 42): RadarGeometry {
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - padding;
  return { size, cx, cy, r };
}

export function angleAt(i: number, n: number): number {
  return (Math.PI * 2 * i) / n - Math.PI / 2;
}

/** Project an axis value in [-5, +5] to (x, y) at the given geometry. */
export function axisToXY(
  i: number,
  value: number,
  n: number,
  g: RadarGeometry,
): [number, number] {
  const clamped = Math.max(-5, Math.min(5, value));
  const r = ((clamped + 5) / 10) * g.r;
  const a = angleAt(i, n);
  return [g.cx + r * Math.cos(a), g.cy + r * Math.sin(a)];
}

/** Outer label coordinates (for axis names outside the outermost ring). */
export function axisLabelXY(
  i: number,
  n: number,
  g: RadarGeometry,
  offset = 22,
): [number, number] {
  const a = angleAt(i, n);
  const lr = g.r + offset;
  return [g.cx + lr * Math.cos(a), g.cy + lr * Math.sin(a)];
}

/** Concentric grid ring points at fractional radius t in [0, 1]. */
export function ringPoints(t: number, n: number, g: RadarGeometry): string {
  const pts: string[] = [];
  for (let i = 0; i < n; i++) {
    const a = angleAt(i, n);
    const r = t * g.r;
    pts.push(`${(g.cx + r * Math.cos(a)).toFixed(1)},${(g.cy + r * Math.sin(a)).toFixed(1)}`);
  }
  return pts.join(" ");
}

/** Convenience: polygon-points string from a per-axis value array. */
export function polygonPoints(
  values: ReadonlyArray<number>,
  g: RadarGeometry,
): string {
  const n = values.length;
  return values
    .map((v, i) => {
      const [x, y] = axisToXY(i, v, n, g);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}
