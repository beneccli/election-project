# Candidate Page Polish — Screenshot-Worthy Sections

> **Version:** 1.0
> **Status:** Stable (finalized by M_CandidatePagePolish spike `0080`, 2026-04-20)
> **Milestone:** M_CandidatePagePolish
> **Scope:** Four sections of the candidate page — Positionnement,
> Domaines, Intergénérationnel, Risques — and the schema / prompt
> extensions that feed them. Reuses editorial and visual constraints
> from [`visual-components.md`](visual-components.md).
> **Out of scope:** Transparency drawer content (M_Transparency),
> comparison page (M_Comparison), landing page (M_Landing), new
> dimensions or positioning axes, any live-API runs.

---

## 1. Problem statement

The candidate page prototype (`Candidate Page.html`) was designed to be
**screenshot-worthy**: each section stands alone as a shareable visual.
The `M_WebsiteCore` + `M_VisualComponents` implementation follows the
prototype closely but four sections diverged — correctly displaying real
aggregated data but trading punch for density:

| Section | Shipped behavior | Prototype behavior |
|---|---|---|
| **Positionnement** | Radar shows *only* the consensus polygon; per-axis dissent is shown in text. | Radar overlays each model's polygon + consensus; model selectable. |
| **Domaines** | Compact 5-tile grid (grade + confidence); requires clicking to see any substance. | Per-dimension list row with a concise headline + confidence bar + dissent chip, always visible. |
| **Intergénérationnel** | Two-column 25yo / 65yo split panel — rich but dense. | Domain × 3-horizon matrix with ordinal impact scores — instantly legible. |
| **Risques** | Per-risk expandable table grouped by dimension (all content inline). | Dimension × 4-risk-category heatmap — instantly legible; full risk list behind a "voir le détail" action. |

The fix is **not** to throw away the deep data. The fix is a two-layer
display: a screenshot-worthy summary on top, the existing depth available
one click away (inline expansion or right-side drawer).

This requires additive schema changes because the summary layer uses
information the LLMs don't currently produce:

- A **concise dimension headline** (the existing `summary` is 2–3
  sentences).
- A **per-dimension 4-category risk summary** (Budgétaire / Mise en œuvre /
  Dépendance / Réversibilité) — the existing `execution_risks[]` is free-
  form.
- A **domain × horizon intergenerational matrix** — the existing 25yo /
  65yo split has no time dimension.
- A **per-model complete positioning list** — the existing aggregated
  positioning only carries dissenters inline.

---

## 2. Design principles (recap)

All choices below defer to [`editorial-principles.md`](../analysis/editorial-principles.md)
and the design constraints in [`visual-components.md`](visual-components.md) §2.
Two non-negotiables drive the schema shape:

1. **Positioning-style ordinal aggregation for every new quantified field.**
   Modal + interval + verbatim per-model, never cardinal mean. This is the
   pattern proven in [`aggregation.md`](../analysis/aggregation.md)
   §"Positioning aggregation" and we reuse it verbatim.
2. **Symmetric scrutiny via fixed cell sets.** The 4 risk categories × 5
   dimensions grid and the 6 × 3 horizon matrix are **fixed shapes**. A
   candidate whose program is silent on a cell emits a measurement-framed
   "program does not specify" note with the appropriate low-impact /
   low-level signal — never a missing row.

---

## 3. Schema extensions (v1.1)

`schema_version` bumps from `"1.0"` to `"1.1"` on both
`AnalysisOutputSchema` and `AggregatedOutputSchema`. All additions are
**additive**. No existing field is removed or changes shape.

Canonical implementation: `scripts/lib/schema.ts`. This document is the
human-readable companion — if the two diverge the Zod schema wins.

### 3.1 `dimensions[k].headline` (new)

**Per-model:**
```ts
headline: z.string().min(1).max(140)
```

**Aggregated:**
```ts
headline: z.object({
  text: z.string().min(1).max(140),
  supported_by: z.array(ModelIdentifierSchema).min(1),
  dissenters: z.array(ModelIdentifierSchema),
  per_model: z.array(z.object({
    model: ModelIdentifierSchema,
    text: z.string().min(1).max(140),
  })),
  human_edit: z.boolean().optional(),
})
```

**Semantics.** A ≤140-char one-liner distilling the central policy claim
of the dimension. Example:

