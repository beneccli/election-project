# Aggregation Spec

> **Version:** 1.0
> **Status:** Draft — decisions finalized by M_Aggregation spike `0030` (2026-04-19); promotion to **Stable** tracked by task `0031`.

---

## Overview

The aggregation step takes N per-model JSON outputs (`raw-outputs/<model>.json`) and produces a single `aggregated.json` that powers the website.

**Approach: Option A — Meta-LLM aggregation.** A sixth LLM call (using a strong model, ideally different from those used in the per-model analysis) receives all N raw outputs and produces the aggregated result following this spec.

The aggregator prompt lives in [`prompts/aggregate-analyses.md`](../../../prompts/aggregate-analyses.md).

---

## Core principle

**The aggregator's job is not to average. It is to synthesize a defensible single analysis that preserves where models agree, preserves where models disagree, and catches where any model contradicted the source material.**

Averaging destroys signal. We preserve signal.

---

## Aggregation rules

### 1. Identify convergence

Claims that appear across ≥N-1 models (where N is the number of successful analyses) are treated as **high-confidence** and marked as such. Their wording is synthesized from the best-supported phrasings.

### 2. Preserve divergence

Claims where models genuinely disagree produce an **`agreement_map`** entry showing:
- Which models hold which position
- Brief summary of the disagreement
- Whether disagreement is factual (should converge with better data) or value-laden (reflects genuine interpretive difference)

### 3. Flag source contradictions

A claim made by any model but **not supported by `sources.md`** is flagged for human review in `flagged_for_review`, not auto-published.

### 4. Never average positioning

The 5-axis political positioning is explicitly ordinal (see [`political-positioning.md`](political-positioning.md)). Aggregation uses:

- **Consensus interval**: the range of scores across models, plus modal value if clear
- **Anchor comparison synthesis**: the aggregator distills a combined anchor narrative
- **Evidence merger**: all evidence quotes from all models union'd
- **Disagreement note**: when one model's placement differs significantly, the dissenting view is preserved alongside

### 5. Citations survive aggregation

Every aggregated claim retains its `source_refs` (unioned across models). A claim with no source_refs in any source model does not appear in aggregated output — it is a bug flagged for review.

### 6. Model identity preserved

Every aggregated claim records which models contributed. This is the raw material of the `agreement_map`.

---

## Aggregated output schema

Same top-level structure as per-model output (see [`output-schema.md`](output-schema.md)), with these additions:

```json
{
  "schema_version": "1.0",
  "candidate_id": "...",
  "version_date": "YYYY-MM-DD",

  "source_models": [
    { "provider": "anthropic", "version": "claude-opus-4-7" },
    { "provider": "openai", "version": "gpt-5-..." },
    ...
  ],

  "aggregation_method": {
    "type": "meta_llm",
    "model": { "provider": "...", "version": "..." },
    "prompt_sha256": "...",
    "prompt_version": "1.0",
    "run_at": "ISO-8601"
  },

  "summary": "string — synthesized from models",
  "summary_agreement": 0.9,

  "positioning": {
    "economic": {
      "consensus_interval": [-4, -2],
      "modal_score": -3,
      "anchor_narrative": "string — synthesized",
      "evidence": [ ... unioned ... ],
      "confidence": 0.8,
      "dissent": [
        {
          "model": "grok",
          "position": -1,
          "reasoning": "string — why this model placed differently"
        }
      ]
    },
    ...
  },

  "dimensions": {
    "economic_fiscal": {
      "grade": { "consensus": "B", "dissent": { "gpt-5": "B-", "grok": "C+" } },
      "summary": "string",
      "problems_addressed": [
        {
          "problem": "...",
          "supported_by": ["claude-opus-4-7", "gpt-5-...", "gemini-ultra"],
          "dissenters": [],
          "strength_consensus": 0.7,
          "strength_range": [0.6, 0.8],
          "source_refs": [...],
          "reasoning": "..."
        }
      ],
      ... rest of dimension fields with similar agreement annotation ...
    },
    ...
  },

  "intergenerational": {
    ...standard intergen fields...
    "agreement": {
      "direction_consensus": true,
      "magnitude_consensus": "interval",
      "dissenting_views": [...]
    }
  },

  "agreement_map": {
    "high_confidence_claims": [ { "claim_id": "...", "models": [...] } ],
    "contested_claims": [ { "claim_id": "...", "positions": [...] } ],
    "coverage": {
      "claude-opus-4-7": "complete",
      "gpt-5": "complete",
      "gemini-ultra": "partial",
      "mistral-large": "complete",
      "grok": "failed"
    }
  },

  "flagged_for_review": [
    {
      "claim": "...",
      "claimed_by": ["gpt-5"],
      "issue": "claim not supported by sources.md",
      "suggested_action": "human review required"
    }
  ]
}
```

