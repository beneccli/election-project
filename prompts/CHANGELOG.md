# Prompts Changelog

All changes to files in `prompts/` are recorded here. See
[`prompts/README.md`](README.md) for the versioning rules.

## 2026-04-22 — aggregate-analyses.md 1.2

**Change:** Additive aggregation rules for the categorical
`overall_spectrum` label emitted by the v1.2 analyst prompt.

- New §4.3.bis "Overall spectrum label — modal + distribution + dissent":
  modal plurality, `label_distribution` counts, `modal_label = null` on
  tied/all-distinct, exhaustive `per_model[]`, `dissent[]` for every
  non-modal model, "never promote a label no model emitted", and
  `anchor_narrative` as a distillation that admits no new evidence.
- §4.3 closing paragraph extended so the "never average" prohibition
  covers the categorical spectrum label in addition to the 5 per-axis
  scores.
- §8 JSON skeleton updated: `schema_version "1.2"`, `prompt_version
  "1.2"`, new `<AggregatedOverallSpectrum>` block under `positioning`,
  and `agreement_map.positioning_consensus.overall_spectrum` entry.
- Frontmatter: `version: "1.2"`, `updated: 2026-04-22`, related spec
  added.

**Why:** M_PoliticalSpectrum — the aggregator must emit
`positioning.overall_spectrum` with the same ordinal discipline already
applied per-axis: modal plurality, full per-model roll-call, null on
tied modes, no arithmetic summary. `inclassable` is a regular enum
value, not a tied-mode fallback.

**Impact:** Aggregated outputs produced with this prompt validate
against `AggregatedOutputSchema` v1.2. `agreement_map.positioning_consensus`
is now tightened to a `.strict()` object with 6 required keys (5 axes +
`overall_spectrum`). Existing §4.3 per-axis instructions were **not**
rewritten — the change is strictly additive at §4.3.bis.

## 2026-04-22 — analyze-candidate.md 1.2

**Change:** Additive §9.6 "Overall spectrum label" instructing the analyst
to emit `positioning.overall_spectrum` after the five axis placements.

- New sub-section §9.6 with the 8-value enum (`extreme_gauche`, `gauche`,
  `centre_gauche`, `centre`, `centre_droit`, `droite`, `extreme_droite`,
  `inclassable`), derivation rules (economic + social/cultural primary,
  ecological + sovereignty tiebreak, institutional orthogonal), the
  `derived_from_axes` non-empty requirement, the `inclassable` escape
  hatch, two worked examples (clean placement + `inclassable`), and the
  `confidence ≤ min(axis confidences)` ceiling.
- §5 "Required output structure" updated to list `overall_spectrum`
  under `positioning` and to reference `schema_version: "1.2"`.
- Frontmatter bumped to `version: "1.2"` + `updated: 2026-04-22`.
- Related spec added: `docs/specs/analysis/political-spectrum-label.md`.

**Why:** M_PoliticalSpectrum — surface a single, stable categorical
spectrum label on the Hero / comparison page while preserving the
evidence-first, ordinal-per-axis derivation rules. The label is derived
from the axes, never from party reputation, and is never averaged
numerically (see schema v1.2).

**Impact:** Analyses produced with this prompt validate against
`AnalysisOutputSchema` v1.2. Older v1.1 analyses remain valid under
their pinned prompt hash but cannot be re-validated against v1.2
without re-running. Existing §9 axis instructions were **not** rewritten
— the change is strictly additive.

## 2026-04-20 — aggregate-analyses.md 1.1

**Change:** Additive synthesis rules for the v1.1 output layer used by the
candidate-page polish milestone. New aggregation sections:

- §4.3 addendum — require a complete `per_model[]` roll-call on every
  positioning axis (still ordinal, still no aggregated `score` field).
- §4.10 Headline synthesis — plurality `text` (≤140 chars), `supported_by`
  / `dissenters`, and verbatim `per_model[]` for every dimension.
- §4.11 Risk-profile aggregation — four fixed categories (`budgetary`,
  `implementation`, `dependency`, `reversibility`), ordinal scale
  `low < limited < moderate < high`, modal + ordered `level_interval` +
  verbatim per-model list. Arithmetic mean explicitly forbidden.
- §4.12 Horizon-matrix aggregation — six fixed rows × three horizons,
  integer `impact_score` in `[-3, +3]`, modal + `score_interval` +
  verbatim per-model list. Arithmetic mean explicitly forbidden.
- JSON skeleton and field-level constraints updated to `schema_version
  "1.1"` / `prompt_version "1.1"` with the new aggregated shapes.

**Why:** The candidate page (`M_CandidatePagePolish`) surfaces a headline,
a risk-profile radar, and a horizon matrix. These UI surfaces need an
aggregated shape that preserves per-model dissent (radar overlay), ordinal
structure (no false averages), and the existing inline-provenance pattern.

**Impact:** Aggregated outputs produced with this prompt validate against
`AggregatedOutputSchema` v1.1. v1.0 outputs are not forward-compatible —
existing aggregated fixtures were regenerated in task 0081 (schema v1.1).
The raw-output transparency artifact is untouched.

