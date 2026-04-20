// See docs/specs/website/nextjs-architecture.md §3.3
import type { AggregatedOutput } from "../schema";
import { AXIS_KEYS, type AxisKey } from "./keys";

export interface RadarAxisShape {
  key: AxisKey;
  interval: [number, number];
  modal: number | null;
  /**
   * Shape-only input for the pentagon polygon. NEVER displayed to the
   * reader as a numeric score. Falls back to interval midpoint when the
   * aggregator could not resolve a modal value.
   */
  radarValue: number;
  hasDissent: boolean;
  /** Number of models whose score differs from the modal — surfaced in
   * the per-axis hover tooltip. See docs/specs/website/visual-components.md §4.1. */
  dissentCount: number;
}

export interface RadarShape {
  axes: RadarAxisShape[];
}

/** Derive the 5-axis pentagon shape + dissent flags. */
export function deriveRadarShape(
  positioning: AggregatedOutput["positioning"],
): RadarShape {
  return {
    axes: AXIS_KEYS.map((key) => {
      const axis = positioning[key];
      const [lo, hi] = axis.consensus_interval;
      const radarValue =
        axis.modal_score ?? (lo + hi) / 2;
      return {
        key,
        interval: [lo, hi],
        modal: axis.modal_score,
        radarValue,
        hasDissent: axis.dissent.length > 0,
        dissentCount: axis.dissent.length,
      };
    }),
  };
}
