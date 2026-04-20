---
id: "0080"
title: "Spike: Candidate page polish — screenshot-worthy sections"
type: spike
status: active
priority: high
created: 2026-04-20
milestone: M_CandidatePagePolish
spec: docs/specs/website/candidate-page-polish.md
context:
  - site/app/candidat/[id]/page.tsx
  - site/components/sections/PositionnementSection.tsx
  - site/components/sections/DomainesSection.tsx
  - site/components/sections/IntergenSection.tsx
  - site/components/sections/RisquesSection.tsx
  - site/components/widgets/PositioningRadar.tsx
  - site/components/widgets/IntergenSplitPanel.tsx
  - site/components/widgets/RiskHeatmap.tsx
  - scripts/lib/schema.ts
  - docs/specs/analysis/output-schema.md
  - docs/specs/analysis/aggregation.md
  - docs/specs/analysis/intergenerational-audit.md
  - docs/specs/website/visual-components.md
  - docs/specs/website/nextjs-architecture.md
  - prompts/analyze-candidate.md
  - prompts/aggregate-analyses.md
  - Candidate Page.html
depends_on: []
---

## Goal

Phase 2's first two milestones (`M_WebsiteCore`, `M_VisualComponents`) shipped
a candidate page that follows the `Candidate Page.html` prototype closely,
but four sections diverged from the prototype under the weight of real
aggregated data. The sections now present information correctly but are not
*screenshot-worthy* — a stated product goal (each section should stand alone
as a shareable visual).

This spike defines a new milestone — **M_CandidatePagePolish** — inserted
in Phase 2 before `M_Transparency`, that:

1. Extends the **analysis** and **aggregated** schemas with the minimum new
   fields required to render the prototype layouts.
2. Updates the analysis + aggregation prompts to produce those fields.
3. Redesigns four sections (Positionnement, Domaines, Intergénérationnel,
   Risques) to match the prototype while continuing to honor editorial
   principles.
4. Adds a reusable right-side `Drawer` primitive (usable also by
   `M_Transparency`).

## Research Questions

1. **Positionnement radar (Point 1):** can we expose per-model positions to
   the radar without violating the "no cardinal averaging" rule? Where does
   per-model data live today?
2. **Domaines default view (Point 2):** what is the minimum concise
   "headline" we can add to `dimensions[k]` without losing the existing
   `summary`? Is there dissent-preservation tension in the new display?
3. **Intergénérationnel table (Point 3):** how do we add a domain × horizon
   matrix while keeping impact scores ordinal and dissent visible? How does
   the 3-horizon / 3-cohort mapping from the prototype align with the
   `intergenerational-audit.md` "2027–2047 central horizon" framing?
4. **Risques table (Point 4):** can we synthesize a per-dimension 4-risk-
   category summary (Budgétaire / Mise en œuvre / Dépendance / Réversibilité)
   from the existing `execution_risks[]` or must it be a new first-class
   field on the analysis schema?
5. **Schema version:** what schema_version bump is required? Are these
   additive fields only, or do any existing fields change shape?
6. **Fixture migration:** how do we avoid a long period where `test-omega`
   (our only candidate) is out-of-schema during the rollout?
7. **Editorial principles at stake:** each of the 4 points either expands a
   quantitative surface (risk of cardinal averaging) or adds per-model
   detail (risk of cherry-picking). How do we hold the line?

## Existing Context

- Aggregated output schema ([`scripts/lib/schema.ts`](../../scripts/lib/schema.ts))
  already carries per-axis `dissent: {model, position, reasoning}[]`. It does
  **not** carry a full per-model position list (non-dissenters are
  implicit), nor any domain × horizon matrix.
- `dimensions[k].summary` is 2–3 sentences (too long for a list row).
- `dimensions[k].execution_risks[]` is free-form and does not provide a
  consistent per-dimension categorization across candidates.
- Intergenerational data is structured as `impact_on_25yo_in_2027` +
  `impact_on_65yo_in_2027`, which renders cleanly as a split panel but has
  no time dimension.
- Prompts are **versioned artifacts** (`prompts/*.sha256.txt`); changes
  require a bump in `prompts/CHANGELOG.md` and new hash files.
- Aggregation runs currently via Copilot-agent mode
  (`.github/prompts/aggregate-analyses-via-copilot.prompt.md`); the manual
  bundle producer is `scripts/prepare-manual-aggregation.ts`.
