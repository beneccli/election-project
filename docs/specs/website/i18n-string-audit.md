# i18n string audit — site/components and site/app

> **Status:** Draft — produced by task 0120
> **Spec:** [`i18n.md`](i18n.md)
> **Consumed by:** task 0127 (Complete real EN translations for all `UI_STRINGS`)

This document catalogues every visible French string in production
files under `site/components/**/*.tsx` and `site/app/**/*.tsx`. Test
files (`*.test.tsx`), JSDoc, comments, and code-level identifiers are
excluded.

Each entry proposes a `UI_STRINGS` key (SCREAMING_SNAKE,
surface-prefixed) for task 0127 to introduce. Some files already use
inline FR/EN ternaries (`lang === "en" ? … : …`); those should still
move into `UI_STRINGS` for symmetry and testability.

The proposed keys deliberately mirror the existing pattern:
- `NAV_*` / `LANDING_NAV_*` for navigation chrome
- `HERO_*` for the candidate hero
- `SECTION_*` for section headings
- `<COMPONENT>_*` for widget-internal copy (e.g. `RISK_LEVEL_HIGH`)
- `META_*` for page `metadata.title`/`description`
- `A11Y_*` for `aria-label`/`title`/screen-reader-only strings

---

## site/app/

### `app/layout.tsx`

| Line | String | Proposed key |
|------|--------|--------------|
| 24 | `"Élection 2027 — Analyse IA des programmes présidentiels"` | `META_ROOT_TITLE` |
| 26 | `"Analyse transparente multi-IA des programmes des candidats à la présidentielle 2027."` | `META_ROOT_DESCRIPTION` |

### `app/page.tsx` (landing)

| Line | String | Proposed key |
|------|--------|--------------|
| 17 | `"Élection 2027 · Analyse multi-IA des programmes"` | `META_LANDING_TITLE` |
| 19 | `"Que proposent vraiment les candidats à l'Élysée ? …"` (full sentence) | `META_LANDING_DESCRIPTION` |

### `app/comparer/page.tsx`

| Line | String | Proposed key |
|------|--------|--------------|
| 17 | `"Comparer les programmes · Élection 2027"` | `META_COMPARER_TITLE` |
| 19 | `"Comparer côte à côte 2 à 4 programmes de l'élection présidentielle 2027."` | `META_COMPARER_DESCRIPTION` |
| 40 | `"Sélectionnez jusqu'à 4 candidats pour les comparer sur les mêmes dimensions."` | `COMPARER_PAGE_LEAD` |

### `app/candidat/[id]/page.tsx`

| Line | String | Proposed key |
|------|--------|--------------|
| 31 | `` `${meta.display_name} — Analyse · Élection 2027` `` | `META_CANDIDATE_TITLE` (with placeholder) |
| 33 | `"Candidat introuvable · Élection 2027"` | `META_CANDIDATE_NOT_FOUND_TITLE` |
| 58 | `"Comparer à un autre candidat"` | `CANDIDATE_PAGE_COMPARE_LINK` |

---

## site/components/chrome/

### `chrome/NavBar.tsx`, `LandingNavBar.tsx`, `ComparisonNavBar.tsx`

The wordmark `"é<span>lection</span> 2027"` is intentionally a typographic
treatment, not a translatable string — but the `aria-label` should
reflect locale. Task 0127 wraps the wordmark in
`UI_STRINGS.WORDMARK_ELECTION` (already exists) and adds an
`A11Y_WORDMARK` key.

| File | Line | String | Proposed key |
|------|------|--------|--------------|
| `NavBar.tsx` | 26 | `"Ouvrir la transparence complète"` | `NAV_OPEN_TRANSPARENCY` |

### `chrome/TransparencyFooter.tsx`

| Line | String | Proposed key |
|------|--------|--------------|
| 61 | `"Aucun modèle enregistré."` | `TRANSPARENCY_NO_MODELS` |
| 173 | `"… publiques (voir sources.md), …"` (composed body) | `TRANSPARENCY_INTRO_BODY` (single block, with `<code>` markup retained) |
| 176 | `"raw-outputs/) sont ensuite …"` | (continuation of above) |
| 255 | `"non disponible"` | `TRANSPARENCY_NA` |
| 316 | `"Revue humaine en cours — publication provisoire"` | `TRANSPARENCY_REVIEW_IN_PROGRESS` |

