---
id: "0030"
title: "Spike: M_Aggregation — Aggregator prompt, schema, dissent preservation, and review gate"
type: spike
status: done
priority: high
created: 2026-04-19
milestone: M_Aggregation
spec:
  - docs/specs/analysis/aggregation.md
context:
  - docs/specs/analysis/editorial-principles.md
  - docs/specs/analysis/aggregation.md
  - docs/specs/analysis/output-schema.md
  - docs/specs/analysis/political-positioning.md
  - docs/specs/analysis/intergenerational-audit.md
  - docs/specs/analysis/dimensions.md
  - docs/specs/data-pipeline/overview.md
  - prompts/aggregate-analyses.md
  - scripts/aggregate.ts
  - scripts/lib/schema.ts
  - scripts/config/models.ts
depends_on: ["0026"]
---

## Goal

Produce the canonical **cross-model aggregator prompt**, the **`AggregatedOutputSchema`** (today `z.any()`), the **human review CLI** (`scripts/review.ts`), and the end-to-end wiring that turns N per-model JSON outputs plus `sources.md` into an `aggregated.draft.json` → human review → `aggregated.json`.

This spike answers:
- What is the final wording and structure of `prompts/aggregate-analyses.md`?
- What is the exact Zod shape of `AggregatedOutputSchema`?
- Which model aggregates, and how do we avoid self-aggregation bias?
- How does dissent survive structurally (not in prose hedging)?
- How does the human review queue work mechanically (`scripts/review.ts`) without re-introducing unreviewed publication risk?
- What fixture JSON do we keep so schema and prompt changes are validated against a concrete, realistic example?

Implementation is deferred to backlog tasks. **This spike does not change prompt wording or schemas** — it finalizes the spec and writes tickets.

## Existing Context

The draft spec [`docs/specs/analysis/aggregation.md`](../../docs/specs/analysis/aggregation.md) is already substantial and correct in direction: meta-LLM aggregation, no cardinal averaging on positioning, dissent in `agreement_map`, `flagged_for_review` gated by human review. This spike resolves its open questions and freezes the schema shape.

Today:
- `scripts/lib/schema.ts` exports `AggregatedOutputSchema: z.ZodType<any> = z.any();`
- `prompts/aggregate-analyses.md` is a ~45-line placeholder (version `0.1`, status `placeholder`) producing a minimal `consensus_themes / dissent_themes / flagged_claims` shape — not the real aggregation schema.
- `scripts/aggregate.ts` already wires the flow: reads `raw-outputs/*.json` (skipping `.FAILED.json`), reads `sources.md`, calls the aggregator LLM, validates with `AggregatedOutputSchema.parse`, writes `aggregated.draft.json` + `aggregation-notes.md`, records provider/prompt hash in `metadata.json` under `aggregation.human_review_completed: false`.
- `scripts/review.ts` does **not** exist (was removed from `package.json` scripts in M_DataPipeline); `publish.ts` must gate on `metadata.aggregation.human_review_completed === true`.
- The five per-model specs are **Stable** (`output-schema.md`, `dimensions.md`, `political-positioning.md`, `intergenerational-audit.md`, `analysis-prompt.md`) — the aggregator consumes their artifact shape unchanged.

## Research Questions + Decisions

### Q1 — Aggregator model choice and rotation

**Decision: pick one designated aggregator model, recorded in `scripts/config/models.ts` as `AGGREGATOR_MODEL`. Default: `claude-opus-4-0-20250514`. The aggregator must be excluded-from or rotated-against the per-model set in a future spike, but v1 allows the same model to appear on both sides provided the per-run metadata records it.**

Rationale:
- A single, strong aggregator model is necessary for a coherent synthesis; rotating per run introduces a hidden variable.
- Self-aggregation bias (same model analyzes + aggregates) is a real concern but measurable rather than dispositive — we ship v1 and measure bias empirically on the first candidate (M_FirstCandidate) before committing to a stricter rule.
- Per-run `metadata.json` already records `aggregation.aggregator_model.exact_version` and the analysis model versions, so a later audit can always detect overlap.

**Open flag (deferred):** if M_FirstCandidate shows measurable self-aggregation drift, spike an "aggregator-disjoint-from-analysts" rule.

### Q2 — Schema-retry count

