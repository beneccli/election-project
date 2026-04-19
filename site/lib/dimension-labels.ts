// i18n labels for canonical DIMENSION_KEYS. Used by UI chrome wherever a
// dimension id leaks into user-facing copy (e.g. Counterfactual lists).
//
// See docs/specs/analysis/dimensions.md for the canonical key → theme mapping.
import type { DimensionKey } from "./derived/keys";
import type { Lang, I18nString } from "./i18n";
import { t } from "./i18n";

export const DIMENSION_LABELS: Record<DimensionKey, I18nString> = {
  economic_fiscal: { fr: "Économie & finances", en: "Economy & finance" },
  social_demographic: {
    fr: "Social & démographie",
    en: "Social & demography",
  },
  security_sovereignty: {
    fr: "Sécurité & souveraineté",
    en: "Security & sovereignty",
  },
  institutional_democratic: {
    fr: "Institutions & démocratie",
    en: "Institutions & democracy",
  },
  environmental_long_term: {
    fr: "Environnement & long terme",
    en: "Environment & long term",
  },
};

export function dimensionLabel(key: string, lang: Lang): string {
  const entry = (DIMENSION_LABELS as Record<string, I18nString>)[key];
  return entry ? t(entry, lang) : key;
}