---

## Aggregator prompt design

The aggregator prompt:

1. **Receives** all N raw per-model outputs in full.
2. **Receives** `sources.md` for contradiction checking.
3. **Is instructed** to:
   - Identify converging and diverging claims
   - Flag claims that contradict or overstep `sources.md`
   - Preserve dissent structurally, not in prose
   - Use ordinal methodology for positioning
   - Produce a `summary` that honestly reflects the state of agreement
4. **Produces** JSON matching the aggregated schema above.

Same schema validation rules apply as for per-model output.

---

## Handling failure modes

### A model failed / produced invalid JSON

Aggregation proceeds with remaining valid outputs. `agreement_map.coverage` records the failure. A single-model analysis is still published (with a visible "only 1 model contributed" notice on the site); a zero-model analysis triggers a build failure.

### All models agree on something contradicted by `sources.md`

This is the most dangerous case — correlated hallucination. The aggregator prompt explicitly instructs to catch this and flag. Backstop: human review queue (see below).

### Models wildly disagree on a core claim

Aggregation preserves all positions. Website UI shows disagreement explicitly.

### Aggregator itself produces invalid output

Same retry logic as analysis. On persistent failure, the build fails and a human is notified — we do not fall back to deterministic averaging, which would be a silent editorial drift.

---

## Human review queue

`flagged_for_review` is not auto-published. The workflow is:

1. Aggregator writes `aggregated.draft.json` with flagged items
2. `scripts/review.ts` surfaces flagged items in a CLI or simple UI
3. Human examines each flagged claim against `sources.md`
4. Claim is either:
   - **Approved**: moved into aggregated output
   - **Rejected**: removed from aggregated output, noted in `aggregation-notes.md`
   - **Modified**: reworded with correct evidence
5. `aggregated.json` is produced (the final version)
6. `aggregation-notes.md` documents every flagged item and its resolution

This is the last gate before publication. It is manual by design.

---

## `aggregation-notes.md`

A human-readable companion to `aggregated.json` that records:

- Which models ran, which succeeded, which failed
- Notable disagreements and how aggregation preserved them
- Flagged items and their resolution
- Any overrides the human reviewer applied
- Run duration and cost (optional but useful)

---

## Future considerations (NOT in v1)

- **Option B (deterministic + LLM refinement)**: if we find the meta-LLM aggregator makes subjective calls we disagree with, migrate to a programmatic aggregation step with LLM used only for prose synthesis.
- **Self-evaluation**: running the aggregator on itself to detect bias.
- **Cross-candidate consistency check**: detecting when the same analytical move is applied asymmetrically across candidates.

---

## Related Specs

- [`editorial-principles.md`](editorial-principles.md)
- [`output-schema.md`](output-schema.md)
- [`analysis-prompt.md`](analysis-prompt.md)
- [`political-positioning.md`](political-positioning.md)
- [`../data-pipeline/overview.md`](../data-pipeline/overview.md)

---

## Decisions finalized by spike `0030` (2026-04-19)

These decisions freeze the design surface for implementation tasks `0031`–`0037`. They supersede any drift in the prose above.

### Aggregator model (Q1)

- A single designated aggregator model lives in `scripts/config/models.ts` as `AGGREGATOR_MODEL`.
- Default: `claude-opus-4-0-20250514` (matches the hardcoded value currently in `scripts/aggregate.ts`; made explicit via config).
- v1 permits overlap between the aggregator and an analyst model. Per-run metadata records all model versions so overlap is always auditable.
- A stricter "aggregator disjoint from analysts" rule is deferred pending empirical signal from M_FirstCandidate.

### Schema retry (Q2)

- Aggregator call retries up to 2 times (3 total attempts) on schema validation failure, mirroring `analyze.ts`.
- On persistent failure: write `aggregated.FAILED.json` with `ZodError.issues[]`; do **not** fall back to programmatic averaging; the pipeline fails loudly.

### Minimum models (Q3)

- Hard minimum: 1 successful per-model output (0 → `aggregate.ts` throws, as today).
- Soft minimum: 3. Below this, `aggregated.json` is produced but carries a `coverage_warning` flag rendered on-site as a visible notice.

### `agreement_map` structure (Q4)

- **Inline per-claim provenance** on every aggregated claim:
  - `supported_by: string[]` (model version strings)
  - `dissenters: string[]` (empty when unanimous)