### `chrome/Drawer.tsx`

| Line | String | Proposed key |
|------|--------|--------------|
| 68 | `aria-label="Fermer"` | `A11Y_DRAWER_CLOSE` |

### `chrome/TransparencyDrawer.tsx`

| Line | String | Proposed key |
|------|--------|--------------|
| 107 | `aria-label="Sections de transparence"` | `A11Y_TRANSPARENCY_TABS` |

(Drawer copy lives in tab files under `components/transparency/`; see below.)

---

## site/components/sections/

### `sections/SyntheseSection.tsx`

| Line | String | Proposed key |
|------|--------|--------------|
| 52, 55 | `"Amélioration"`, `"Trajectoire améliorée"` | `SYNTHESE_TRAJ_IMPROVED_LABEL`, `SYNTHESE_TRAJ_IMPROVED_ARIA` |
| 58, 61 | `"Détérioration"`, `"Trajectoire dégradée"` | `SYNTHESE_TRAJ_WORSENED_LABEL`, `SYNTHESE_TRAJ_WORSENED_ARIA` |
| 64, 67 | `"Trajectoire inchangée"` | `SYNTHESE_TRAJ_UNCHANGED_LABEL` (and reuse for aria) |
| 70, 73 | `"Effets contrastés"` | `SYNTHESE_TRAJ_MIXED_LABEL` |
| 93, 96 | `data-screen-label="Synthèse"` / `<SectionHead label="Synthèse">` | reuse `SYNTHESE_SECTION` (already in UI_STRINGS) |
| 104 | `` `Consensus ${consensusPct} % — ${coverageCount} modèle(s)` `` | `SYNTHESE_CONSENSUS_LABEL` (template) |
| 110 | `"⚠ couverture limitée"` | `SYNTHESE_COVERAGE_WARNING` |
| 140 | `"Scénarios défavorables"` | `SYNTHESE_DOWNSIDE_TITLE` |
| 150–163 | Drawer eyebrows/titles for "Si rien ne change" / "Scénarios défavorables" | `SYNTHESE_DRAWER_*` |

### `sections/PositionnementSection.tsx`

| Line | String | Proposed key |
|------|--------|--------------|
| 26–30 | "Le positionnement est ordinal — il reflète l'ordre relatif…" full paragraph | `POSITIONNEMENT_INTRO_BODY` |

### `sections/DomainesSection.tsx`

| Line | String | Proposed key |
|------|--------|--------------|
| 231 | `"consensus"` (small badge) | `DOMAINES_CONSENSUS_BADGE` |

### `sections/IntergenSection.tsx`

| Line | String | Proposed key |
|------|--------|--------------|
| 65 | `title="Comparaison individuelle"` | `INTERGEN_DRAWER_TITLE` |

### `sections/RisquesSection.tsx`

| Line | String | Proposed key |
|------|--------|--------------|
| 19–22 | Dimension labels (`"Économique & fiscal"` …) | `DIMENSION_LABEL_<KEY>` (5 keys) — also used by `RiskSummaryMatrix.tsx` and `widgets/IntergenHorizonTable.tsx`; centralise once. |
| 46 | `"Risques d'exécution"` (SectionHead label) | `RISQUES_SECTION_LABEL` (extends existing `RISQUES_SECTION`) |
| 48–51 | Long descriptive paragraph | `RISQUES_INTRO_BODY` |
| 62 | `"Voir tous les risques identifiés"` | `RISQUES_DRAWER_OPEN` |
| 71 | `eyebrow="Risques d'exécution"` | reuse `RISQUES_SECTION_LABEL` |
| 72 | `title="Liste complète"` | `RISQUES_DRAWER_TITLE` |
| 73 | `description="Chaque ligne est un risque…"` | `RISQUES_DRAWER_DESCRIPTION` |

---

## site/components/widgets/

