// See docs/specs/analysis/political-spectrum-label.md §8.1
import type { AggregatedOutput, SpectrumLabel } from "../schema";
import { t, UI_STRINGS, type Lang, type I18nString } from "../i18n";

export type SpectrumStatus = "present" | "split" | "inclassable" | "absent";

export interface DerivedSpectrumLabel {
  /** The modal label when present; null when split, inclassable, or absent. */
  label: SpectrumLabel | null;
  /** Localized text to render; null when nothing should be shown (absent). */
  displayText: string | null;
  /** Per-model breakdown for tooltip / aria-label. */
  tooltipLines: string[];
  status: SpectrumStatus;
}

const LABEL_I18N: Record<Exclude<SpectrumLabel, "inclassable">, I18nString> = {
  extreme_gauche: UI_STRINGS.SPECTRUM_LABEL_EXTREME_GAUCHE,
  gauche: UI_STRINGS.SPECTRUM_LABEL_GAUCHE,
  centre_gauche: UI_STRINGS.SPECTRUM_LABEL_CENTRE_GAUCHE,
  centre: UI_STRINGS.SPECTRUM_LABEL_CENTRE,
  centre_droit: UI_STRINGS.SPECTRUM_LABEL_CENTRE_DROIT,
  droite: UI_STRINGS.SPECTRUM_LABEL_DROITE,
  extreme_droite: UI_STRINGS.SPECTRUM_LABEL_EXTREME_DROITE,
};

/** Localize an enum value for display. */
export function spectrumLabelText(label: SpectrumLabel, lang: Lang): string {
  if (label === "inclassable") return t(UI_STRINGS.SPECTRUM_INCLASSABLE, lang);
  return t(LABEL_I18N[label], lang);
}

/**
 * Derive the Hero spectrum chip descriptor from an aggregated output.
 *
 * - `absent` → pre-v1.2 aggregated, no spectrum block. Render nothing.
 * - `split` → `modal_label === null`. Render "Positionnement partagé".
 * - `inclassable` → `modal_label === "inclassable"`. Render "Hors spectre".
 * - `present` → regular enum value. Render the localized label.
 *
 * The helper never picks a fallback label from the distribution or from
 * the per-axis scores. Silence is the correct output when no modal label
 * is available.
 */
export function deriveSpectrumLabel(
  aggregated: AggregatedOutput,
  lang: Lang,
): DerivedSpectrumLabel {
  const block = aggregated.positioning.overall_spectrum;
  if (!block) {
    return {
      label: null,
      displayText: null,
      tooltipLines: [],
      status: "absent",
    };
  }

  const tooltipLines = block.per_model.map(
    (m) => `${m.model}: ${spectrumLabelText(m.label, lang)}`,
  );

  if (block.modal_label === null) {
    return {
      label: null,
      displayText: t(UI_STRINGS.SPECTRUM_SPLIT, lang),
      tooltipLines,
      status: "split",
    };
  }

  if (block.modal_label === "inclassable") {
    return {
      label: "inclassable",
      displayText: t(UI_STRINGS.SPECTRUM_INCLASSABLE, lang),
      tooltipLines,
      status: "inclassable",
    };
  }

  return {
    label: block.modal_label,
    displayText: spectrumLabelText(block.modal_label, lang),
    tooltipLines,
    status: "present",
  };
}