> "Objectif de déficit à 3% du PIB d'ici 2030, sans détail sur les coupes ou hausses de recettes."

The aggregator synthesizes a single `text` from the per-model headlines
(best-supported phrasing) and preserves each model's version in
`per_model`. The existing `summary` is kept — it serves the deep-dive.

### 3.2 `dimensions[k].risk_profile` (new)

**Four fixed risk categories, enumerated once project-wide:**

```ts
const RiskCategoryKey = z.enum([
  "budgetary",        // "Risque budgétaire — coût potentiel non financé"
  "implementation",   // "Mise en œuvre — complexité d'exécution"
  "dependency",       // "Dépendance — risque de lock-in"
  "reversibility",    // "Réversibilité — probabilité qu'une majorité adverse révoque la mesure"
]);

const RiskLevel = z.enum(["low", "limited", "moderate", "high"]);
```

**Per-model:**
```ts
risk_profile: z.object({
  budgetary:      { level: RiskLevel, note: z.string().min(1).max(180), source_refs: z.array(...) },
  implementation: { level: RiskLevel, note: z.string().min(1).max(180), source_refs: z.array(...) },
  dependency:     { level: RiskLevel, note: z.string().min(1).max(180), source_refs: z.array(...) },
  reversibility:  { level: RiskLevel, note: z.string().min(1).max(180), source_refs: z.array(...) },
})
```

**Aggregated (ordinal treatment per category):**
```ts
risk_profile: Record<RiskCategoryKey, {
  modal_level: RiskLevel | null,
  level_interval: [RiskLevel, RiskLevel],  // ordered low < limited < moderate < high
  note: z.string().min(1).max(180),
  supported_by: Array<ModelIdentifier>,
  dissenters: Array<ModelIdentifier>,
  per_model: Array<{ model: ModelIdentifier, level: RiskLevel, note: z.string() }>,
  human_edit: z.boolean().optional(),
}>
```

**Symmetry:** every candidate × every dimension × every category present.
No category may be omitted. `note` describes the mechanism in measurement
prose.

**No cardinal composition.** The existing `execution_risks[]` remains
unchanged (it carries `probability` and `severity` as independent
confidence values), and the new `risk_profile` is its own ordinal layer.
The website never composes a single "risk score" from the two.

### 3.3 `intergenerational.horizon_matrix` (new)

**Fixed rows × fixed horizons:**

```ts
const HorizonRowKey = z.enum([
  "pensions",
  "public_debt",
  "climate",
  "health",
  "education",
  "housing",
]);

const HorizonKey = z.enum([
  "h_2027_2030",   // Actifs 35–55 ans (cohort label applied at render time)
  "h_2031_2037",   // Jeunes actifs & retraités
  "h_2038_2047",   // Génération Z & Alpha
]);

const ImpactScore = z.number().int().min(-3).max(3);  // ordinal, never averaged cardinally
```

**Per-model:**
```ts
horizon_matrix: Array<{  // fixed length 6, one per HorizonRowKey
  row: HorizonRowKey,
  dimension_note: z.string().min(1).max(200),  // row-level mechanism
  cells: Record<HorizonKey, {
    impact_score: ImpactScore,
    note: z.string().min(1).max(160),
    source_refs: z.array(...),
  }>,
}>
```

**Aggregated:**
```ts
horizon_matrix: Array<{
  row: HorizonRowKey,
  dimension_note: z.string().min(1).max(200),
  cells: Record<HorizonKey, {
    modal_score: ImpactScore | null,
    score_interval: [ImpactScore, ImpactScore],  // min <= max
    note: z.string().min(1).max(160),
    supported_by: Array<ModelIdentifier>,
    dissenters: Array<ModelIdentifier>,
    per_model: Array<{ model, score: ImpactScore, note: z.string() }>,
    human_edit: z.boolean().optional(),
  }>,
  row_supported_by: Array<ModelIdentifier>,
  row_dissenters: Array<ModelIdentifier>,
}>
```

**Cohort labels** are **render-time annotations**, not schema fields.
The site maps `h_2027_2030 → "Actifs 35–55 ans"`, etc. Documented in
[`../analysis/intergenerational-audit.md`](../analysis/intergenerational-audit.md)
§"Horizon bands and cohort framing" (added by task `0081`).

**Existing fields preserved.** `impact_on_25yo_in_2027` and
`impact_on_65yo_in_2027` remain. They power the secondary "comparison"
block below the matrix.