### `widgets/GradeBadge.tsx`

| Line | String | Proposed key |
|------|--------|--------------|
| 26 | `"Non abordé"` | `GRADE_NOT_ADDRESSED` |

### `widgets/PositioningRadar.tsx`

| Line | String | Proposed key |
|------|--------|--------------|
| 79 | `"… à … (désaccord)"` template | `RADAR_AXIS_INTERVAL_LABEL` (template) |
| 265 | `"Intervalle de consensus : … à …"` | `RADAR_CONSENSUS_INTERVAL` |
| 271 | `"Valeur modale : non résolue (milieu d'intervalle)"` | `RADAR_MODAL_UNRESOLVED` |
| 275 | `` `Désaccord : ${n} modèle(s)` `` | `RADAR_DISSENT_COUNT` (template) |
| 282 | full aria-label template | `A11Y_RADAR_AXIS` (template) |

### `widgets/PositioningToggles.tsx`

| Line | String | Proposed key |
|------|--------|--------------|
| 43 | `"Consensus (médiane)"` | `POSITIONING_TOGGLES_CONSENSUS` |

### `widgets/AxisAgreementBars.tsx`

| Line | String | Proposed key |
|------|--------|--------------|
| 69 | `` `⚡ Désaccord ±${dissentSpread}` `` | `AXIS_AGREEMENT_DISSENT` (template) |
| 131 | `` `${model} en désaccord à la position ${pos}` `` | `A11Y_AXIS_AGREEMENT_DISSENT` (template) |

### `widgets/PositioningLegend.tsx`

| Line | String | Proposed key |
|------|--------|--------------|
| 37 | `"Modèles en désaccord sur au moins un axe"` | `POSITIONING_LEGEND_DISSENT` |
| 57 | `"Aucun désaccord significatif entre les modèles."` | `POSITIONING_LEGEND_CONSENSUS` |

### `widgets/IntergenSplitPanel.tsx`

| Line | String | Proposed key |
|------|--------|--------------|
| 13–22 | Cohort/category labels (`"Marché du travail"`, `"Santé"`, …) | `INTERGEN_CATEGORY_<KEY>` |
| 46 | `title="À 25 ans (né·e en 2002)"` | `INTERGEN_AT_25_TITLE` |
| 53 | `title="À 65 ans (né·e en 1962)"` | `INTERGEN_AT_65_TITLE` |
| 95 | `"Non quantifié"` | `INTERGEN_NOT_QUANTIFIED` |
| 114 | `"Résumé"` | `INTERGEN_SUMMARY_LABEL` |

### `widgets/IntergenHorizonTable.tsx`

| Line | String | Proposed key |
|------|--------|--------------|
| 25 | `cohort: "Jeunes actifs & retraités"` | `INTERGEN_HORIZON_COHORT_<KEY>` |
| 27 | `cohort: "Génération Z & Alpha"` | (same family) |
| 34, 35 | `"Santé"`, `"Éducation"` | `DIMENSION_LABEL_<KEY>` (centralised) |
| 64 | `aria-label="Matrice d'impact intergénérationnel par domaine et horizon"` | `A11Y_INTERGEN_TABLE` |
| 160 | `` `Dissensus : ${n} modèle(s)` `` | `A11Y_DISSENT_COUNT` (template; share with risk matrix) |
| 214–218 | `"Très positif"`, `"Négatif"`, `"Très négatif"` … | `INTERGEN_LEGEND_<KEY>` |
| 239 | `"dissensus entre modèles"` | `LEGEND_DISSENT_INLINE` |

### `widgets/RiskSummaryMatrix.tsx`