**Decision: 2 retries (3 total attempts), matching `analyze.ts`.** On persistent failure → `aggregated.FAILED.json` with `ZodError.issues[]` logged. The pipeline does **not** fall back to deterministic averaging (that would be silent editorial drift). Human is notified; build fails.

### Q3 — Minimum models required for aggregation

**Decision: hard minimum 1, soft minimum 3.** Matches today's `MIN_RECOMMENDED_MODELS = 3` constant. The site must show a visible "only N model(s) contributed" notice when `coverage` reports < 3 successful analyses. If 0 models succeeded, `aggregate.ts` throws (unchanged from today).

### Q4 — `agreement_map` granularity

**Decision: two complementary structures.**

1. A **per-claim provenance list** embedded inline on every aggregated claim: `supported_by: string[]` (model version strings) and `dissenters: string[]` when applicable. This is the raw material.
2. A **top-level `agreement_map`** summarizing:
   - `high_confidence_claims[]` — claims supported by ≥ N-1 models
   - `contested_claims[]` — claims with ≥1 dissenter
   - `coverage: Record<string, "complete" | "partial" | "failed">` — per-model participation
   - `positioning_consensus: Record<axis, { interval: [int, int], modal: int | null, dissent_count: number }>`

Rationale: inline provenance supports website transparency drawer without hydrating a separate structure; top-level summary supports methodology-level display and scripted auditing.

### Q5 — Positioning aggregation rules (reinforced)

**Decision: aggregator produces, per axis:**
- `consensus_interval: [min, max]` — tuple of integers
- `modal_score: int | null` — integer in `[-5, +5]` or `null` if no mode
- `anchor_narrative: string` — synthesis of per-model anchor comparisons
- `evidence: EvidenceRef[]` — union of all per-model evidence quotes
- `confidence: number` in `[0, 1]`
- `dissent: { model: string, position: int, reasoning: string }[]` — models placing outside `consensus_interval` or whose anchor narrative genuinely disagrees

**No `score` field at the aggregated level.** The per-model `score` lives only in `raw-outputs/`. Prevents any downstream consumer from misreading an aggregate score as cardinal. This is a **red-flag check** (cardinal averaging is explicitly forbidden by editorial principle 4).

### Q6 — Dissent threshold for positioning

**Decision: a per-model score is "dissent" iff it falls outside the modal-centred plurality interval AND the dissenting model's reasoning is preserved verbatim.** We do **not** silently widen `consensus_interval` to swallow outliers. Width of `consensus_interval` remains `max − min` across all successful models, but `dissent[]` explicitly names the outlier(s) so the website can render them separately.

### Q7 — Source contradiction flagging

**Decision: the aggregator prompt explicitly instructs:**
- Each aggregated claim must carry at least one `source_ref` unioned from the per-model outputs.
- If a claim appears in ≥1 model but the aggregator cannot find any quote in `sources.md` that supports it, the claim goes into `flagged_for_review[]` with `issue: "claim not supported by sources.md"` — it is **not** silently dropped and **not** published.
- Correlated hallucination (all models agree on something unsupported by sources) still lands in `flagged_for_review` — the aggregator is instructed to check against `sources.md`, not against model consensus.

### Q8 — Human review workflow (`scripts/review.ts`)

**Decision: minimal CLI first, no web UI in v1.**

`scripts/review.ts --candidate <id> --version <date>`:

1. Loads `aggregated.draft.json`.
2. For each item in `flagged_for_review[]`, prompts the reviewer with:
   - The claim text
   - The `issue` and `claimed_by` fields
   - Relevant excerpts from `sources.md`
   - Options: `[a]pprove / [r]eject / [e]dit / [s]kip / [q]uit`
3. Records each decision in an in-memory list; on exit writes:
   - `aggregated.json` (approved claims merged, rejected claims removed, edited claims rewritten with a `human_edit: true` flag)
   - `aggregation-notes.md` updated with a "## Flagged item resolutions" section (one row per flagged item + decision + reviewer initials + timestamp)
   - `metadata.json` — set `aggregation.human_review_completed: true`, record `review_at`, `reviewer_id` (from `--reviewer` arg or `git config user.email`)
