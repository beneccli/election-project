// See docs/specs/website/nextjs-architecture.md §1
//
// FR is canonical. EN entries are cosmetic placeholders in v1 (M_I18n
// owns real translation). The i18n layer applies ONLY to UI chrome —
// never to aggregated content.

export type Lang = "fr" | "en";
export type I18nString = { fr: string; en: string };

export function t(s: I18nString, lang: Lang): string {
  return s[lang] ?? s.fr;
}

/** UI chrome strings. Alphabetized by key to keep diffs clean. */
export const UI_STRINGS = {
  DOMAINES_SECTION: {
    fr: "Domaines",
    en: "[EN] Domaines",
  },
  INTERGEN_SECTION: {
    fr: "Impact intergénérationnel",
    en: "[EN] Impact intergénérationnel",
  },
  NAV_TRANSPARENCE: {
    fr: "Transparence",
    en: "[EN] Transparence",
  },
  POSITIONNEMENT_SECTION: {
    fr: "Positionnement",
    en: "[EN] Positionnement",
  },
  RISQUES_SECTION: {
    fr: "Risques",
    en: "[EN] Risques",
  },
  SYNTHESE_SECTION: {
    fr: "Synthèse",
    en: "[EN] Synthèse",
  },
  TOGGLE_LANG_EN: {
    fr: "Anglais",
    en: "English",
  },
  TOGGLE_LANG_FR: {
    fr: "Français",
    en: "[EN] Français",
  },
  TOGGLE_THEME_DARK: {
    fr: "Mode sombre",
    en: "[EN] Mode sombre",
  },
  TOGGLE_THEME_LIGHT: {
    fr: "Mode clair",
    en: "[EN] Mode clair",
  },
  TRANSPARENCY_HUMAN_REVIEW_COMPLETE: {
    fr: "Revue humaine terminée",
    en: "[EN] Revue humaine terminée",
  },
  TRANSPARENCY_HUMAN_REVIEW_PENDING: {
    fr: "Revue humaine en attente",
    en: "[EN] Revue humaine en attente",
  },
  WORDMARK: {
    fr: "Élection 2027",
    en: "Election 2027",
  },
} as const satisfies Record<string, I18nString>;

export type UiStringKey = keyof typeof UI_STRINGS;