### 3.4 `positioning[axis].per_model` (new, aggregated only)

```ts
per_model: Array<{
  model: ModelIdentifierSchema,
  score: PositioningScoreSchema,           // -5..+5 integer
  reasoning: z.string().min(1),
}>
```

**Why additive.** The existing aggregated positioning carries
`consensus_interval`, `modal_score`, and `dissent[]` (dissenters only).
Non-dissenting models' positions are implicit. To render a selectable
per-model radar we need the complete list.

**Non-averaging guardrail stays.** No `score` field at the axis level.
Per-model scores are nested under `per_model[]` and are the raw inputs,
not an aggregate.

### 3.5 `schema_version` bump

Both per-model `AnalysisOutputSchema` and `AggregatedOutputSchema` bump to
`"1.1"`. The existing version field already gates migrations. Test-omega
gets regenerated in task `0083`.

---

## 4. Prompt changes (v1.1)

### 4.1 `prompts/analyze-candidate.md`

Three new subsections added to the "Output structure" section:

1. **Dimension headline** — "After writing `summary`, distill a ≤140-char
   headline describing the central policy claim of this dimension.
   Measurement, not advocacy."
2. **Risk profile** — "For each dimension, rate four fixed risk
   categories (budgetary / implementation / dependency / reversibility) on
   a 4-level ordinal scale (low / limited / moderate / high). Each cell
   carries a ≤180-char note describing the mechanism."
3. **Horizon matrix** — "For six fixed domains (pensions, public_debt,
   climate, health, education, housing) × three fixed horizons
   (2027–2030, 2031–2037, 2038–2047), emit an integer impact score in
   [−3, +3] and a ≤160-char note. The score reflects the **estimated net
   effect of the program** on that domain over that horizon; it is not an
   ideology signal. `0` means 'no material change from the counterfactual
   in this horizon'. Use `−3 / +3` only for transformative effects
   documented in sources.md. `Program does not specify` → score `0`, note
   documenting the absence."

Editorial reminder block at the end reiterates measurement framing with
banned words ("catastrophe", "sacrifice", etc. — see
[`intergenerational-audit.md`](../analysis/intergenerational-audit.md)
§"Disallowed language").

### 4.2 `prompts/aggregate-analyses.md`

Three new synthesis sections:

1. For `headline`: "Produce a single synthesized `text` closest to the
   plurality phrasing; preserve per-model originals in `per_model`."
2. For `risk_profile`: "For each category, emit `modal_level` (plurality
   across successful models), `level_interval` (min / max on the ordered
   scale low < limited < moderate < high), and carry each model's level +
   note verbatim in `per_model[]`. Synthesize the aggregated `note` from
   the best-supported reasoning."
3. For `horizon_matrix`: "For each cell, emit `modal_score` (integer
   plurality in [−3, +3]; `null` if no plurality), `score_interval` (min /
   max), `supported_by` / `dissenters`, and per-model scores + notes."

Reminder that **ordinal scores are never cardinally averaged** (pattern
already documented for positioning).

### 4.3 Copilot-agent prompt files

`.github/prompts/analyze-candidate-via-copilot.prompt.md` and
`.github/prompts/aggregate-analyses-via-copilot.prompt.md` load the
canonical `prompts/*.md` bytes verbatim (per
[`data-pipeline/analysis-modes.md`](../data-pipeline/analysis-modes.md)).
No edits needed — but fresh SHA256s are committed.

### 4.4 `prompts/CHANGELOG.md`

A "1.1 (2026-04-xx)" entry documents the additive fields and the
editorial reminders. Hash files refreshed: `prompts/analyze-candidate.sha256.txt`,
`prompts/aggregate-analyses.sha256.txt`.

---

## 5. Website component specs

### 5.1 `<PositioningRadar>` — per-model selectable (Point 1)

**Current.** A single consensus polygon, no per-model overlay.

**Target.** The consensus polygon remains the default. A model legend
becomes a **selector**: clicking a model toggles a colored outline-only
polygon for that model on top of the consensus. Multiple models may be
enabled simultaneously. "Tous les modèles" / "Aucun modèle" shortcuts.
Consensus is always visible (cannot be disabled).

**Data contract.** `deriveRadarShape` gains a `perModel` dimension:

```ts
export interface RadarShape {
  axes: RadarAxis[];
  models: Array<{
    id: string;                        // stable ModelIdentifier
    label: string;                     // display name
    values: Record<AxisKey, number>;   // −5..+5 integer
    colorToken: string;                // from site/lib/model-color.ts
  }>;
}
```

Fed by the new `positioning[axis].per_model` list.

**Rendering.** Still pure SVG for the consensus. Per-model polygons are
SVG `<polygon fill="none" stroke>` overlays at reduced opacity. Client
component (`"use client"`) for the toggle state.

**Editorial.** Per-model polygons are styled to be *visibly secondary* to
the consensus (thinner stroke, lower opacity) — the aggregated view stays
the headline. No cardinal averaging introduced: the per-model values are
the same integers already stored per axis.

### 5.2 `<DomainesSection>` — headline list with inline deep dive (Point 2)

**Current.** 5-tile compact grid; deep-dive panel appears below when a
tile is clicked.

**Target.** A vertical list (one row per dimension) with:

- `GradeBadge` (consensus)
- Dimension label (e.g. "Finances publiques")
- `DissentChip` (⚡ N) when grade dissent exists — reuses existing
  tooltip
- `headline` line (≤140 chars)
- Linear confidence bar (replaces the dot cluster as the headline visual)
- Per-model grade micro-row (e.g. "C+ · C · C− · C+ · D+")
- Chevron to expand

When a row is expanded, the **existing `DimensionDeepDive` content** is
rendered inline, indented under the row — not collapsed to a separate
panel below the grid. Multiple rows may be expanded simultaneously.

**Visual ref:** `analyse-par-domaine.PNG` (collapsed state) and
`analyse-par-domaine-no-active-dimension.PNG` (current state we are
replacing).

**Data.** Reads `aggregated.dimensions[k].headline.text`,
`.grade.consensus`, `.grade.dissent`, `.confidence`. Deep-dive inherits
from existing `DimensionDeepDive` unchanged.

### 5.3 `<IntergenSection>` — horizon matrix primary, 25yo/65yo secondary (Point 3)

**Current.** `IntergenSplitPanel` (25yo / 65yo) is the main visual.

**Target.** Two stacked blocks:

1. **Primary** — `<IntergenHorizonTable>`, new widget. 6 rows × 3 columns.
   Each cell renders:
   - Ordinal impact score (`−3` to `+3`) as a colored pill with the
     number visible (color supplementary).
   - A mini-bar visual proportional to `|modal_score|` (length only —
     still not a cardinal statement about magnitude *between* cells, just
     within a cell).
   - Dissent badge when `dissenters.length > 0`.
   - Tooltip on hover reveals per-model scores + notes.
   Row labels, column labels (with cohort annotation), and a legend
   (`Très négatif / Négatif / Neutre / Positif / Très positif`).

2. **Secondary** — existing `IntergenSplitPanel` (25yo / 65yo) rendered
   below under a "Comparaison individuelle" heading, plus the existing
   `net_transfer_direction` + `magnitude_estimate` header and reasoning /
   sources blocks.

**Visual ref:** `impact-intergénérationnel.PNG`.