- Editorial principles at stake:
  - **Dissent preserved, not averaged** → new per-axis, per-model, per-
    horizon, per-risk-category fields must keep ordinal aggregation with
    explicit `supported_by`/`dissenters` inline provenance.
  - **Symmetric scrutiny** → the 4 fixed risk categories and the 3 fixed
    horizons must be filled for every candidate. "No data" is a finding,
    never a hidden row.
  - **Measurement over indictment** → new intergen matrix cell copy must
    describe the mechanism, never advocate.

## Design summary (decisions this spike takes)

### Schema v1.1 — additive only

The per-model analysis schema and the aggregated schema each gain four
additive fields. No existing field changes shape. `schema_version` bumps
from `"1.0"` to `"1.1"`.

Per-model (`AnalysisOutputSchema`):

1. `dimensions[k].headline: string` — ≤140 char one-liner distilling the
   dimension's central policy claim. Distinct from `summary` (2–3 sentences,
   kept verbatim).
2. `dimensions[k].risk_profile: { budgetary, implementation, dependency, reversibility }`
   — each `{ level: "low"|"limited"|"moderate"|"high", note: string, source_refs: string[] }`.
   Four fixed keys, every dimension × every candidate. Note is measurement
   prose (≤180 chars); `level` is the ordinal signal.
3. `intergenerational.horizon_matrix: HorizonRow[]` — fixed 6 rows
   (`pensions`, `public_debt`, `climate`, `health`, `education`, `housing`),
   each carrying 3 fixed horizon cells (`h_2027_2030`, `h_2031_2037`,
   `h_2038_2047`), each cell `{ impact_score: -3..+3 (int), note: string, source_refs: string[] }`.
   Scores are ordinal, never cardinally averaged at aggregation. A
   `dimension_note` string per row documents the row-level mechanism.
4. `positioning[axis]` unchanged per-model (already carries a per-model
   integer `score`).

Aggregated (`AggregatedOutputSchema`):

1. `dimensions[k].headline: string` with inline `supported_by`/`dissenters`
   wrapped in a provenance object (see spec §3).
2. `dimensions[k].risk_profile.<category>: { modal_level, level_interval,
   note, supported_by, dissenters, per_model: Array<{model, level, note}> }`.
   Ordinal: `modal_level` + interval across successful models + verbatim
   per-model preserved.
3. `intergenerational.horizon_matrix[row].<horizon>: { modal_score,
   score_interval: [int, int], note, supported_by, dissenters, per_model:
   Array<{model, score, note}> }`. Ordinal, mirrors positioning treatment.
4. `positioning[axis].per_model: Array<{ model, score: -5..+5, reasoning }>`
   — **complete** list (includes non-dissenters). This is additive: the
   existing `modal_score`, `consensus_interval`, `dissent[]` keys stay.
   Required so the radar can overlay every model.

**Why ordinal modal + interval + per-model verbatim everywhere?** This is
the exact pattern already used for political positioning (see
`aggregation.md` §"Positioning aggregation (Q5 / Q6)") — proven, enforced
by `.strict()`, never composed into a cardinal score. We reuse it for risk
levels and horizon impacts.

### Prompts v1.1

- `prompts/analyze-candidate.md` gains three new output-structure sections
  documenting the new fields, with measurement-framing reminders on each.
- `prompts/aggregate-analyses.md` gains synthesis rules that mirror the
  positioning ordinal rules.
- Both `.github/prompts/analyze-candidate-via-copilot.prompt.md` and
  `.github/prompts/aggregate-analyses-via-copilot.prompt.md` inherit the
  changes automatically (they load the canonical prompt bytes verbatim per
  `M_AnalysisModes` — no edits needed beyond refreshed hash files).
- `prompts/CHANGELOG.md` documents the version bump; new
  `prompts/*.sha256.txt` files generated.

### Fixture migration

`candidates/test-omega/` is the only candidate. It gets migrated in-place:

- `raw-outputs/*.json` regenerated via
  `scripts/prepare-manual-analysis.ts` re-run in Copilot-agent mode (the
  new prompt will produce v1.1 shape).
- `aggregated.json` regenerated via `prepare-manual-aggregation.ts`
  followed by the Copilot aggregator prompt.
