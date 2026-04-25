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
  LANDING_COMPARE_BODY: {
    fr: "Sélectionnez 2 à 4 candidats analysés pour les confronter dimension par dimension — positionnement, finances publiques, impact intergénérationnel.",
    en: "Select 2 to 4 analysed candidates to compare them dimension by dimension — positioning, public finances, intergenerational impact.",
  },
  LANDING_COMPARE_CTA: {
    fr: "Comparer plusieurs candidats",
    en: "Compare several candidates",
  },
  LANDING_COMPARE_TITLE: {
    fr: "Comparer les programmes",
    en: "Compare the programmes",
  },
  LANDING_FOOTER_NOTE: {
    fr: "Aucune recommandation de vote. Les désaccords entre modèles sont préservés. Les sources, prompts et sorties brutes sont publics.",
    en: "No voting recommendation. Disagreement between models is preserved. Sources, prompts and raw outputs are public.",
  },
  LANDING_LINK_LEGAL: {
    fr: "Mentions légales",
    en: "Legal notice",
  },
  LANDING_LINK_METHOD: {
    fr: "Méthode",
    en: "Method",
  },
  LANDING_LINK_REPO: {
    fr: "Dépôt",
    en: "Repository",
  },
  LANDING_METHOD_BODY_1: {
    fr: "Chaque programme est consolidé à partir de sources primaires, puis analysé indépendamment par 4 à 5 grands modèles d\u2019IA selon des dimensions identiques.",
    en: "Each programme is consolidated from primary sources, then analysed independently by 4\u20135 frontier AI models along identical dimensions.",
  },
  LANDING_METHOD_BODY_2: {
    fr: "Lorsque les modèles sont en désaccord, nous l\u2019affichons. Nous ne moyennons pas le positionnement. Nous ne classons pas les candidats.",
    en: "When models disagree, we show it. We do not average positioning. We do not rank candidates.",
  },
  LANDING_METHOD_LEARN_MORE: {
    fr: "En savoir plus →",
    en: "Learn more →",
  },
  LANDING_METHOD_PILL_DISSENT: {
    fr: "Désaccords préservés",
    en: "Dissent preserved",
  },
  LANDING_METHOD_PILL_DIVERSITY: {
    fr: "4 à 5 modèles frontière",
    en: "4\u20135 frontier models",
  },
  LANDING_METHOD_PILL_OPEN: {
    fr: "Sources, prompts, sorties publics",
    en: "Sources, prompts, outputs public",
  },
  LANDING_METHOD_PILL_SOURCES: {
    fr: "Sources primaires",
    en: "Primary sources",
  },
  LANDING_METHOD_PILL_SYMMETRY: {
    fr: "Dimensions identiques",
    en: "Identical dimensions",
  },
  LANDING_METHOD_TITLE: {
    fr: "Méthode",
    en: "Method",
  },
  LANDING_NAV_TAGLINE: {
    fr: "Analyse multi-IA des programmes",
    en: "Multi-AI analysis of programmes",
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
  SPECTRUM_INCLASSABLE: {
    fr: "Hors spectre",
    en: "Unplaceable",
  },
  SPECTRUM_LABEL_CENTRE: {
    fr: "Centre",
    en: "Centre",
  },
  SPECTRUM_LABEL_CENTRE_DROIT: {
    fr: "Centre-droit",
    en: "Centre-right",
  },
  SPECTRUM_LABEL_CENTRE_GAUCHE: {
    fr: "Centre-gauche",
    en: "Centre-left",
  },
  SPECTRUM_LABEL_DROITE: {
    fr: "Droite",
    en: "Right",
  },
  SPECTRUM_LABEL_EXTREME_DROITE: {
    fr: "Extrême-droite",
    en: "Far-right",
  },
  SPECTRUM_LABEL_EXTREME_GAUCHE: {
    fr: "Extrême-gauche",
    en: "Far-left",
  },
  SPECTRUM_LABEL_GAUCHE: {
    fr: "Gauche",
    en: "Left",
  },
  SPECTRUM_SPLIT: {
    fr: "Positionnement partagé",
    en: "Split positioning",
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
  TRANSLATION_FALLBACK_BODY: {
    fr: "Une traduction française de cette analyse n’est pas encore publiée. Le contenu ci-dessous est affiché dans la langue source — la version canonique.",
    en: "An English translation of this analysis is not yet published. The content below is shown in French — the canonical source.",
  },
  TRANSLATION_FALLBACK_DISMISS: {
    fr: "Masquer ce message",
    en: "Dismiss this message",
  },
  TRANSLATION_FALLBACK_TITLE: {
    fr: "Traduction en attente",
    en: "Translation pending",
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