| Line | String | Proposed key |
|------|--------|--------------|
| 23–26 | Risk category labels (`"Budgétaire"` …) | `RISK_CATEGORY_<KEY>` |
| 30–33 | Dimension labels (5 keys) | `DIMENSION_LABEL_<KEY>` (centralised, reuse) |
| 39–41 | Level labels (`"Limité"`, `"Modéré"`, `"Élevé"`) plus `"Faible"` | `RISK_LEVEL_<LOW\|LIMITED\|MODERATE\|HIGH>` |
| 74 | `aria-label="Matrice des risques par domaine et catégorie"` | `A11Y_RISK_MATRIX` |
| 145 | `` `Dissensus : ${n} modèle(s)` `` | `A11Y_DISSENT_COUNT` (template) |
| 192 | `"Légende"` | `LEGEND_LABEL` |
| 207 | `"dissensus entre modèles"` | `LEGEND_DISSENT_INLINE` (reuse) |

### `widgets/RiskHeatmap.tsx`

| Line | String | Proposed key |
|------|--------|--------------|
| 29–32 | Column headers (`"Risque"`, `"Probabilité"`, `"Sévérité"`, `"Modèles"`) | `RISK_HEATMAP_COL_<…>` |
| 33 | `aria-label="Détails"` | `A11Y_DETAILS` |
| 63 | `"Aucun risque d'exécution identifié par les modèles."` | `RISK_HEATMAP_EMPTY` |
| 111, 114 | `label="Probabilité"`, `label="Sévérité"` | reuse `RISK_HEATMAP_COL_*` |
| 125 | `"Réduire les détails"` / `"Afficher les détails"` | `A11Y_DETAILS_TOGGLE_OPEN`/`_CLOSED` |
| 153 | `` `Modèles (${n})` `` | `RISK_HEATMAP_MODELS_LABEL` (template) |
| 168 | `"En désaccord"` | `RISK_HEATMAP_DISSENT_LABEL` |

### `widgets/ConfidenceDots.tsx`

The component already accepts a `label` prop — no hardcoded FR.

---

## site/components/comparison/

### `comparison/IntergenComparison.tsx`

Currently uses inline `lang === "en" ? "…" : "…"` ternaries.
Move all into `UI_STRINGS`:

| Line | FR | EN | Proposed key |
|------|----|----|--------------|
| 23–24 | dimension labels | already inline | `DIMENSION_LABEL_<KEY>` (centralised) |
| 77 | `"Intergénérationnel"` | `"Intergenerational"` | `COMPARISON_INTERGEN_TITLE` |
| 82 | `"Impact net estimé sur les générations futures (−3 très négatif, +3 très positif) à l'horizon 2047."` | EN equivalent | `COMPARISON_INTERGEN_INTRO` |
| 130 | `"Voir la matrice complète sur la fiche candidat"` | EN equivalent | `COMPARISON_INTERGEN_LINK` |

### `comparison/PositionnementComparison.tsx`

| Line | String | Proposed key |
|------|--------|--------------|
| 27–29 | "polygones superposés et les dots par axe restituent les écarts sans valeur calculée." | `COMPARISON_POSITIONNEMENT_INTRO` |

### `comparison/RisquesComparison.tsx`

Inline FR/EN ternaries already exist for risk levels and category
labels — move to `UI_STRINGS.RISK_LEVEL_*` and `RISK_CATEGORY_*`
(centralised, reused with the candidate page).

| Line | String | Proposed key |
|------|--------|--------------|
| 234 | `"Légende"` | `LEGEND_LABEL` (reuse) |

### `comparison/CandidateSelector.tsx`

| Line | String | Proposed key |
|------|--------|--------------|
| 24 | `` `Candidats sélectionnés (${n}/${max})` `` | `COMPARISON_SELECTED_COUNT` (template) |
| 60 | `` `${selected ? "Désélectionner" : "Sélectionner"} ${name}, ${party}, …` `` | `A11Y_COMPARISON_SELECT` (template) |

### `comparison/SelectedHeader.tsx`

| Line | String | Proposed key |
|------|--------|--------------|
| 39 | `"Candidats sélectionnés"` | `COMPARISON_SELECTED_HEADER` |

### `comparison/ComparisonTransparencyFooter.tsx`

| Line | String | Proposed key |
|------|--------|--------------|
| 30 | "Cette page affiche les analyses agrégées …" full body | `COMPARISON_FOOTER_BODY` |
| 36 | `"Aucun candidat sélectionné."` | `COMPARISON_NO_CANDIDATES_SELECTED` |

