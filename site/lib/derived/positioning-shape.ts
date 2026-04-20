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

/**
 * Per-model pentagon shape. Emitted from `positioning[axis].per_model`
 * added in schema v1.1 (see docs/specs/website/candidate-page-polish.md §5.1).
 * Values are the raw per-model ordinal scores — never averaged, never
 * surfaced as numeric scores outside the radar shape.
 */
export interface RadarModelShape {
  id: string;
  /** Map axis key → per-model integer score in [-5, +5] used as shape input. */
  values: Record<AxisKey, number>;
}

export interface RadarShape {
  axes: RadarAxisShape[];
  models: RadarModelShape[];
}

/** Derive the 5-axis pentagon shape + dissent flags + per-model overlay shapes. */
export function deriveRadarShape(
  positioning: AggregatedOutput["positioning"],
): RadarShape {
  const axes = AXIS_KEYS.map((key) => {
    const axis = positioning[key];
    const [lo, hi] = axis.consensus_interval;
    const radarValue = axis.modal_score ?? (lo + hi) / 2;
    return {
      key,
      interval: [lo, hi] as [number, number],
      modal: axis.modal_score,
      radarValue,
      hasDissent: axis.dissent.length > 0,
      dissentCount: axis.dissent.length,
    };
  });

  // Union of model ids across all axes; each axis only lists models that
  // addressed it. We use every axis's per_model to build a stable set.
  const modelIds = new Set<string>();
  for (const key of AXIS_KEYS) {
    for (const pm of positioning[key].per_model) modelIds.add(pm.model);
  }

  const models: RadarModelShape[] = [...modelIds].sort().map((id) => {
    const values = {} as Record<AxisKey, number>;
    for (const key of AXIS_KEYS) {
      const entry = positioning[key].per_model.find((pm) => pm.model === id);
      // When a model did not address an axis, fall back to the axis's
      // radar value so the polygon stays closed — the UI marks the
      // model as partial-coverage at the legend level.
      values[key] =
        entry?.score ??
        (positioning[key].modal_score ??
          (positioning[key].consensus_interval[0] +
            positioning[key].consensus_interval[1]) /
            2);
    }
    return { id, values };
  });

  return { axes, models };
}

