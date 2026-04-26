// See docs/specs/website/nextjs-architecture.md §1 and i18n.md §5.
//
// FR is canonical (source of editorial truth). EN strings are real
// translations. The i18n layer applies ONLY to UI chrome — never to
// aggregated content (that is handled by translator passes producing
// `aggregated.<lang>.json`).

export type Lang = "fr" | "en";
export type I18nString = { fr: string; en: string };

export function t(s: I18nString, lang: Lang): string {
  return s[lang] ?? s.fr;
}

/** UI chrome strings. Alphabetized by key to keep diffs clean. */
export const UI_STRINGS = {
  A11Y_AXIS_AGREEMENT_DISSENT: {
    fr: "{model} en désaccord à la position {pos}",
    en: "{model} disagrees at position {pos}",
  },
  A11Y_COMPARISON_RADAR: {
    fr: "Positionnement comparé — {names}",
    en: "Compared positioning — {names}",
  },
  A11Y_COMPARISON_SELECT_DESELECT: {
    fr: "Désélectionner {name}",
    en: "Deselect {name}",
  },
  A11Y_COMPARISON_SELECT_SELECT: {
    fr: "Sélectionner {name}",
    en: "Select {name}",
  },
  A11Y_DETAILS: {
    fr: "Détails",
    en: "Details",
  },
  A11Y_DETAILS_TOGGLE_HIDE: {
    fr: "Réduire les détails",
    en: "Hide details",
  },
  A11Y_DETAILS_TOGGLE_SHOW: {
    fr: "Afficher les détails",
    en: "Show details",
  },
  A11Y_DISSENT_COUNT: {
    fr: "Dissensus : {n} modèle(s)",
    en: "Dissent: {n} model(s)",
  },
  A11Y_DRAWER_CLOSE: {
    fr: "Fermer",
    en: "Close",
  },
  A11Y_INTERGEN_MODAL_SCORE: {
    fr: "Score modal {label}",
    en: "Modal score {label}",
  },
  A11Y_INTERGEN_TABLE: {
    fr: "Matrice d’impact intergénérationnel par domaine et horizon",
    en: "Intergenerational impact matrix by dimension and horizon",
  },
  A11Y_LANDING_AXIS_ECO: {
    fr: "Axe économique",
    en: "Economic axis",
  },
  A11Y_LANDING_FAMILY_FILTER: {
    fr: "Filtrer par famille",
    en: "Filter by family",
  },
  A11Y_LANDING_FOOTER_LINKS: {
    fr: "Liens bas de page",
    en: "Footer links",
  },
  A11Y_POSITIONING_AXIS_DISSENT: {
    fr: "{model} en désaccord à la position {pos}",
    en: "{model} disagrees at position {pos}",
  },
  A11Y_POSITIONING_MODAL_SCORE: {
    fr: "Score modal {score}",
    en: "Modal score {score}",
  },
  A11Y_RADAR_AXIS: {
    fr: "{label}: intervalle {lo} à {hi}{tail}",
    en: "{label}: interval {lo} to {hi}{tail}",
  },
  A11Y_RISK_MATRIX: {
    fr: "Matrice des risques par domaine et catégorie",
    en: "Risk matrix by dimension and category",
  },
  A11Y_TRANSPARENCY_RESULTS_TABS: {
    fr: "Vues de résultats",
    en: "Result views",
  },
  A11Y_TRANSPARENCY_TABS: {
    fr: "Sections de transparence",
    en: "Transparency sections",
  },
  AXIS_AGREEMENT_DISSENT: {
    fr: "⚡ Désaccord ±{spread}",
    en: "⚡ Disagreement ±{spread}",
  },
  AXIS_AGREEMENT_INTERVAL: {
    fr: "Intervalle ±{spread}",
    en: "Interval ±{spread}",
  },
  AXIS_AGREEMENT_MODAL_TOOLTIP: {
    fr: "Modal : {score}",
    en: "Modal: {score}",
  },
  CANDIDATE_PAGE_COMPARE_LINK: {
    fr: "Comparer à un autre candidat",
    en: "Compare to another candidate",
  },
  CANDIDATE_PENDING_ARIA: {
    fr: "{name} — analyse à venir",
    en: "{name} — analysis pending",
  },
  COMPARER_PAGE_H1: {
    fr: "Confronter les programmes",
    en: "Confront the programmes",
  },
  COMPARER_PAGE_KICKER: {
    fr: "Comparaison",
    en: "Comparison",
  },
  COMPARER_PAGE_LEAD: {
    fr: "Sélectionnez jusqu’à 4 candidats pour les comparer sur les mêmes dimensions.",
    en: "Select up to 4 candidates to compare them on the same dimensions.",
  },
  COMPARISON_AXIS_SPREAD_TOOLTIP: {
    fr: "Écart inter-candidats sur cet axe (ordinal, en unités)",
    en: "Spread between candidates on this axis (ordinal, in units)",
  },
  COMPARISON_DOMAINES_BEST_GRADE: {
    fr: "Meilleure note de la sélection",
    en: "Best grade in selection",
  },
  COMPARISON_DOMAINES_DIMENSION_LABEL: {
    fr: "Dimension",
    en: "Dimension",
  },
  COMPARISON_DOMAINES_SPREAD: {
    fr: "Écart",
    en: "Spread",
  },
  COMPARISON_DOMAINES_TITLE: {
    fr: "Domaines",
    en: "Domains",
  },
  COMPARISON_FOOTER_BODY: {
    fr: "Cette page affiche les analyses agrégées de chaque candidat sélectionné. Les sources, prompts et sorties brutes sont publics. Aucun classement n’est calculé.",
    en: "This page shows the aggregated analyses for each selected candidate. Sources, prompts and raw outputs are public. No ranking is computed.",
  },
  COMPARISON_FOOTER_BODY_LONG: {
    fr: "Cette page affiche les analyses agrégées déjà publiées sur chaque fiche candidat — aucune analyse supplémentaire n’est produite ici. Ouvrez une fiche candidat pour consulter le run complet (modèles, prompts, sources, sorties brutes).",
    en: "This page renders the aggregated analyses already published on each candidate page — no new analysis is produced here. Open a candidate page for the full run (models, prompts, sources, raw outputs).",
  },
  COMPARISON_INTERGEN_DOMAIN_LABEL: {
    fr: "Domaine",
    en: "Topic",
  },
  COMPARISON_INTERGEN_INTRO: {
    fr: "Impact net estimé sur les générations futures (−3 très négatif, +3 très positif) à l’horizon 2047.",
    en: "Estimated net impact on future generations (−3 very negative, +3 very positive) at the 2047 horizon.",
  },
  COMPARISON_INTERGEN_LINK: {
    fr: "Voir la matrice complète sur la fiche candidat",
    en: "See the full matrix on the candidate page",
  },
  COMPARISON_INTERGEN_TITLE: {
    fr: "Intergénérationnel",
    en: "Intergenerational",
  },
  COMPARISON_NO_CANDIDATES_SELECTED: {
    fr: "Aucun candidat sélectionné.",
    en: "No candidate selected.",
  },
  COMPARISON_PICK_AT_LEAST_TWO: {
    fr: "Sélectionnez au moins 2 candidats pour afficher la comparaison.",
    en: "Select at least 2 candidates to show the comparison.",
  },
  COMPARISON_POSITIONNEMENT_INTRO: {
    fr: "Les polygones superposés et les dots par axe restituent les écarts sans valeur calculée.",
    en: "Overlaid polygons and per-axis dots show differences without computing a value.",
  },
  COMPARISON_RISKS_DOMAIN_LABEL: {
    fr: "Domaine",
    en: "Dimension",
  },
  COMPARISON_RISKS_LEVEL_TEMPLATE: {
    fr: "Niveau de risque : {label}",
    en: "Risk level: {label}",
  },
  COMPARISON_RISKS_LEVEL_UNKNOWN: {
    fr: "Niveau inconnu",
    en: "Unknown level",
  },
  COMPARISON_RISKS_MATRIX_ARIA: {
    fr: "Matrice des risques pour {name}",
    en: "Risk matrix for {name}",
  },
  COMPARISON_RISKS_TITLE: {
    fr: "Risques",
    en: "Risks",
  },
  COMPARISON_SELECTED_COUNT: {
    fr: "Candidats sélectionnés ({n}/{max})",
    en: "Selected candidates ({n}/{max})",
  },
  COMPARISON_SELECTED_HEADER: {
    fr: "Candidats sélectionnés",
    en: "Selected candidates",
  },
  COMPARISON_TRANSPARENCY_TITLE: {
    fr: "Transparence",
    en: "Transparency",
  },
  DIMENSION_LABEL_ECONOMIC_FISCAL: {
    fr: "Économique & fiscal",
    en: "Economic & fiscal",
  },
  DIMENSION_LABEL_EDUCATION: {
    fr: "Éducation",
    en: "Education",
  },
  DIMENSION_LABEL_ENVIRONMENTAL_LONG_TERM: {
    fr: "Environnemental & long terme",
    en: "Environmental & long-term",
  },
  DIMENSION_LABEL_HEALTH: {
    fr: "Santé",
    en: "Health",
  },
  DIMENSION_LABEL_INSTITUTIONAL_DEMOCRATIC: {
    fr: "Institutionnel & démocratique",
    en: "Institutional & democratic",
  },
  DIMENSION_LABEL_SECURITY_SOVEREIGNTY: {
    fr: "Sécurité & souveraineté",
    en: "Security & sovereignty",
  },
  DIMENSION_LABEL_SOCIAL_DEMOGRAPHIC: {
    fr: "Social & démographique",
    en: "Social & demographic",
  },
  DOCUMENT_LOAD_FAILED_INLINE: {
    fr: "Échec du chargement du document consolidé ({message}).",
    en: "Failed to load the consolidated document ({message}).",
  },
  DOCUMENT_TAB_TITLE: {
    fr: "Document consolidé",
    en: "Consolidated document",
  },
  DOMAINES_CONFIDENCE: {
    fr: "confiance",
    en: "confidence",
  },
  DOMAINES_CONSENSUS_BADGE: {
    fr: "consensus",
    en: "consensus",
  },
  DOMAINES_CONSENSUS_PREFIX: {
    fr: "Consensus →",
    en: "Consensus →",
  },
  DOMAINES_DISSENTERS_PREFIX: {
    fr: "désaccord :",
    en: "dissent:",
  },
  DOMAINES_DISSENT_BADGE: {
    fr: "⚡ DISSENT",
    en: "⚡ DISSENT",
  },
  DOMAINES_EXECUTION_RISKS: {
    fr: "Risques d’exécution",
    en: "Execution risks",
  },
  DOMAINES_KEY_MEASURES: {
    fr: "Mesures clés",
    en: "Key measures",
  },
  DOMAINES_NOT_QUANTIFIED_INLINE: {
    fr: "— non quantifié",
    en: "— not quantified",
  },
  DOMAINES_PER_MODEL_GRADES: {
    fr: "Notes par modèle",
    en: "Per-model grades",
  },
  DOMAINES_PROBLEMS_ADDRESSED: {
    fr: "Problèmes adressés",
    en: "Problems addressed",
  },
  DOMAINES_PROBLEMS_ADDRESSED_EMPTY: {
    fr: "Aucun problème identifié comme adressé.",
    en: "No problem identified as addressed.",
  },
  DOMAINES_PROBLEMS_IGNORED: {
    fr: "Problèmes non adressés",
    en: "Problems not addressed",
  },
  DOMAINES_PROBLEMS_IGNORED_EMPTY: {
    fr: "Aucun problème identifié comme ignoré par les modèles.",
    en: "No problem identified as ignored by the models.",
  },
  DOMAINES_PROBLEMS_OVERFLOW: {
    fr: "+ {n} autre{s}",
    en: "+ {n} other{s}",
  },
  DOMAINES_PROBLEMS_WORSENED: {
    fr: "Problèmes aggravés",
    en: "Problems worsened",
  },
  DOMAINES_PROBLEMS_WORSENED_EMPTY: {
    fr: "Aucun aggravement identifié par les modèles.",
    en: "No worsening identified by the models.",
  },
  DOMAINES_PROB_LONG: {
    fr: "Probabilité",
    en: "Probability",
  },
  DOMAINES_PROB_SHORT: {
    fr: "Prob.",
    en: "Prob.",
  },
  DOMAINES_SECTION: {
    fr: "Domaines",
    en: "Dimensions",
  },
  DOMAINES_SECTION_HEAD: {
    fr: "Analyse par domaine",
    en: "Analysis by domain",
  },
  DOMAINES_SEV_LONG: {
    fr: "Sévérité",
    en: "Severity",
  },
  DOMAINES_SEV_SHORT: {
    fr: "Sév.",
    en: "Sev.",
  },
  DOMAINES_SUPPORTED_BY: {
    fr: "Soutenu par",
    en: "Supported by",
  },
  DOWNLOAD: {
    fr: "Télécharger",
    en: "Download",
  },
  GRADE_NOT_ADDRESSED: {
    fr: "Non abordé",
    en: "Not addressed",
  },
  HERO_BODY: {
    fr: "Chaque programme analysé par 4 à 5 grands modèles d’IA sur des dimensions identiques. Les désaccords entre modèles sont préservés. Les sources, prompts et sorties brutes sont publics. L’objectif : l’analyse, pas l’advocacy.",
    en: "Each programme analysed by 4–5 frontier AI models along identical dimensions. Disagreement between models is preserved. Sources, prompts and raw outputs are public. The goal: analysis, not advocacy.",
  },
  HERO_KICKER: {
    fr: "Présidentielle française",
    en: "French presidential election",
  },
  HERO_TITLE_EM: {
    fr: "vraiment",
    en: "actually",
  },
  HERO_TITLE_LEAD: {
    fr: "Que proposent",
    en: "What are the candidates",
  },
  HERO_TITLE_TAIL: {
    fr: "les candidats à l’Élysée\u00a0?",
    en: "for the Élysée proposing?",
  },
  INTERGEN_AT_25_TITLE: {
    fr: "À 25 ans (né·e en 2002)",
    en: "At age 25 (born in 2002)",
  },
  INTERGEN_AT_65_TITLE: {
    fr: "À 65 ans (né·e en 1962)",
    en: "At age 65 (born in 1962)",
  },
  INTERGEN_CATEGORY_CLIMATE: {
    fr: "Climat",
    en: "Climate",
  },
  INTERGEN_CATEGORY_EDUCATION: {
    fr: "Éducation",
    en: "Education",
  },
  INTERGEN_CATEGORY_HEALTHCARE: {
    fr: "Santé",
    en: "Health",
  },
  INTERGEN_CATEGORY_HOUSING: {
    fr: "Logement",
    en: "Housing",
  },
  INTERGEN_CATEGORY_LABOR_MARKET: {
    fr: "Marché du travail",
    en: "Labour market",
  },
  INTERGEN_CATEGORY_PENSIONS: {
    fr: "Retraites",
    en: "Pensions",
  },
  INTERGEN_CATEGORY_PUBLIC_DEBT: {
    fr: "Dette publique",
    en: "Public debt",
  },
  INTERGEN_CATEGORY_TAXES: {
    fr: "Fiscalité",
    en: "Taxation",
  },
  INTERGEN_CATEGORY_WAGES: {
    fr: "Salaires",
    en: "Wages",
  },
  INTERGEN_DIRECTION_MIXED: {
    fr: "Effets contrastés",
    en: "Contrasting effects",
  },
  INTERGEN_DIRECTION_NEUTRAL: {
    fr: "Neutre",
    en: "Neutral",
  },
  INTERGEN_DIRECTION_OLD_TO_YOUNG: {
    fr: "Des aînés vers les jeunes",
    en: "From older to younger",
  },
  INTERGEN_DIRECTION_YOUNG_TO_OLD: {
    fr: "Des jeunes vers les aînés",
    en: "From younger to older",
  },
  INTERGEN_DRAWER_DESCRIPTION: {
    fr: "Projection du programme sur deux cohortes individuelles typiques : personne de 25 ans et personne de 65 ans.",
    en: "Projection of the programme onto two typical individual cohorts: a 25-year-old and a 65-year-old.",
  },
  INTERGEN_DRAWER_OPEN: {
    fr: "Voir la comparaison individuelle",
    en: "View individual comparison",
  },
  INTERGEN_DRAWER_TITLE: {
    fr: "Comparaison individuelle",
    en: "Individual comparison",
  },
  INTERGEN_HORIZON_COHORT_2027_2030: {
    fr: "Actifs 35–55 ans",
    en: "Workers aged 35–55",
  },
  INTERGEN_HORIZON_COHORT_2028_2037: {
    fr: "Jeunes actifs & retraités",
    en: "Young workers & retirees",
  },
  INTERGEN_HORIZON_COHORT_2031_2037: {
    fr: "Jeunes actifs & retraités",
    en: "Young workers & retirees",
  },
  INTERGEN_HORIZON_COHORT_2038_2047: {
    fr: "Génération Z & Alpha",
    en: "Generation Z & Alpha",
  },
  INTERGEN_HORIZON_DOMAIN_LABEL: {
    fr: "Domaine",
    en: "Dimension",
  },
  INTERGEN_HORIZON_NOTE_LABEL: {
    fr: "Note",
    en: "Note",
  },
  INTERGEN_LEGEND_NEGATIVE: {
    fr: "Négatif",
    en: "Negative",
  },
  INTERGEN_LEGEND_NEUTRAL: {
    fr: "Neutre",
    en: "Neutral",
  },
  INTERGEN_LEGEND_POSITIVE: {
    fr: "Positif",
    en: "Positive",
  },
  INTERGEN_LEGEND_VERY_NEGATIVE: {
    fr: "Très négatif",
    en: "Very negative",
  },
  INTERGEN_LEGEND_VERY_POSITIVE: {
    fr: "Très positif",
    en: "Very positive",
  },
  INTERGEN_NET_TRANSFER_LABEL: {
    fr: "Transfert net",
    en: "Net transfer",
  },
  INTERGEN_NOT_QUANTIFIED: {
    fr: "Non quantifié",
    en: "Not quantified",
  },
  INTERGEN_SECTION: {
    fr: "Impact intergénérationnel",
    en: "Intergenerational impact",
  },
  INTERGEN_SECTION_INTRO: {
    fr: "Effet net estimé du programme sur chaque domaine, à trois horizons budgétaires. Les scores sont ordinaux (de −3 à +3) et mesurent la direction de l’impact, pas son caractère désirable. Les libellés de cohortes sont des repères narratifs approximatifs qui recouvrent imparfaitement les horizons calendaires.",
    en: "Estimated net effect of the programme on each domain, across three budgetary horizons. Scores are ordinal (−3 to +3) and measure the direction of impact, not its desirability. Cohort labels are approximate narrative anchors that imperfectly cover the calendar horizons.",
  },
  INTERGEN_SOURCES_LABEL: {
    fr: "Sources",
    en: "Sources",
  },
  INTERGEN_SPLIT_ENVIRONMENTAL_DEBT: {
    fr: "Dette environnementale",
    en: "Environmental debt",
  },
  INTERGEN_SPLIT_FISCAL: {
    fr: "Fiscal",
    en: "Fiscal",
  },
  INTERGEN_SPLIT_PENSION: {
    fr: "Retraite",
    en: "Retirement",
  },
  INTERGEN_SPLIT_PENSION_OUTLOOK: {
    fr: "Perspective retraite",
    en: "Retirement outlook",
  },
  INTERGEN_SUMMARY_LABEL: {
    fr: "Résumé",
    en: "Summary",
  },
  LANDING_AXIS_LEFT: {
    fr: "Gauche",
    en: "Left",
  },
  LANDING_AXIS_RIGHT: {
    fr: "Droite",
    en: "Right",
  },
  LANDING_CARD_ANALYSIS_AVAILABLE: {
    fr: "{name} — analyse disponible",
    en: "{name} — analysis available",
  },
  LANDING_CARD_VIEW_ANALYSIS: {
    fr: "Voir l’analyse →",
    en: "View analysis →",
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
  LANDING_FAMILY_ALL: {
    fr: "Tous",
    en: "All",
  },
  LANDING_FAMILY_FILTER_LABEL: {
    fr: "Famille politique",
    en: "Political family",
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
  LANDING_PENDING_ANALYSIS: {
    fr: "Analyse à venir",
    en: "Analysis pending",
  },
  LANDING_TRANSLATION_PENDING_NOTE: {
    fr: "Traduction à venir — contenu en français",
    en: "Translation pending — content in French",
  },
  LEGEND_DISSENT_INLINE: {
    fr: "dissensus entre modèles",
    en: "model dissent",
  },
  LEGEND_LABEL: {
    fr: "Légende",
    en: "Legend",
  },
  LOADING_AGGREGATION_NOTES: {
    fr: "Chargement des notes d’agrégation…",
    en: "Loading aggregation notes…",
  },
  LOADING_CONSOLIDATED_DOC: {
    fr: "Chargement du document consolidé…",
    en: "Loading consolidated document…",
  },
  LOADING_FAILED: {
    fr: "Échec du chargement",
    en: "Loading failed",
  },
  LOADING_FAILED_CONSOLIDATED_DOC: {
    fr: "Échec du chargement du document consolidé",
    en: "Failed to load consolidated document",
  },
  META_CANDIDATE_NOT_FOUND_TITLE: {
    fr: "Candidat introuvable · Élection 2027",
    en: "Candidate not found · Election 2027",
  },
  META_CANDIDATE_TITLE_SUFFIX: {
    fr: "— Analyse · Élection 2027",
    en: "— Analysis · Election 2027",
  },
  META_COMPARER_DESCRIPTION: {
    fr: "Comparer côte à côte 2 à 4 programmes de l’élection présidentielle 2027.",
    en: "Compare 2 to 4 programmes from the 2027 French presidential election side by side.",
  },
  META_COMPARER_TITLE: {
    fr: "Comparer les programmes · Élection 2027",
    en: "Compare programmes · Election 2027",
  },
  META_LANDING_DESCRIPTION: {
    fr: "Que proposent vraiment les candidats à l’Élysée ? Analyse multi-IA transparente des programmes présidentiels 2027.",
    en: "What do the candidates for the Élysée actually propose? Transparent multi-AI analysis of the 2027 presidential programmes.",
  },
  META_LANDING_TITLE: {
    fr: "Élection 2027 · Analyse multi-IA des programmes",
    en: "Election 2027 · Multi-AI analysis of programmes",
  },
  META_METHODOLOGIE_DESCRIPTION: {
    fr: "Comment ce site produit ses analyses : pipeline, garde-fous éditoriaux, limites, gouvernance.",
    en: "How this site produces its analyses: pipeline, editorial guardrails, limitations, governance.",
  },
  META_METHODOLOGIE_TITLE: {
    fr: "Méthodologie · Élection 2027",
    en: "Methodology · Election 2027",
  },
  META_ROOT_DESCRIPTION: {
    fr: "Analyse transparente multi-IA des programmes des candidats à la présidentielle 2027.",
    en: "Transparent multi-AI analysis of the 2027 French presidential candidate programmes.",
  },
  META_ROOT_TITLE: {
    fr: "Élection 2027 — Analyse IA des programmes présidentiels",
    en: "Election 2027 — AI analysis of presidential programmes",
  },
  METHODOLOGY_AGGREGATION_BODY: {
    fr: "Les sorties des modèles sont fusionnées par un méta-modèle désigné, qui produit un agrégat structuré. Chaque énoncé porte un agreement_map indiquant les modèles qui le soutiennent et ceux qui le contestent. Aucune note de positionnement n’est moyennée arithmétiquement. Une revue humaine valide ou rejette chaque agrégation avant publication.",
    en: "Model outputs are merged by a designated meta-model that produces a structured aggregate. Every claim carries an agreement_map listing the models that support it and those that contest it. No positioning score is arithmetic-mean averaged. A human review validates or rejects each aggregation before publication.",
  },
  METHODOLOGY_AGGREGATION_TITLE: {
    fr: "Comment les modèles sont agrégés",
    en: "How models are aggregated",
  },
  METHODOLOGY_DIMENSIONS_INTRO: {
    fr: "Chaque programme est analysé sur le même jeu fixe de dimensions, dans le même ordre, avec le même prompt. Si une dimension n’est pas adressée par un programme, « non adressé » est en soi le constat — la dimension n’est jamais retirée pour ce candidat.",
    en: "Each programme is analysed on the same fixed set of dimensions, in the same order, with the same prompt. If a dimension is not addressed by a programme, “not addressed” is itself the finding — the dimension is never dropped for that candidate.",
  },
  METHODOLOGY_DIMENSIONS_TITLE: {
    fr: "Dimensions analysées",
    en: "Analytical dimensions",
  },
  METHODOLOGY_GOVERNANCE_AFFILIATION: {
    fr: "Affiliation politique : aucune déclarée. Le code, les prompts et les agrégats sont publics et vérifiables.",
    en: "Political affiliation: none declared. The code, prompts and aggregates are public and verifiable.",
  },
  METHODOLOGY_GOVERNANCE_COST: {
    fr: "Coût marginal : les appels d’API LLM sont payés par le mainteneur, et exécutés le plus souvent via les modes manuel ou Copilot pour limiter la dépense.",
    en: "Marginal cost: LLM API calls are paid by the maintainer, and most often executed via the manual or Copilot modes to limit expense.",
  },
  METHODOLOGY_GOVERNANCE_FUNDING: {
    fr: "Financement : aucun. Pas de sponsor, pas de don, pas de subvention, pas de partenariat média.",
    en: "Funding: none. No sponsor, no donations, no grants, no media partnership.",
  },
  METHODOLOGY_GOVERNANCE_MAINTAINER: {
    fr: "Mainteneur : une seule personne. Projet personnel mené sur du temps libre.",
    en: "Maintainer: a single person. Side project run on spare time.",
  },
  METHODOLOGY_GOVERNANCE_SOURCE: {
    fr: "Code source ouvert. Toute personne peut auditer la méthodologie ou la reproduire sur d’autres scrutins.",
    en: "Open source code. Anyone can audit the methodology or reproduce it for other elections.",
  },
  METHODOLOGY_GOVERNANCE_TITLE: {
    fr: "Gouvernance et financement",
    en: "Governance and funding",
  },
  METHODOLOGY_HERO_BODY: {
    fr: "Ce site est une expérience : peut-on, à l’aide de plusieurs modèles d’IA et de garde-fous éditoriaux stricts, produire une analyse de programmes politiques qui reste utile à des lecteurs aux opinions opposées ? Tous les artefacts (sources, prompts, sorties brutes) sont publics. Le lecteur est invité à vérifier, pas à faire confiance.",
    en: "This site is an experiment: can multiple AI models and strict editorial guardrails produce a programme analysis that remains useful to readers with opposite opinions? Every artefact (sources, prompts, raw outputs) is public. The reader is invited to verify, not to trust.",
  },
  METHODOLOGY_HERO_TAGLINE: {
    fr: "Une analyse multi-IA, pilotée par l’objectif d’éviter la prise de parti.",
    en: "A multi-AI analysis driven by the goal of avoiding partisanship.",
  },
  METHODOLOGY_HERO_TITLE: {
    fr: "Pourquoi ce site existe",
    en: "Why this site exists",
  },
  METHODOLOGY_LIMITS_HUMAN: {
    fr: "Limite humaine. Une seule personne relit chaque sources.md et chaque aggregated.json. Le débit du projet est borné par cette relecture, et le risque bus-factor est connu.",
    en: "Human limit. A single person reviews every sources.md and every aggregated.json. Project throughput is bounded by that review, and the bus-factor risk is acknowledged.",
  },
  METHODOLOGY_LIMITS_MODELS: {
    fr: "Limites des modèles. Les modèles d’IA partagent une partie de leurs données d’entraînement, de leurs biais de pré-entraînement et d’un fort tropisme anglophone. Agréger plusieurs modèles réduit la variance individuelle ; cela n’élimine pas l’erreur corrélée.",
    en: "Model limitations. AI models share part of their training data, pretraining biases, and a strong English-corpus skew. Aggregating several models reduces individual variance; it does not eliminate correlated error.",
  },
  METHODOLOGY_LIMITS_SOURCES: {
    fr: "Limites des sources. Le pipeline lit ce que chaque candidat a publié. Un programme éloquent dont les chiffres ne tiennent pas est noté différemment d’un programme épars : ce constat reflète le programme, pas la personne.",
    en: "Source limitations. The pipeline reads what each candidate has published. An eloquent programme whose figures do not add up grades differently from a sparse programme: this finding reflects the programme, not the person.",
  },
  METHODOLOGY_LIMITS_TITLE: {
    fr: "Limites connues",
    en: "Known limitations",
  },
  METHODOLOGY_NOT_THIS_BULLET_AGGREGATOR: {
    fr: "Pas un agrégateur de préférences politiques qui vous indique quel candidat correspond à vos opinions.",
    en: "Not a policy-preference aggregator telling you which candidate matches your opinions.",
  },
  METHODOLOGY_NOT_THIS_BULLET_ENDORSEMENT: {
    fr: "Pas une plate-forme de soutien à un candidat ou à un parti.",
    en: "Not an endorsement platform for a candidate or party.",
  },
  METHODOLOGY_NOT_THIS_BULLET_FACTCHECK: {
    fr: "Pas un service de fact-checking sur les déclarations en débat ou sur les réseaux.",
    en: "Not a fact-checking service for debate statements or social-media posts.",
  },
  METHODOLOGY_NOT_THIS_BULLET_FUNDED: {
    fr: "Pas un service financé par un parti, un média, une fondation ou un sponsor.",
    en: "Not a service funded by a party, a media outlet, a foundation or a sponsor.",
  },
  METHODOLOGY_NOT_THIS_BULLET_NEUTRAL: {
    fr: "Pas une plate-forme « neutre » qui refuse les constats — les constats sont énoncés clairement, sans éditorial superposé.",
    en: "Not a “neutral” platform that refuses to state findings — findings are stated clearly, without overlaid editorial.",
  },
  METHODOLOGY_NOT_THIS_BULLET_VOTING_GUIDE: {
    fr: "Pas un guide de vote.",
    en: "Not a voting guide.",
  },
  METHODOLOGY_NOT_THIS_TITLE: {
    fr: "Ce que ce site n’est pas",
    en: "What this site is not",
  },
  METHODOLOGY_PIPELINE_ARTIFACT_LABEL: {
    fr: "Voir l’artefact",
    en: "View artefact",
  },
  METHODOLOGY_PIPELINE_INTRO: {
    fr: "Six étapes, chacune liée à un artefact public. Suivre la chaîne permet de remonter de toute affirmation jusqu’à la phrase du programme qui la fonde.",
    en: "Six steps, each linked to a public artefact. Following the chain lets you trace any claim back to the programme sentence that grounds it.",
  },
  METHODOLOGY_PIPELINE_SPEC_LABEL: {
    fr: "Voir la spécification",
    en: "View specification",
  },
  METHODOLOGY_PIPELINE_STAGE_AGGREGATE_BODY: {
    fr: "Un méta-modèle agrège les sorties par modèle en un seul aggregated.json structuré, en conservant les désaccords dans un agreement_map. Les notes de positionnement ne sont jamais moyennées.",
    en: "A meta-model aggregates per-model outputs into a single structured aggregated.json, preserving disagreements in an agreement_map. Positioning scores are never averaged.",
  },
  METHODOLOGY_PIPELINE_STAGE_AGGREGATE_TITLE: {
    fr: "3. Agréger",
    en: "3. Aggregate",
  },
  METHODOLOGY_PIPELINE_STAGE_ANALYZE_BODY: {
    fr: "Le même prompt versionné est envoyé à plusieurs modèles d’IA en parallèle. Chaque modèle produit un JSON structuré indépendant, stocké tel quel dans raw-outputs/.",
    en: "The same versioned prompt is sent in parallel to several AI models. Each model produces an independent structured JSON, stored as-is in raw-outputs/.",
  },
  METHODOLOGY_PIPELINE_STAGE_ANALYZE_TITLE: {
    fr: "2. Analyser (× N modèles)",
    en: "2. Analyse (× N models)",
  },
  METHODOLOGY_PIPELINE_STAGE_CONSOLIDATE_BODY: {
    fr: "Les sources brutes (PDF, pages web, transcriptions) sont consolidées en un document unique sources.md, relu et validé par un humain avant toute analyse.",
    en: "Raw sources (PDFs, web pages, transcripts) are consolidated into a single sources.md document, reviewed and validated by a human before any analysis runs.",
  },
  METHODOLOGY_PIPELINE_STAGE_CONSOLIDATE_TITLE: {
    fr: "1. Consolider les sources",
    en: "1. Consolidate sources",
  },
  METHODOLOGY_PIPELINE_STAGE_PUBLISH_BODY: {
    fr: "Une fois la revue humaine terminée, la version est publiée en mettant à jour le lien symbolique current. Le site est rebâti à partir des artefacts validés.",
    en: "Once human review is complete, the version is published by updating the current symlink. The site is rebuilt from the validated artefacts.",
  },
  METHODOLOGY_PIPELINE_STAGE_PUBLISH_TITLE: {
    fr: "6. Publier",
    en: "6. Publish",
  },
  METHODOLOGY_PIPELINE_STAGE_REVIEW_BODY: {
    fr: "Une CLI ouvre chaque énoncé contesté ou signalé. Tant qu’un point reste non tranché par un humain, l’étape de publication est bloquée.",
    en: "A CLI opens every contested or flagged claim. As long as one item remains unresolved by a human, the publish step is blocked.",
  },
  METHODOLOGY_PIPELINE_STAGE_REVIEW_TITLE: {
    fr: "4. Revue humaine",
    en: "4. Human review",
  },
  METHODOLOGY_PIPELINE_STAGE_TRANSLATE_BODY: {
    fr: "Optionnel. Un prompt dédié traduit uniquement les champs de prose listés dans une liste blanche, sans toucher aux structures ni aux nombres. Le résultat est revu avant ingestion.",
    en: "Optional. A dedicated prompt translates only the prose fields listed in an allowlist, leaving structures and numbers untouched. The result is reviewed before ingestion.",
  },
  METHODOLOGY_PIPELINE_STAGE_TRANSLATE_TITLE: {
    fr: "5. Traduire (optionnel)",
    en: "5. Translate (optional)",
  },
  METHODOLOGY_PIPELINE_TITLE: {
    fr: "Comment une analyse est produite",
    en: "How an analysis is produced",
  },
  METHODOLOGY_POSITIONING_BODY: {
    fr: "Chaque modèle place le programme sur cinq axes (économique, sociétal, institutionnel, environnemental, international) à l’aide d’entiers de −5 à +5. Ces notes sont ordinales : elles indiquent un rang relatif à des figures historiques fixes, pas une distance mesurable. Pour cette raison, le site ne calcule jamais une moyenne arithmétique entre modèles ; il affiche la valeur modale, l’intervalle de consensus, et chaque position individuelle.",
    en: "Each model places the programme on five axes (economic, societal, institutional, environmental, international) using integers from −5 to +5. These scores are ordinal: they indicate a rank relative to fixed historical anchor figures, not a measurable distance. For that reason, the site never computes an arithmetic mean between models; it displays the modal value, the consensus interval, and each individual position.",
  },
  METHODOLOGY_POSITIONING_TITLE: {
    fr: "Positionnement politique : ordinal, pas cardinal",
    en: "Political positioning: ordinal, not cardinal",
  },
  METHODOLOGY_PRINCIPLES_TITLE: {
    fr: "Les cinq garde-fous éditoriaux",
    en: "The five editorial guardrails",
  },
  METHODOLOGY_PRINCIPLE_ANALYSIS_EXAMPLE: {
    fr: "Un programme qui creuse le déficit est décrit comme « augmente l’écart budgétaire de X Md€/an » et non « ruine les finances publiques ».",
    en: "A programme that widens the deficit is described as “increases the budget gap by €X bn/year”, not as “wrecks the public finances”.",
  },
  METHODOLOGY_PRINCIPLE_ANALYSIS_STATEMENT: {
    fr: "Le site décrit des arbitrages. Le verdict appartient au lecteur.",
    en: "The site describes tradeoffs. The verdict belongs to the reader.",
  },
  METHODOLOGY_PRINCIPLE_ANALYSIS_TITLE: {
    fr: "Analyse, pas plaidoyer",
    en: "Analysis, not advocacy",
  },
  METHODOLOGY_PRINCIPLE_DISSENT_EXAMPLE: {
    fr: "Si trois modèles placent un programme à +2 sur l’axe économique et deux le placent à +4, l’écart est affiché tel quel — pas réduit à une moyenne de +2,8.",
    en: "If three models place a programme at +2 on the economic axis and two place it at +4, the gap is displayed as-is — not reduced to an average of +2.8.",
  },
  METHODOLOGY_PRINCIPLE_DISSENT_STATEMENT: {
    fr: "Lorsque les modèles divergent, le désaccord est conservé dans la structure, pas effacé par une moyenne.",
    en: "When models diverge, the disagreement is preserved in the structure, not erased by an average.",
  },
  METHODOLOGY_PRINCIPLE_DISSENT_TITLE: {
    fr: "Désaccord préservé",
    en: "Dissent preserved",
  },
  METHODOLOGY_PRINCIPLE_MEASUREMENT_EXAMPLE: {
    fr: "Une dette intergénérationnelle est exprimée en « X €/personne/an transférés de la cohorte A vers la cohorte B », pas en « vol fait aux jeunes ».",
    en: "An intergenerational debt is expressed as “€X/person/year transferred from cohort A to cohort B”, not as “theft from the young”.",
  },
  METHODOLOGY_PRINCIPLE_MEASUREMENT_STATEMENT: {
    fr: "Là où une grandeur existe, elle est nommée. Les adjectifs ne remplacent pas les nombres.",
    en: "Where a quantity exists, it is named. Adjectives do not replace numbers.",
  },
  METHODOLOGY_PRINCIPLE_MEASUREMENT_TITLE: {
    fr: "Mesure, pas réquisitoire",
    en: "Measurement, not indictment",
  },
  METHODOLOGY_PRINCIPLE_SYMMETRY_EXAMPLE: {
    fr: "Si une note critique est appliquée au programme A sur sa trajectoire de dette, la même grille est appliquée à tous les autres programmes — sans exception, sans atténuation.",
    en: "If a critical note is applied to programme A on its debt trajectory, the same grid is applied to every other programme — no exception, no softening.",
  },
  METHODOLOGY_PRINCIPLE_SYMMETRY_STATEMENT: {
    fr: "Chaque candidat est analysé sur les mêmes dimensions, avec le même prompt, dans le même ordre.",
    en: "Each candidate is analysed on the same dimensions, with the same prompt, in the same order.",
  },
  METHODOLOGY_PRINCIPLE_SYMMETRY_TITLE: {
    fr: "Examen symétrique",
    en: "Symmetric scrutiny",
  },
  METHODOLOGY_PRINCIPLE_TRANSPARENCY_EXAMPLE: {
    fr: "Pour toute affirmation visible sur le site, on peut atteindre en deux clics la phrase d’origine du programme et le JSON brut produit par chaque modèle.",
    en: "For any claim visible on the site, the originating programme sentence and the raw JSON produced by each model are reachable in two clicks.",
  },
  METHODOLOGY_PRINCIPLE_TRANSPARENCY_STATEMENT: {
    fr: "Sources, prompts, sorties brutes et code sont publics. Tout artefact ayant servi à produire une affirmation est consultable.",
    en: "Sources, prompts, raw outputs and code are public. Every artefact used to produce a claim is inspectable.",
  },
  METHODOLOGY_PRINCIPLE_TRANSPARENCY_TITLE: {
    fr: "Transparence radicale",
    en: "Radical transparency",
  },
  METHODOLOGY_TOC_TITLE: {
    fr: "Sommaire",
    en: "Contents",
  },
  METHODOLOGY_TRANSPARENCY_INTRO: {
    fr: "Tout est public. Voici les points d’entrée pour vérifier n’importe quelle affirmation portée par le site.",
    en: "Everything is public. Here are the entry points to verify any claim made on the site.",
  },
  METHODOLOGY_TRANSPARENCY_LINK_ARTIFACTS: {
    fr: "Artefacts par version (sources.md, raw-outputs/, aggregated.json, metadata.json)",
    en: "Per-version artefacts (sources.md, raw-outputs/, aggregated.json, metadata.json)",
  },
  METHODOLOGY_TRANSPARENCY_LINK_EDITORIAL: {
    fr: "Spécification des principes éditoriaux",
    en: "Editorial principles specification",
  },
  METHODOLOGY_TRANSPARENCY_LINK_PAGE_SOURCE: {
    fr: "Code source de cette page",
    en: "Source code of this page",
  },
  METHODOLOGY_TRANSPARENCY_LINK_PROMPTS: {
    fr: "Prompts versionnés (analyse, agrégation, traduction) avec leurs hashs SHA256",
    en: "Versioned prompts (analysis, aggregation, translation) with their SHA256 hashes",
  },
  METHODOLOGY_TRANSPARENCY_LINK_REPO: {
    fr: "Dépôt de code sur GitHub",
    en: "Code repository on GitHub",
  },
  METHODOLOGY_TRANSPARENCY_TITLE: {
    fr: "Transparence : où vérifier",
    en: "Transparency: where to verify",
  },
  NAV_HOME: {
    fr: "Accueil",
    en: "Home",
  },
  NAV_OPEN_TRANSPARENCY: {
    fr: "Ouvrir la transparence complète",
    en: "Open full transparency",
  },
  NAV_TRANSPARENCE: {
    fr: "Transparence",
    en: "Transparency",
  },
  PARTY_FAMILY_ECOLOGIE: {
    fr: "Écologie",
    en: "Ecology",
  },
  POSITIONING_LEGEND_CONSENSUS: {
    fr: "Aucun désaccord significatif entre les modèles.",
    en: "No significant disagreement between models.",
  },
  POSITIONING_LEGEND_DISSENT: {
    fr: "Modèles en désaccord sur au moins un axe",
    en: "Models disagreeing on at least one axis",
  },
  POSITIONING_TOGGLES_CONSENSUS: {
    fr: "Consensus (médiane)",
    en: "Consensus (median)",
  },
  POSITIONNEMENT_INTRO_BODY: {
    fr: "Le positionnement est ordinal — il reflète l’ordre relatif des positions, pas une valeur numérique.",
    en: "Positioning is ordinal — it reflects the relative order of positions, not a numeric value.",
  },
  POSITIONNEMENT_SECTION: {
    fr: "Positionnement",
    en: "Positioning",
  },
  POSITIONNEMENT_SECTION_HEAD: {
    fr: "Positionnement politique",
    en: "Political positioning",
  },
  PROMPTS_AGGREGATION_LABEL: {
    fr: "Prompt d’agrégation",
    en: "Aggregation prompt",
  },
  PROMPTS_ANALYSIS_LABEL: {
    fr: "Prompt d’analyse",
    en: "Analysis prompt",
  },
  PROMPTS_COMPUTED_HASH: {
    fr: "calculée : {hash}",
    en: "computed: {hash}",
  },
  PROMPTS_CONSOLIDATION_LABEL: {
    fr: "Prompt de consolidation",
    en: "Consolidation prompt",
  },
  PROMPTS_COPIED: {
    fr: "Copié ✓",
    en: "Copied ✓",
  },
  PROMPTS_COPY: {
    fr: "Copier",
    en: "Copy",
  },
  PROMPTS_EXPECTED_HASH: {
    fr: "attendue : {hash}",
    en: "expected: {hash}",
  },
  PROMPTS_GIT_HISTORY: {
    fr: "Voir l’historique git de {file}",
    en: "See git history of {file}",
  },
  PROMPTS_HASH_MISMATCH_TITLE: {
    fr: "Empreinte SHA256 divergente",
    en: "SHA256 hash mismatch",
  },
  PROMPTS_NONE: {
    fr: "Aucun prompt enregistré pour cette version.",
    en: "No prompt recorded for this version.",
  },
  PROMPTS_SHA256_LABEL: {
    fr: "sha256 :",
    en: "sha256:",
  },
  PROMPTS_UNAVAILABLE_BODY: {
    fr: "Le fichier {file} a changé depuis l’exécution de cette version (ou n’existe plus à cette empreinte). Le SHA enregistré reste la preuve d’intégrité historique.",
    en: "The file {file} has changed since this version was generated (or no longer exists at this hash). The recorded SHA remains the historical integrity proof.",
  },
  PROMPTS_UNAVAILABLE_TITLE: {
    fr: "Prompt non disponible dans l’état courant du dépôt",
    en: "Prompt not available in the current repository state",
  },
  RADAR_AXIS_INTERVAL_LABEL: {
    fr: "{label}: {lo} à {hi}{tail}",
    en: "{label}: {lo} to {hi}{tail}",
  },
  RADAR_AXIS_INTERVAL_TAIL_DISSENT: {
    fr: " (désaccord)",
    en: " (disagreement)",
  },
  RADAR_CHART_LABEL: {
    fr: "Positionnement politique. {summary}",
    en: "Political positioning. {summary}",
  },
  RADAR_CONSENSUS_INTERVAL: {
    fr: "Intervalle de consensus : {lo} à {hi}",
    en: "Consensus interval: {lo} to {hi}",
  },
  RADAR_CONSENSUS_LABEL: {
    fr: "Consensus",
    en: "Consensus",
  },
  RADAR_DISSENT_COUNT: {
    fr: "Désaccord : {n} modèle(s)",
    en: "Disagreement: {n} model(s)",
  },
  RADAR_DISSENT_DETAIL: {
    fr: "Désaccord : {n} modèle{s}",
    en: "Disagreement: {n} model{s}",
  },
  RADAR_MODAL_UNRESOLVED: {
    fr: "Valeur modale : non résolue (milieu d’intervalle)",
    en: "Modal value: unresolved (interval midpoint)",
  },
  RADAR_MODAL_VALUE: {
    fr: "Valeur modale : {value}",
    en: "Modal value: {value}",
  },
  RESULTS_AGGREGATED_POSITIONING: {
    fr: "Positionnement agrégé",
    en: "Aggregated positioning",
  },
  RESULTS_AGGREGATED_POSITIONING_NOTE: {
    fr: "Valeurs entières ordinales. Aucune moyenne arithmétique n’est calculée — voir la spec §7.",
    en: "Ordinal integer values. No arithmetic mean is computed — see spec §7.",
  },
  RESULTS_AGGREGATION_NOTES: {
    fr: "Notes d’agrégation",
    en: "Aggregation notes",
  },
  RESULTS_AGREEMENT: {
    fr: "Accord / désaccord",
    en: "Agreement / disagreement",
  },
  RESULTS_ATTESTED_BY: {
    fr: "attesté par {by}",
    en: "attested by {by}",
  },
  RESULTS_ATTESTED_VERSION: {
    fr: "version attestée : {version}",
    en: "attested version: {version}",
  },
  RESULTS_CONSENSUS_HEADER: {
    fr: "Consensus — {n} affirmations",
    en: "Consensus — {n} claims",
  },
  RESULTS_COST_ESTIMATE: {
    fr: "coût : ${value}",
    en: "cost: ${value}",
  },
  RESULTS_DISSENT_COUNT_INLINE: {
    fr: "désaccords : {n}",
    en: "disagreements: {n}",
  },
  RESULTS_DISSENT_HEADER: {
    fr: "Désaccords — {n} affirmations",
    en: "Disagreements — {n} claims",
  },
  RESULTS_DOWNLOAD: {
    fr: "Télécharger",
    en: "Download",
  },
  RESULTS_HIDE_RAW: {
    fr: "Masquer",
    en: "Hide",
  },
  RESULTS_INTERVAL_LABEL: {
    fr: "intervalle : [{lo}, {hi}]",
    en: "interval: [{lo}, {hi}]",
  },
  RESULTS_LOADING_FAILED_INLINE: {
    fr: "Échec du chargement : {message}",
    en: "Loading failed: {message}",
  },
  RESULTS_LOADING_INLINE: {
    fr: "Chargement…",
    en: "Loading…",
  },
  RESULTS_MODAL_LABEL: {
    fr: "modal : {value}",
    en: "modal: {value}",
  },
  RESULTS_MODE_LABEL: {
    fr: "mode : {mode}",
    en: "mode: {mode}",
  },
  RESULTS_NO_CONSENSUS: {
    fr: "Aucune affirmation consensuelle.",
    en: "No consensus claim.",
  },
  RESULTS_NO_DISSENT: {
    fr: "Aucun désaccord.",
    en: "No disagreement.",
  },
  RESULTS_NO_MODELS: {
    fr: "Aucun modèle enregistré.",
    en: "No model recorded.",
  },
  RESULTS_OPEN_RAW_FILE: {
    fr: "Ouvrir le fichier brut",
    en: "Open the raw file",
  },
  RESULTS_PER_MODEL: {
    fr: "Sorties par modèle",
    en: "Per-model outputs",
  },
  RESULTS_RUN_LABEL: {
    fr: "run : {time}",
    en: "run: {time}",
  },
  RESULTS_SEE_FAILURE_REPORT: {
    fr: "Voir le rapport d’échec",
    en: "See failure report",
  },
  RESULTS_TOKENS_IN: {
    fr: "tokens in : {n}",
    en: "tokens in: {n}",
  },
  RESULTS_TOKENS_OUT: {
    fr: "tokens out : {n}",
    en: "tokens out: {n}",
  },
  RESULTS_VIEW_RAW_JSON: {
    fr: "Voir le JSON brut",
    en: "View raw JSON",
  },
  RISK_CATEGORY_BUDGETARY: {
    fr: "Budgétaire",
    en: "Budgetary",
  },
  RISK_CATEGORY_DEPENDENCY: {
    fr: "Dépendance",
    en: "Dependency",
  },
  RISK_CATEGORY_IMPLEMENTATION: {
    fr: "Mise en œuvre",
    en: "Implementation",
  },
  RISK_CATEGORY_REVERSIBILITY: {
    fr: "Réversibilité",
    en: "Reversibility",
  },
  RISK_CATEGORY_TIMELINE: {
    fr: "Calendrier",
    en: "Timeline",
  },
  RISK_HEATMAP_COL_MODELS: {
    fr: "Modèles",
    en: "Models",
  },
  RISK_HEATMAP_COL_PROBABILITY: {
    fr: "Probabilité",
    en: "Probability",
  },
  RISK_HEATMAP_COL_RISK: {
    fr: "Risque",
    en: "Risk",
  },
  RISK_HEATMAP_COL_SEVERITY: {
    fr: "Sévérité",
    en: "Severity",
  },
  RISK_HEATMAP_DISSENT_LABEL: {
    fr: "En désaccord",
    en: "In disagreement",
  },
  RISK_HEATMAP_EMPTY: {
    fr: "Aucun risque d’exécution identifié par les modèles.",
    en: "No execution risk identified by the models.",
  },
  RISK_HEATMAP_MODELS_LABEL: {
    fr: "Modèles ({n})",
    en: "Models ({n})",
  },
  RISK_HEATMAP_REASONING: {
    fr: "Raisonnement",
    en: "Reasoning",
  },
  RISK_LEVEL_HIGH: {
    fr: "Élevé",
    en: "High",
  },
  RISK_LEVEL_LIMITED: {
    fr: "Limité",
    en: "Limited",
  },
  RISK_LEVEL_LOW: {
    fr: "Faible",
    en: "Low",
  },
  RISK_LEVEL_MODERATE: {
    fr: "Modéré",
    en: "Moderate",
  },
  RISQUES_DRAWER_DESCRIPTION: {
    fr: "Chaque ligne est un risque identifié par au moins un modèle. Probabilité et sévérité sont rapportées séparément.",
    en: "Each row is a risk identified by at least one model. Probability and severity are reported separately.",
  },
  RISQUES_DRAWER_OPEN: {
    fr: "Voir tous les risques identifiés",
    en: "See all identified risks",
  },
  RISQUES_DRAWER_TITLE: {
    fr: "Liste complète",
    en: "Full list",
  },
  RISQUES_INTRO_BODY: {
    fr: "Budgétaire : coût potentiel non financé. Mise en œuvre : complexité d'exécution. Dépendance : risque de lock-in*. Réversibilité : probabilité qu'une majorité adverse révoque la mesure.",
    en: "Budgetary: potential unfunded cost. Implementation: complexity of execution. Dependency: risk of lock-in. Reversibility: probability that an opposing majority will revoke the measure.",
    // fr: "Lecture synthétique du profil de risque du programme, par domaine et par catégorie de risque. Les niveaux sont ordinaux (Faible, Limité, Modéré, Élevé) et rapportés par modèle — aucun score cardinal agrégé. Les divergences entre modèles sont signalées par ⚡.",
    // en: "A synthetic view of the programme’s risk profile, by domain and risk category. Levels are ordinal (Low, Limited, Moderate, High) and reported per model — no aggregated cardinal score. Disagreements between models are flagged with ⚡.",
  },
  RISQUE_BUDGETARY_INTRO_BODY: {
    fr: "Budgétaire : coût potentiel non financé.",
    en: "Budgetary: potential unfunded cost.",
  },
  RISQUE_IMPLEMENTATION_INTRO_BODY: {
    fr: "Mise en œuvre : complexité d'exécution.",
    en: "Implementation: complexity of execution.",
  },
  RISQUE_DEPENDENCY_INTRO_BODY: {
    fr: "Dépendance : risque de lock-in*.",
    en: "Dependency: risk of lock-in.",
  },
  RISQUE_REVERSIBILITY_INTRO_BODY: {
    fr: "Réversibilité : probabilité qu'une majorité adverse révoque la mesure.",
    en: "Reversibility: probability that an opposing majority will revoke the measure.",
  },
  RISQUE_DEPENDENCY_NOTE: {
    fr: "* Le « risque de lock-in » (ou effet d'enfermement) désigne une situation où une décision ou un investissement public crée une dépendance si forte envers une technologie, un acteur privé ou un État tiers, qu'il devient juridiquement, financièrement ou techniquement très difficile, voire impossible, de faire marche arrière ou de changer de fournisseur par la suite.",
    en: "* The \"lock-in risk\" (or lock-in effect) refers to a situation where a public decision or investment creates such a strong dependence on a technology, a private actor or a third state that it becomes legally, financially or technically very difficult, or even impossible, to reverse course or change suppliers later."
  },
  RISQUES_SECTION: {
    fr: "Risques",
    en: "Risks",
  },
  RISQUES_SECTION_LABEL: {
    fr: "Risques d’exécution",
    en: "Execution risks",
  },
  SOURCES_ACCESSED_AT: {
    fr: "accédée {at}",
    en: "accessed {at}",
  },
  SOURCES_EMPTY_BODY: {
    fr: "Les sources primaires archivées ne sont pas encore disponibles pour cette version. Voir le document consolidé pour le contenu du programme tel qu’il a été soumis aux modèles.",
    en: "Archived primary sources are not yet available for this version. See the consolidated document for the programme content submitted to the models.",
  },
  SOURCES_LOADING_INDEX: {
    fr: "Chargement de l’index des sources…",
    en: "Loading sources index…",
  },
  SOURCES_OPEN_CONSOLIDATED_DOC: {
    fr: "Ouvrir le document consolidé",
    en: "Open the consolidated document",
  },
  SOURCES_OPEN_NEW_TAB: {
    fr: "Ouvrir dans un nouvel onglet",
    en: "Open in a new tab",
  },
  SOURCES_ORIGIN_LINK: {
    fr: "source d’origine",
    en: "original source",
  },
  SOURCES_PREVIEW_UNAVAILABLE: {
    fr: "Aperçu non disponible.",
    en: "Preview unavailable.",
  },
  SOURCES_VIEW: {
    fr: "Voir",
    en: "View",
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
  SYNTHESE_CF_DRAWER_DESCRIPTION: {
    fr: "Trajectoire contrefactuelle : que se passerait-il sans ce programme ?",
    en: "Counterfactual trajectory: what would happen without this programme?",
  },
  SYNTHESE_CONFIDENCE: {
    fr: "Confiance",
    en: "Confidence",
  },
  SYNTHESE_CONFIDENCE_TOOLTIP: {
    fr: "Confiance moyenne des modèles : {pct} %",
    en: "Average model confidence: {pct}%",
  },
  SYNTHESE_CONSENSUS_LABEL: {
    fr: "Consensus {pct} % — {n} modèle(s)",
    en: "Consensus {pct}% — {n} model(s)",
  },
  SYNTHESE_COVERAGE_WARNING: {
    fr: "⚠ couverture limitée",
    en: "⚠ limited coverage",
  },
  SYNTHESE_DISSENTERS: {
    fr: "En désaccord",
    en: "Dissenting",
  },
  SYNTHESE_DOWNSIDE_TITLE: {
    fr: "Scénarios défavorables",
    en: "Downside scenarios",
  },
  SYNTHESE_DOWNSIDE_TRIGGER: {
    fr: "Déclencheur :",
    en: "Trigger:",
  },
  SYNTHESE_EMPTY_FALLBACK: {
    fr: "Aucun élément marquant identifié dans cette analyse",
    en: "No notable element identified in this analysis",
  },
  SYNTHESE_GAPS: {
    fr: "Absences notables",
    en: "Notable gaps",
  },
  SYNTHESE_IF_NOTHING_CHANGES: {
    fr: "Si rien ne change",
    en: "If nothing changes",
  },
  SYNTHESE_IMPACT_ON: {
    fr: "Impact sur",
    en: "Impact on",
  },
  SYNTHESE_NO_IMPACT_ON: {
    fr: "Pas d’impact sur",
    en: "No impact on",
  },
  SYNTHESE_PROBABILITY: {
    fr: "Probabilité",
    en: "Probability",
  },
  SYNTHESE_PROGRAM_EFFECT: {
    fr: "Effet du programme",
    en: "Programme effect",
  },
  SYNTHESE_REASONING: {
    fr: "Raisonnement",
    en: "Reasoning",
  },
  SYNTHESE_SECTION: {
    fr: "Synthèse",
    en: "Summary",
  },
  SYNTHESE_SEVERITY: {
    fr: "Sévérité",
    en: "Severity",
  },
  SYNTHESE_STATUS_QUO: {
    fr: "Statu quo",
    en: "Status quo",
  },
  SYNTHESE_STRENGTHS: {
    fr: "Points forts",
    en: "Strengths",
  },
  SYNTHESE_SUPPORTED_BY: {
    fr: "Soutenu par",
    en: "Supported by",
  },
  SYNTHESE_TRAJ_IMPROVED_ARIA: {
    fr: "Trajectoire améliorée",
    en: "Trajectory improved",
  },
  SYNTHESE_TRAJ_IMPROVED_LABEL: {
    fr: "Amélioration",
    en: "Improving",
  },
  SYNTHESE_TRAJ_MIXED_ARIA: {
    fr: "Effets contrastés",
    en: "Mixed effects",
  },
  SYNTHESE_TRAJ_MIXED_LABEL: {
    fr: "Effets contrastés",
    en: "Mixed effects",
  },
  SYNTHESE_TRAJ_UNCHANGED_ARIA: {
    fr: "Trajectoire inchangée",
    en: "Trajectory unchanged",
  },
  SYNTHESE_TRAJ_UNCHANGED_LABEL: {
    fr: "Trajectoire inchangée",
    en: "Trajectory unchanged",
  },
  SYNTHESE_TRAJ_WORSENED_ARIA: {
    fr: "Trajectoire dégradée",
    en: "Trajectory worsened",
  },
  SYNTHESE_TRAJ_WORSENED_LABEL: {
    fr: "Détérioration",
    en: "Worsening",
  },
  SYNTHESE_WEAKNESSES: {
    fr: "Points faibles",
    en: "Weaknesses",
  },
  TOGGLE_LANG_EN: {
    fr: "Anglais",
    en: "English",
  },
  TOGGLE_LANG_FR: {
    fr: "Français",
    en: "French",
  },
  TOGGLE_THEME_DARK: {
    fr: "Mode sombre",
    en: "Dark mode",
  },
  TOGGLE_THEME_LIGHT: {
    fr: "Mode clair",
    en: "Light mode",
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
  TRANSPARENCY_AGGREGATION_PROMPT_HASH: {
    fr: "SHA256 du prompt d’agrégation",
    en: "Aggregation prompt SHA256",
  },
  TRANSPARENCY_AGGREGATOR: {
    fr: "Agrégateur",
    en: "Aggregator",
  },
  TRANSPARENCY_ANALYSIS_MODELS: {
    fr: "Modèles d’analyse",
    en: "Analysis models",
  },
  TRANSPARENCY_ANALYSIS_PROMPT_HASH: {
    fr: "SHA256 du prompt d’analyse",
    en: "Analysis prompt SHA256",
  },
  TRANSPARENCY_ATTESTED_BY: {
    fr: "Attesté par",
    en: "Attested by",
  },
  TRANSPARENCY_ATTESTED_VERSION: {
    fr: "Version attestée",
    en: "Attested version",
  },
  TRANSPARENCY_DOC_DOWNLOAD_TITLE: {
    fr: "Document consolidé",
    en: "Consolidated document",
  },
  TRANSPARENCY_DOWNLOADS: {
    fr: "Téléchargements",
    en: "Downloads",
  },
  TRANSPARENCY_DRAWER_DESCRIPTION: {
    fr: "Toutes les pièces justificatives de cette analyse.",
    en: "All supporting evidence for this analysis.",
  },
  TRANSPARENCY_EXACT_VERSION: {
    fr: "Version exacte",
    en: "Exact version",
  },
  TRANSPARENCY_EXECUTION_MODE: {
    fr: "Mode d’exécution",
    en: "Execution mode",
  },
  TRANSPARENCY_FOOTER_INTRO: {
    fr: "Cette analyse a été produite par {count} {modelLabel} analysant indépendamment le programme du candidat au {date}.",
    en: "This analysis was produced by {count} {modelLabel} independently analysing the candidate’s programme as of {date}.",
  },
  TRANSPARENCY_HUMAN_REVIEW: {
    fr: "Revue humaine",
    en: "Human review",
  },
  TRANSPARENCY_HUMAN_REVIEW_COMPLETE: {
    fr: "Revue humaine terminée",
    en: "Human review complete",
  },
  TRANSPARENCY_HUMAN_REVIEW_PENDING: {
    fr: "Revue humaine en attente",
    en: "Human review pending",
  },
  TRANSPARENCY_HUMAN_REVIEW_PENDING_DETAIL: {
    fr: "Cette version n’a pas encore été validée par un relecteur humain.",
    en: "This version has not yet been validated by a human reviewer.",
  },
  TRANSPARENCY_HUMAN_REVIEW_PENDING_LABEL: {
    fr: "Revue humaine non complétée",
    en: "Human review not completed",
  },
  TRANSPARENCY_METHODOLOGY_BODY_HASH: {
    fr: "Les hachages SHA256 ci-dessus permettent de vérifier que les prompts publiés dans le dépôt correspondent exactement à ceux utilisés pour cette analyse.",
    en: "The SHA256 hashes above let you verify that the prompts published in the repository match exactly the ones used for this analysis.",
  },
  TRANSPARENCY_METHODOLOGY_BODY_PIPELINE: {
    fr: "Le programme du candidat est consolidé à partir de sources publiques (voir sources.md), puis soumis indépendamment à chaque modèle via un prompt versionné. Les réponses brutes (raw-outputs/) sont ensuite agrégées sans moyennage cardinal du positionnement et avec préservation des désaccords inter-modèles.",
    en: "The candidate’s programme is consolidated from public sources (see sources.md), then submitted independently to each model through a versioned prompt. Raw responses (raw-outputs/) are then aggregated without cardinal averaging of positioning and while preserving inter-model dissent.",
  },
  TRANSPARENCY_METHODOLOGY_FULL_LINK: {
    fr: "Méthodologie complète →",
    en: "Full methodology →",
  },
  TRANSPARENCY_METHODOLOGY_TITLE: {
    fr: "Comment ces données ont été produites",
    en: "How this data was produced",
  },
  TRANSPARENCY_MODEL_LABEL_PLURAL: {
    fr: "modèles d’IA",
    en: "AI models",
  },
  TRANSPARENCY_MODEL_LABEL_SINGULAR: {
    fr: "modèle d’IA",
    en: "AI model",
  },
  TRANSPARENCY_NA: {
    fr: "non disponible",
    en: "not available",
  },
  TRANSPARENCY_NO_MODELS: {
    fr: "Aucun modèle enregistré.",
    en: "No model recorded.",
  },
  TRANSPARENCY_PARTIAL_COVERAGE_DETAIL: {
    fr: "Moins de trois modèles ont analysé ce programme avec succès — les désaccords et consensus sont donc établis sur une base réduite.",
    en: "Fewer than three models successfully analysed this programme — disagreements and consensus are therefore established on a reduced basis.",
  },
  TRANSPARENCY_PARTIAL_COVERAGE_LABEL: {
    fr: "Couverture partielle",
    en: "Partial coverage",
  },
  TRANSPARENCY_PROVIDER: {
    fr: "Fournisseur",
    en: "Provider",
  },
  TRANSPARENCY_REVIEW_DONE_BADGE: {
    fr: "Revue humaine ✓",
    en: "Human review ✓",
  },
  TRANSPARENCY_REVIEW_DONE_BY: {
    fr: "par {reviewer}",
    en: "by {reviewer}",
  },
  TRANSPARENCY_REVIEW_IN_PROGRESS: {
    fr: "Revue humaine en cours — publication provisoire",
    en: "Human review in progress — provisional publication",
  },
  TRANSPARENCY_REVIEW_NOT_VALIDATED: {
    fr: "Revue non validée",
    en: "Review not validated",
  },
  TRANSPARENCY_RUN_AT: {
    fr: "Exécuté le",
    en: "Run at",
  },
  TRANSPARENCY_SUMMARY_AGGREGATION: {
    fr: "Agrégation",
    en: "Aggregation",
  },
  TRANSPARENCY_SUMMARY_MODELS: {
    fr: "Modèles",
    en: "Models",
  },
  TRANSPARENCY_SUMMARY_SCHEMA: {
    fr: "Schéma",
    en: "Schema",
  },
  TRANSPARENCY_SUMMARY_VERSION: {
    fr: "Version",
    en: "Version",
  },
  TRANSPARENCY_TAB_DOCUMENT: {
    fr: "Document consolidé",
    en: "Consolidated document",
  },
  TRANSPARENCY_TAB_PROMPTS: {
    fr: "Prompts",
    en: "Prompts",
  },
  TRANSPARENCY_TAB_RESULTS: {
    fr: "Résultats IA",
    en: "AI results",
  },
  TRANSPARENCY_TAB_SOURCES: {
    fr: "Sources",
    en: "Sources",
  },
  TRANSPARENCY_TRANSLATION_INGESTED_AT: {
    fr: "Ingéré le",
    en: "Ingested at",
  },
  TRANSPARENCY_TRANSLATION_LOCALE: {
    fr: "Langue cible",
    en: "Target locale",
  },
  TRANSPARENCY_TRANSLATION_MODEL: {
    fr: "Modèle attesté",
    en: "Attested model",
  },
  TRANSPARENCY_TRANSLATION_PROMPT_SHA: {
    fr: "Empreinte du prompt (SHA256)",
    en: "Prompt SHA256",
  },
  TRANSPARENCY_TRANSLATION_REVIEW_DONE: {
    fr: "Revue humaine terminée",
    en: "Human review complete",
  },
  TRANSPARENCY_TRANSLATION_REVIEW_PENDING: {
    fr: "Revue humaine en attente",
    en: "Human review pending",
  },
  TRANSPARENCY_TRANSLATION_TITLE: {
    fr: "Traduction",
    en: "Translation",
  },
  WORDMARK: {
    fr: "Élection 2027",
    en: "Election 2027",
  },
} as const satisfies Record<string, I18nString>;

export type UiStringKey = keyof typeof UI_STRINGS;

/** Substitutes `{key}` placeholders in a translated template string. */
export function format(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, k) =>
    Object.prototype.hasOwnProperty.call(vars, k) ? String(vars[k]) : `{${k}}`,
  );
}