### `comparison/ComparisonRadar.tsx`

| Line | String | Proposed key |
|------|--------|--------------|
| 40 | `` `Positionnement comparé — ${names…}` `` | `A11Y_COMPARISON_RADAR` (template) |

### `comparison/ComparisonSectionsPlaceholder.tsx`

| Line | String | Proposed key |
|------|--------|--------------|
| 15 | `"Sélectionnez au moins 2 candidats pour afficher la comparaison."` | `COMPARISON_PICK_AT_LEAST_TWO` |

### `comparison/PositionnementRows.tsx`

| Line | String | Proposed key |
|------|--------|--------------|
| 66 | `title="Écart inter-candidats sur cet axe (ordinal, en unités)"` | `COMPARISON_AXIS_SPREAD_TOOLTIP` |

---

## site/components/landing/

### `landing/CandidateGrid.tsx`

| Line | String | Proposed key |
|------|--------|--------------|
| 102 | `"Famille politique"` | `LANDING_FAMILY_FILTER_LABEL` |

### `landing/CandidateCard.tsx`

| Line | String | Proposed key |
|------|--------|--------------|
| 142, 143 | `"Gauche"`, `"Droite"` (axis end labels) | `LANDING_AXIS_LEFT`, `LANDING_AXIS_RIGHT` |

(Other landing copy is already routed via `UI_STRINGS` — see existing
`LANDING_*` entries.)

---

## site/components/transparency/

### `transparency/ResultsTab.tsx`

| Line | String | Proposed key |
|------|--------|--------------|
| 58 | `aria-label="Vues de résultats"` | `A11Y_TRANSPARENCY_RESULTS_TABS` |
| 369 | `"Chargement…"` | `LOADING` (reusable) |
| 419 | `"Aucune affirmation consensuelle."` | `RESULTS_NO_CONSENSUS` |
| 445 | `"Aucun désaccord."` | `RESULTS_NO_DISSENT` |

### `transparency/SourcesTab.tsx`

| Line | String | Proposed key |
|------|--------|--------------|
| 301 | `"Chargement…"` | `LOADING` (reuse) |

### `transparency/PromptsTab.tsx`

| Line | String | Proposed key |
|------|--------|--------------|
| 204 | `"Chargement…"` | `LOADING` (reuse) |

(Section headings within transparency tabs and other prose require a
deeper pass during task 0127 — read each tab file for `<h2>`, `<h3>`,
intro paragraphs.)

---

## Centralised label tables to extract

These tables appear redundantly across multiple files; task 0127 should
extract each into a single `UI_STRINGS` entry per key:

- **`DIMENSION_LABEL_*`** (5 keys) — shared by `RisquesSection`,
  `RiskSummaryMatrix`, `IntergenHorizonTable`, comparison widgets.
- **`RISK_LEVEL_*`** (4 keys) — shared by `RiskSummaryMatrix` and
  `RisquesComparison`.
- **`RISK_CATEGORY_*`** (4 keys) — shared by `RiskSummaryMatrix` and
  `RisquesComparison`.
- **`HORIZON_LABEL_*` / `HORIZON_COHORT_*`** — `IntergenHorizonTable`
  and any future comparison cohort labels.

---

## Out of scope for task 0127

- **Test files (`*.test.tsx`)** — assertions intentionally check the FR
  rendering and stay in FR even after EN locale is added (they cover
  the canonical FR tree).
- **Source-data prose** rendered from `aggregated.json`
  (e.g. dimension headlines, summaries) — translation pipeline (tasks
  0121/0122) covers this.
- **Wordmark typography** (`é<span>lection</span>`) — visual treatment
  retained verbatim across locales; the surrounding `aria-label` is
  what becomes locale-aware.

---

## Cross-checks for task 0127

1. After replacement, `grep -E "[éèêëàâäîïôöûüùç]" site/components site/app -rn` should return only:
   - `site/lib/i18n.ts`
   - `*.test.tsx` files (excluded)
   - `// …` comments
2. The `i18n.test.ts` no-placeholder check (added in 0127) covers
   completeness on the EN side.