**Backward compat:** Breaking at the schema level (new required fields).
The `schema_version` literal rejects `"1.0"`, surfacing stale outputs
loudly rather than silently. Per §4.11 / §4.12, aggregation MUST NOT
average risk levels or horizon scores — both are ordinal.

**Related specs:**
- `docs/specs/analysis/aggregation.md` (Stable, v1.1)
- `docs/specs/analysis/output-schema.md` (Stable, v1.1)
- `docs/specs/analysis/intergenerational-audit.md` (Stable, v1.1)
- `docs/specs/website/candidate-page-polish.md` (Stable)

## 2026-04-20 — analyze-candidate.md 1.1

**Change:** Additive v1.1 output fields consumed by the candidate-page
polish milestone. New sections in the prompt:

- §5 JSON skeleton bumped to `schema_version: "1.1"` with `headline`,
  `risk_profile`, and `horizon_matrix` fields.
- §10 — field-by-field instructions for the three new outputs: 140-char
  headline per dimension; four-category `risk_profile` on the ordinal
  scale `low < limited < moderate < high`; 6×3 `horizon_matrix` with
  integer `impact_score` in `[-3, +3]` (`0` = no change, `±3` reserved
  for transformative effects) plus silent-cell rule.
- §11 — measurement-framing reminder pointing at the authoritative
  disallowed-language lists in `editorial-principles.md §3` and
  `intergenerational-audit.md`.

**Why:** The polished candidate page needs a screenshot-worthy headline,
a risk radar, and a long-horizon matrix. Producing these downstream would
require the aggregator to invent structure; producing them here keeps the
raw-output transparency artifact complete. See `candidate-page-polish.md`.

**Impact:** Analyses produced with this prompt validate against
`AnalysisOutputSchema` v1.1. v1.0 outputs stay valid against their own
snapshotted schema but cannot be mixed with v1.1 aggregated outputs.
Existing per-model fixtures were regenerated in task 0081.

**Backward compat:** Breaking at the schema level. The `schema_version`
literal rejects `"1.0"`, so stale runs fail loudly. The six dimension
clusters, five positioning axes, grade scale, and editorial rules are
unchanged.

**Related specs:**
- `docs/specs/analysis/analysis-prompt.md` (Stable, v1.1)
- `docs/specs/analysis/output-schema.md` (Stable, v1.1)
- `docs/specs/analysis/intergenerational-audit.md` (Stable, v1.1)
- `docs/specs/website/candidate-page-polish.md` (Stable)

## 2026-04-19 — aggregate-analyses.md 1.0

**Change:** First production version of the meta-LLM aggregation prompt.
Replaces the `0.1` placeholder shipped with M_DataPipeline that produced
only a minimal consensus/dissent/flagged structure.

**Why:** M_Aggregation spike `0030` finalized the aggregated output schema
(ordinal positioning with `consensus_interval` + `modal_score` + explicit
`dissent[]`, inline `supported_by` / `dissenters` provenance on every
claim, `flagged_for_review[]` with `resolution` enum, `coverage_warning`,
and `agreement_map.positioning_consensus`). Task `0032` implemented the
Zod schema; task `0033` (this change) implements the matching prompt.

**Impact:** First real aggregation prompt — no prior production version
to compare with. All future aggregation runs use this prompt; the SHA256
is recorded per run in `versions/<date>/metadata.json` under
`aggregation.prompt_sha256`.

**Backward compat:** Not applicable (no prior stable version). Outputs
from the `0.1` placeholder are not schema-compatible with this version
and must be regenerated.

**Related specs:**
- `docs/specs/analysis/aggregation.md` (Stable)
- `docs/specs/analysis/output-schema.md` (Stable)
- `docs/specs/analysis/political-positioning.md` (Stable)
- `docs/specs/analysis/intergenerational-audit.md` (Stable)
- `docs/specs/analysis/editorial-principles.md` (Stable)

## 2026-04-19 — analyze-candidate.md 1.0

**Change:** Initial production version of the per-candidate analysis
prompt. Replaces the placeholder shipped with M_DataPipeline.

**Why:** M_AnalysisPrompts milestone (spike `0020`) finalized the 9-section
prompt design, the Zod output schema, the 5-axis positioning methodology
with fixed anchor sets, the 6 dimension clusters, and the
intergenerational audit measurement framework. Task 0023 implements the
prompt matching those specs.

**Impact:** First real analysis prompt — no prior production version to
compare with. All future runs use this prompt; the SHA256 is recorded per
run in `versions/<date>/metadata.json`.

**Backward compat:** Not applicable (no prior stable version).

**Related specs:**
- `docs/specs/analysis/analysis-prompt.md` (Stable)
- `docs/specs/analysis/output-schema.md` (Stable)
- `docs/specs/analysis/dimensions.md` (Stable)
- `docs/specs/analysis/political-positioning.md` (Stable)
- `docs/specs/analysis/intergenerational-audit.md` (Stable)
- `docs/specs/analysis/editorial-principles.md` (Stable)