- **Top-level `agreement_map`** summary:
  - `high_confidence_claims: { claim_id, models }[]` — claims supported by ≥ N-1 successful models
  - `contested_claims: { claim_id, positions }[]` — claims with ≥1 dissenter
  - `coverage: Record<modelVersion, "complete" | "partial" | "failed">`
  - `positioning_consensus: Record<axis, { interval: [int, int], modal: int | null, dissent_count: number }>`

### Positioning aggregation (Q5 / Q6)

- Per axis, aggregated output contains:
  - `consensus_interval: [int, int]` (min and max across all successful models)
  - `modal_score: int | null` (integer in `[-5, +5]`, or `null` if no plurality)
  - `anchor_narrative: string`
  - `evidence: EvidenceRef[]` (union across models)
  - `confidence: number` in `[0, 1]`
  - `dissent: { model: string, position: int, reasoning: string }[]`
- **There is no aggregated `score` field.** The per-model integer `score` lives only in `raw-outputs/`.
- Dissent threshold: a model's `score` is flagged as dissent when it falls outside the modal-centred plurality OR when its anchor-narrative genuinely disagrees. The dissenting reasoning is preserved verbatim — `consensus_interval` is not silently narrowed.

### Source contradiction flagging (Q7)

- Every aggregated claim must carry at least one `source_ref` unioned from per-model outputs.
- A claim made by ≥1 model but unsupported by any quote the aggregator can locate in `sources.md` goes to `flagged_for_review[]` with `issue: "claim not supported by sources.md"`. It is neither silently dropped nor auto-published.
- This rule applies even when **all** per-model outputs agree on the unsupported claim (correlated hallucination).

### Human review CLI (Q8)

`scripts/review.ts --candidate <id> --version <date> [--reviewer <id>]` implements the second human gate.

Behavior:

1. Loads `aggregated.draft.json`.
2. Iterates `flagged_for_review[]`. For each item, displays the claim, `issue`, `claimed_by`, and relevant `sources.md` excerpts.
3. Accepts per-item input: `[a]pprove / [r]eject / [e]dit / [s]kip / [q]uit`.
4. On completion, if no item is still `skipped`, writes:
   - `aggregated.json` (final): approved items merged, rejected items removed, edited items carry `human_edit: true`.
   - `aggregation-notes.md`: "Flagged item resolutions" section appended with reviewer id and ISO timestamp per item.
   - `metadata.json`: `aggregation.human_review_completed: true`, `aggregation.review_at`, `aggregation.reviewer_id`.
5. Idempotent: re-running after partial progress resumes at the first unresolved item.
6. Refuses to write `aggregated.json` while any flagged item remains `skipped`.

`scripts/publish.ts` **hard-fails** (non-zero exit, no symlink update, no commit) when `metadata.aggregation.human_review_completed !== true`.

### `aggregation-notes.md` structure (Q9)

Canonical section order written by `aggregate.ts` (with placeholders filled by `review.ts` on exit):

```markdown
# Aggregation Notes — <candidate> (<version>)

## Run metadata
(models aggregated, aggregator model, prompt hash, run duration, cost)

## Coverage
(per-model: complete / partial / failed)

## Notable consensus
(3–5 bullets with cross-model support counts)

## Notable dissent
(positioning dissent, dimension grade disagreements, contested factual claims)

## Flagged items
(written by aggregate.ts — one row per flagged_for_review entry)

## Flagged item resolutions
(written by review.ts on exit)
```

### Schema versioning (Q10)

- Aggregated output carries its own `schema_version: "1.0"` independent of per-model `output-schema.md`.
- Bumping per-model schema does not automatically bump aggregated schema. Cross-references are tracked in each spec's "Schema versioning" section.

### Fixtures (Q11)

Shipped in `scripts/lib/fixtures/aggregated-output/`:

- `valid-full.json` — three synthetic per-model inputs produce one aggregated output with populated consensus, dissent, and flagged items.
- `valid-single-model.json` — only one per-model output succeeded; `coverage` shows failed siblings; `agreement_map.high_confidence_claims` empty; `coverage_warning: true`.
- `invalid-cardinal-positioning.json` — regression fixture: positioning contains a `"score": -2.5` float; schema **must** reject at the type level. Guards against future accidental cardinal averaging.

### Deferred (Q12)

- Cross-candidate symmetry audit tooling — deferred.
- Aggregator-rotation rule to enforce disjointness from the analyst set — deferred.
- Self-evaluation (running aggregator on itself for bias detection) — deferred.
- Deterministic aggregation fallback (Option B) — deferred; listed in `## Future considerations` above.