- `lib/fixtures/analysis-output/*` and `lib/fixtures/aggregated-output/*`
  hand-updated to satisfy v1.1. The fixtures are already the shape-of-
  truth for unit tests, so they are updated first; site components are
  updated after the fixtures are green.

Migration happens in task `0083` as a single atomic change.

### Website component changes

For each point: a new or restructured widget + a section redesign. The
existing deep-dive content is **preserved**, never removed — it is
relocated to an expanded row or a drawer so the default view is
screenshot-worthy.

See full spec at [`docs/specs/website/candidate-page-polish.md`](../../docs/specs/website/candidate-page-polish.md).

## Editorial-principles checklist

| Principle | How this milestone honors it |
|---|---|
| Analysis not advocacy | Horizon-matrix and risk-profile `note` strings are measurement prose; prompt enforces. |
| Symmetric scrutiny | 4 risk categories × 5 dimensions, and 6 horizon rows × 3 horizons, are **fixed** — every candidate fills every cell (or emits `"Program does not specify"` with `low` confidence). |
| Measurement over indictment | Horizon matrix uses signed integer impact scores; the text layer describes the mechanism, not the moral weight. |
| Dissent preserved | Every new aggregated field carries `supported_by`/`dissenters`; ordinal modals + intervals are kept; per-model verbatim preserved. |
| Pinned model versions + prompt hashes | Prompt files get fresh SHA256s; `schema_version` bumps to `1.1`; `AGGREGATOR_MODEL` unchanged. |

**No red-flag breaches identified.** The design does not:
- Average positioning (or any ordinal score) cardinally.
- Introduce a candidate-specific prompt branch.
- Hide raw outputs / prompts / sources.
- Allow publishing without reviewed `sources.md`.
- Use advocacy framing anywhere in section copy.

## Deliverables

1. **Spec:** [`docs/specs/website/candidate-page-polish.md`](../../docs/specs/website/candidate-page-polish.md).
2. **Schema / spec amendments:** bump `output-schema.md` → v1.1,
   `aggregation.md` → v1.1, `intergenerational-audit.md` → v1.1,
   `visual-components.md` → v1.2. Handled by individual tasks below, not by
   this spike itself.
3. **Backlog tasks** (`tasks/backlog/M_CandidatePagePolish/`):
   - `0081` — Schema v1.1 (Zod + spec updates)
   - `0082` — Prompts v1.1 (analyze + aggregate) + hashes + CHANGELOG
   - `0083` — Migrate `test-omega` to v1.1 (raw-outputs + aggregated +
     fixtures)
   - `0084` — Per-model `PositioningRadar` selector (Point 1)
   - `0085` — `DomainesSection` redesign — headline list + inline deep
     dive + confidence bars (Point 2)
   - `0086` — `IntergenHorizonTable` widget + restructured
     `IntergenSection` (Point 3)
   - `0087` — `RiskSummaryMatrix` widget + right-side `Drawer` primitive +
     restructured `RisquesSection` (Point 4)
   - `0088` — Update `visual-components.md` v1.2 and
     `nextjs-architecture.md` §4 inventory; refresh integration tests
4. **ROADMAP update** — insert `M_CandidatePagePolish` in Phase 2,
   immediately before `M_Transparency`.

## Acceptance Criteria

- [x] Spec document created in `docs/specs/website/candidate-page-polish.md`
- [x] 8 tasks created in `tasks/backlog/M_CandidatePagePolish/`
- [x] Tasks cover all four numbered improvements
- [x] Each task has clear acceptance criteria and references the spec
- [x] No circular dependencies (schema → prompt → fixtures → UI → docs)
- [x] ROADMAP.md updated with milestone
- [x] Editorial principles reviewed; no red-flag breaches
- [x] Spec linked from `docs/specs/README.md`

## Notes

- The existing `RiskHeatmap` per-risk table is **kept** — it becomes the
  "deep dive" view behind a Drawer. The Drawer primitive is designed to
  be reusable by `M_Transparency` (raw-outputs / prompts / agreement map).
- The 3-horizon cohort framing in the prototype is a narrative anchor
  used only for column labels. The schema encodes time windows by year
  range (`h_2027_2030`, `h_2031_2037`, `h_2038_2047`); cohort labels are
  applied at render time and documented in the intergen audit spec.
- Fictional candidate `test-omega` must go out-of-schema only briefly —
  migration task `0083` is the single hand-off between the schema and
  the UI work.