**Editorial.** The matrix is **measurement**. Column labels are
time-range-first, cohort-as-annotation (e.g. "2027–2030 · Actifs 35–55
ans"). Legend text is neutral. A lead paragraph reminds the reader that
scores reflect *estimated net effect*, not ideology.

### 5.4 `<RisquesSection>` — matrix primary, list behind drawer (Point 4)

**Current.** Per-risk expandable table (the entire contents of
`dimensions[k].execution_risks[]` across all 5 dimensions). Dense.

**Target.**

1. **Primary** — `<RiskSummaryMatrix>`, new widget. 5 rows (dimensions) ×
   4 columns (Budgétaire / Mise en œuvre / Dépendance / Réversibilité).
   Each cell renders `modal_level` as a colored pill with the text label
   ("Faible" / "Limité" / "Modéré" / "Élevé"). Hover reveals the `note`,
   per-model levels, and dissenters.
2. **Secondary** — a "Voir tous les risques identifiés" button opens a
   right-side `<Drawer>` containing the existing `RiskHeatmap` (per-risk
   expandable table).

**Visual ref:** `risques.PNG`.

### 5.5 `<Drawer>` primitive (new)

Reusable right-side modal. Built on `@radix-ui/react-dialog` (already a
candidate for `M_Transparency`). Features:

- Slides in from the right, width `min(90vw, 640px)`.
- `role="dialog"`, `aria-modal="true"`, `aria-labelledby` on title.
- Focus trap; ESC + backdrop click to close.
- Respects `prefers-reduced-motion` (crossfade instead of slide).
- `data-theme` passthrough.

Placed at `site/components/chrome/Drawer.tsx`. Intentionally generic —
`M_Transparency` will reuse it.

---

## 6. Integration plan

Tasks flow:

```
0081 Schema v1.1  ─┐
0082 Prompts v1.1 ─┼─> 0083 Fixtures migration ─┬─> 0084 Radar per-model
                    │                             ├─> 0085 Domaines list
                    │                             ├─> 0086 Intergen matrix
                    │                             └─> 0087 Risques matrix + Drawer
                    │                                      │
                    └────────────────────────────────────> 0088 Docs + tests close
```

- Tasks 0081 + 0082 may proceed in parallel; they don't share files.
- Task 0083 gates every UI task — the site loader calls
  `AggregatedOutputSchema.parse()` at build time, so partial rollout would
  break the site.
- Tasks 0084–0087 are independent of each other once 0083 lands.
- Task 0088 closes the milestone after all UI tasks merge.

## 7. Testing strategy

- **Schema tests** (`scripts/lib/schema.test.ts`): parse-round-trip for
  every new field. Negative cases: `low > high` interval; `per_model`
  missing required model; score outside `[−3, +3]`.
- **Fixture tests** (`scripts/lib/fixtures.test.ts` +
  `fixtures.aggregated.test.ts`): every fixture in
  `lib/fixtures/{analysis,aggregated}-output/` satisfies v1.1.
- **Prompt-contract tests** (`scripts/lib/prompt-contract*.test.ts`):
  refreshed SHA256s match checked-in hash files.
- **Site unit tests:** derivation functions for radar per-model shape,
  horizon-matrix cell rendering, risk-matrix cell rendering.
- **Site integration test** (`site/app/candidat/[id]/page.test.tsx`):
  full candidate page renders without error from `test-omega`; smoke test
  asserts at least one row visible in each new widget.
- **Editorial regression** (already in place via prompt-contract): banned
  advocacy words absent from fixtures.

## 8. Success metrics

- Each of the 4 sections renders as screenshot-worthy (qualitative review
  against prototype screenshots attached to spike 0080).
- Lighthouse / CLS unchanged (no layout shift from async data).
- `pnpm --filter site build` succeeds with `test-omega` at v1.1.
- All existing tests green; new tests cover the additive schema surface.
- `aggregated.json` for `test-omega` regenerated and human-reviewed.

## 9. Open questions

- **Cohort label wording:** the prototype uses "Actifs 35–55 ans / Jeunes
  actifs & retraités / Génération Z & Alpha". These are narrative anchors
  that overlap imperfectly with the calendar horizons. Keep as-is per
  prototype; document the approximation in the section lead paragraph.
- **Risk-level color palette:** we need a 4-level ordinal palette distinct
  from the 5-level OKLCH one used by `ConfidenceDots`. Proposed: greens
  (low / limited) → oranges (moderate) → reds (high), consistent with
  `risques.PNG`. Finalized in task `0087`.
- **Drawer library:** `@radix-ui/react-dialog` is proposed because it is
  already transitive in the workspace and unstyled (we own the visuals).
  Alternative would be headless UI — same outcome, different footprint.
  Decision: radix-ui (smaller surface for our Tailwind setup). Revisit if
  bundle size spikes.

## 10. Related specs

- [`visual-components.md`](visual-components.md) — amended to v1.2 by task
  `0088`.
- [`nextjs-architecture.md`](nextjs-architecture.md) — §4 inventory
  updated by task `0088`.
- [`../analysis/output-schema.md`](../analysis/output-schema.md) — v1.1 by
  task `0081`.
- [`../analysis/aggregation.md`](../analysis/aggregation.md) — v1.1 by
  task `0081`.
- [`../analysis/intergenerational-audit.md`](../analysis/intergenerational-audit.md)
  — v1.1 by task `0081` (horizon band annotation).
- [`../analysis/editorial-principles.md`](../analysis/editorial-principles.md)
  — unchanged; this milestone operates strictly within its guardrails.