4. Must be idempotent: re-running after partial review resumes from the next unresolved item.
5. Must refuse to write `aggregated.json` if any flagged item is still in `skipped` state.

**publish.ts gate (already partially in place):** must read `metadata.aggregation.human_review_completed` and refuse to publish unless it is `true`. The spike tightens this from a soft warning to a hard failure.

### Q9 — `aggregation-notes.md` required sections

**Decision: structured sections the aggregator (or `aggregate.ts`) always writes.**

```markdown
# Aggregation Notes — <candidate> (<version>)

## Run metadata
(models aggregated, aggregator model, prompt hash, run duration, cost)

## Coverage
(per-model: complete / partial / failed)

## Notable consensus
(3–5 bullet points with cross-model support counts)

## Notable dissent
(positioning dissent, dimension grade disagreements, contested factual claims)

## Flagged items
(to be filled by review.ts)

## Flagged item resolutions
(filled by review.ts on exit — approve / reject / edit + rationale)
```

### Q10 — Schema versioning

**Decision: aggregated output carries its own `schema_version: "1.0"` on first shipping the real schema, independent of per-model `output-schema.md` version.** Bumping per-model schema does not automatically bump aggregated schema and vice versa; cross-references tracked in each spec's "Schema versioning" section.

### Q11 — Fixtures

**Decision: ship three aggregated fixtures in `scripts/lib/fixtures/aggregated-output/`:**
- `valid-full.json` — three per-model fixture inputs → one aggregated output with consensus, dissent, flagged items all populated
- `valid-single-model.json` — only one per-model output succeeded; `coverage` shows failed siblings, `agreement_map.high_confidence_claims` is empty, site-surface warning present
- `invalid-cardinal-positioning.json` — regression fixture where positioning accidentally contains a `"score": -2.5` float average; schema must reject (tests the "positioning never cardinally averaged" guardrail at the type level)

### Q12 — Agreement map audit tooling (deferred)

**Decision: deferred to future milestone.** Cross-candidate consistency checks (detecting when the same analytical move is applied asymmetrically across candidates) are mentioned in `aggregation.md §Future considerations`. Not in scope for M_Aggregation v1.

## Deliverables

### 1. Spec finalization (Draft → Stable)

- [ ] `docs/specs/analysis/aggregation.md` — resolve "to be finalized by M_Aggregation spike" header, incorporate Q1–Q12 decisions, mark **Stable**. Add explicit schema appendix mirroring the Zod definition.
- [ ] `docs/specs/README.md` — flip `aggregation.md` status entry from `[Draft]` to `[Stable]`.
- [ ] `docs/specs/data-pipeline/overview.md` — already describes the review.ts gate; confirm wording matches Q8 (hard publish-gate), edit only if drift exists.

### 2. Backlog tasks

Created in [`tasks/backlog/M_Aggregation/`](../backlog/M_Aggregation/):

- `0031` — Finalize `aggregation.md` (promote Draft → Stable, incorporate all spike decisions, update `specs/README.md`)
- `0032` — Implement `AggregatedOutputSchema` in `scripts/lib/schema.ts` (replace `z.any()`)
- `0033` — Write the full `prompts/aggregate-analyses.md` (replace placeholder; bump version `0.1` → `1.0`, change status `placeholder` → `stable`)
- `0034` — Aggregator fixtures + round-trip tests (`valid-full`, `valid-single-model`, `invalid-cardinal-positioning`)
- `0035` — Prompt-contract tests for `aggregate-analyses.md` (required sections, stable hash, no candidate-specific branches, forbids cardinal positioning)
- `0036` — Implement `scripts/review.ts` (human review CLI) + `publish.ts` hard-gate on `human_review_completed`
- `0037` — End-to-end mock-provider test: analyze → aggregate → review → publish with the real schema

### 3. ROADMAP update

- [ ] Mark M_Aggregation as **In Progress**
- [ ] Add deliverable: `scripts/review.ts` (human review CLI) and `publish.ts` hard-gate
- [ ] Document scope boundary (below)

## Scope boundary — what this milestone does NOT cover

