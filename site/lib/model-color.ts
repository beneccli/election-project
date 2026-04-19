// Deterministic model → accent-color mapping. Used by the Positionnement
// legend and the AxisAgreementBars dissent markers.
//
// Colors echo the prototype's MODEL_COLORS palette (Candidate Page.html)
// but are picked by a stable hash of the model id so any new model id gets
// a sensible color without hard-coding every version string.
const PALETTE = [
  "oklch(0.52 0.18 264)", // blue
  "oklch(0.55 0.15 30)", // warm red
  "oklch(0.52 0.16 145)", // green
  "oklch(0.52 0.18 300)", // purple
  "oklch(0.52 0.15 60)", // amber
  "oklch(0.52 0.16 190)", // teal
  "oklch(0.50 0.17 340)", // magenta
  "oklch(0.55 0.13 95)", // olive
];

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function modelColor(id: string): string {
  return PALETTE[hashString(id) % PALETTE.length];
}
