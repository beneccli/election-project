# Aggregation Spec

> **Version:** 1.0
> **Status:** Draft — to be finalized by M_Aggregation spike

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