- **Live LLM aggregation runs against a real candidate** — that is M_FirstCandidate.
- **Self-aggregation bias measurement / aggregator rotation rule** — deferred to a follow-up spike after M_FirstCandidate produces data.
- **Web UI for review** — CLI only in v1.
- **Cross-candidate symmetry audit tooling** — deferred (Q12).
- **Deterministic / programmatic aggregation fallback (Option B)** — `aggregation.md §Future considerations`.
- **Website rendering of `agreement_map` and positioning intervals** — that is M_VisualComponents + M_Transparency.
- **Diff visualization between aggregated versions** — that is M_UpdateWorkflow.

## Editorial Principles Check

- ✅ **Analysis, not advocacy.** Aggregator prompt will be written in measurement-framing; no moral verbs. Schema fields stay factual (`consensus_interval`, `dissent[]`, `flagged_for_review[]`). No `"tone"` or `"severity"` style editorial fields.
- ✅ **Symmetric scrutiny.** Aggregator prompt contains zero candidate-specific instructions. Every per-model output is consumed by the same logic. Schema shape is identical across candidates.
- ✅ **Measurement over indictment.** Aggregated intergenerational section retains `quantified` fields and `narrative_summary` — no moral-verb injection during aggregation. Prompt explicitly forbids introducing new adjectives not present in source evidence.
- ✅ **Dissent preserved.** Two complementary structures (inline `supported_by` / `dissenters` and top-level `agreement_map`) both carry raw dissent signal. Positioning dissent is verbatim (Q6). No cardinal averaging (Q5).
- ✅ **Radical transparency.** Aggregator prompt SHA256 is hashed and recorded per run. `aggregated.draft.json` is a public artifact; `aggregation-notes.md` documents every flagged-item resolution with reviewer identity and timestamp. Raw `raw-outputs/*.json` remain untouched throughout aggregation.

## Red-flag review

Re-read against the red-flag list in `.github/prompts/create-spike.prompt.md`:

- ❌ Publishing without reviewed `sources.md` — no, unchanged from M_DataPipeline.
- ❌ Publishing without reviewed aggregated output — **actively tightened**: Q8 makes the `human_review_completed` gate a hard publish-time failure.
- ❌ Cardinal averaging of positioning — **explicitly prohibited**: Q5 (no aggregated `score` field), Q6 (dissent is named, not swallowed), Q11 (regression fixture).
- ❌ Hiding dissent — no, Q4 preserves per-claim provenance inline + top-level summary.
- ❌ Candidate-specific aggregator branches — no, Q8's review CLI is generic; prompt is generic.
- ❌ Reduced transparency — no, all artifacts remain public; prompt hash recorded.
- ❌ Advocacy framing in output copy — prompt-contract test (`0035`) will enforce absence of banned moral verbs in aggregated prose.

No red flags. Proceed to implementation tasks.

## Acceptance Criteria

- [ ] 7 backlog tasks created in `tasks/backlog/M_Aggregation/`
- [ ] Each task references `docs/specs/analysis/aggregation.md` and `editorial-principles.md`
- [ ] No circular dependencies in task graph
- [ ] `docs/specs/analysis/aggregation.md` updated with spike decisions (status becomes Stable via task `0031`)
- [ ] `docs/ROADMAP.md` updated with milestone status + scope boundary
- [ ] Spike moved to `tasks/archive/M_Aggregation/` on completion
- [ ] Editorial principles checked against each design decision (above)

## Notes

Like spike `0020`, this spike has a substantial head start: the draft aggregation spec already contains most design direction. The spike's value is:

1. **Freezing the schema shape** so `AggregatedOutputSchema` can replace `z.any()` against a fixed target.
2. **Locking the review CLI contract** (Q8) so `publish.ts` can gate hard without breaking later.
3. **Reinforcing ordinal positioning** (Q5/Q6) with a regression fixture — because "cardinal averaging of positioning" is the editorial principle most likely to silently erode under aggregation pressure.
4. **Breaking implementation into independently reviewable tasks** — schema, prompt, fixtures, contract tests, review CLI, end-to-end — each small enough to land in one PR.

The tension to watch during implementation: the aggregator prompt will want to produce "summary" prose that collapses disagreement ("models broadly agree that..."). The prompt-contract test (`0035`) and the `agreement_map` schema (`0032`) together must make structural dissent cheap and prose hedging expensive. If the first real run shows models collapsing dissent into prose anyway, open a follow-up ticket — do not weaken the schema to accommodate.
