# Output Schema

> **Version:** 1.1
> **Status:** Stable (finalized by M_AnalysisPrompts spike `0020`, 2026-04-19; v1.1 additive fields from M_CandidatePagePolish spike `0080`, 2026-04-20)
> **Source of truth:** `scripts/lib/schema.ts` (Zod)

---

## Overview

This spec describes the structure of the JSON output produced by each LLM analysis of a candidate. All models must produce output matching this schema; the pipeline validates every output against it before writing to disk.

The canonical implementation is `scripts/lib/schema.ts` using Zod. This markdown document is a human-readable companion and must stay in sync.

---

## Top-level structure

```json
{
  "schema_version": "1.1",
  "candidate_id": "string",
  "version_date": "YYYY-MM-DD",
  "model": {
    "provider": "anthropic | openai | google | mistral | xai | ...",
    "version": "exact model version string"
  },
  "run_metadata": {
    "run_at": "ISO-8601 timestamp",
    "prompt_sha256": "sha256 of the prompt file used",
    "temperature": 0
  },
  "summary": "string — 2-3 sentences describing what this candidate is fundamentally proposing",
  "positioning": { ... },
  "dimensions": { ... },
  "intergenerational": { ... },
  "counterfactual": { ... },
  "unsolved_problems": [ ... ],
  "downside_scenarios": [ ... ],
  "adversarial_pass": { ... },
  "confidence_self_assessment": 0.0
}
```

---

## Field detail

### `positioning`

Uses the 5-axis methodology from [`political-positioning.md`](political-positioning.md). Scores are **ordinal** (integer in `[-5, +5]`) with anchoring evidence.

```json
"positioning": {
  "economic": {
    "score": -3,
    "anchor_comparison": "string describing comparison to known public figures/parties",
    "evidence": [
      { "quote": "...", "source_ref": "sources.md#section-anchor" },
      ...
    ],
    "confidence": 0.8,
    "reasoning": "string — why this placement"
  },
  "social_cultural": { ... same shape ... },
  "sovereignty": { ... },
  "institutional": { ... },
  "ecological": { ... }
}
```

**Critical:** these scores are **never averaged** across models during aggregation. See [`aggregation.md`](aggregation.md).

---

### `dimensions`

One entry per dimension cluster from [`dimensions.md`](dimensions.md). Every cluster is mandatory — "not addressed" is a valid finding, not an omission.

```json
"dimensions": {
  "economic_fiscal": {
    "grade": "A | B | C | D | F | NOT_ADDRESSED",
    "headline": "string ≤140 chars — concise policy-claim distillation (v1.1)",
    "summary": "string — 2-3 sentences",
    "problems_addressed": [
      {
        "problem": "string",
        "approach": "string — how the program addresses it",
        "strength": 0.7,
        "source_refs": ["sources.md#..."],
        "reasoning": "string"
      },
      ...
    ],
    "problems_ignored": [
      {
        "problem": "string",
        "significance": "string — why this omission matters",
        "source_refs": []
      }
    ],
    "problems_worsened": [
      {
        "problem": "string",
        "mechanism": "string — how this program makes it worse",
        "severity": 0.8,
        "source_refs": [...],
        "reasoning": "string"
      }
    ],
    "execution_risks": [
      {
        "risk": "string",
        "probability": 0.6,
        "severity": 0.7,
        "reasoning": "string",
        "source_refs": [...]
      }
    ],
    "key_measures": [
      {
        "measure": "string — concrete policy",
        "source_ref": "sources.md#...",
        "quantified": true,
        "magnitude": "string or null — e.g. '€5bn/year'"
      }
    ],
    "risk_profile": {
      "budgetary":      { "level": "low | limited | moderate | high", "note": "≤180 chars", "source_refs": [...] },
      "implementation": { "level": "...", "note": "...", "source_refs": [...] },
      "dependency":     { "level": "...", "note": "...", "source_refs": [...] },
      "reversibility":  { "level": "...", "note": "...", "source_refs": [...] }
    },
    "confidence": 0.75
  },
  "social_demographic": { ... same shape ... },
  "security_sovereignty": { ... },
  "institutional_democratic": { ... },
  "environmental_long_term": { ... }
}
```

**Grade semantics:** grades reflect **coherence + evidence-support** on the dimension's problems. They are **not** ideological verdicts. A program that addresses economic problems through different means than another program can still be graded A if its approach is internally coherent and evidence-supported. The grade enum is `A | B | C | D | F | NOT_ADDRESSED`.

**v1.1 additive fields:**
- `headline` (prompt target: ≤140 chars; ingest accepts up to 280 chars to tolerate LLM overshoot) distills the central policy claim in one line, for the candidate-page dimension list. It is **not** a substitute for `summary`. See [`../website/candidate-page-polish.md`](../website/candidate-page-polish.md) §3.1.
- `risk_profile` is a fixed-shape 4-category ordinal summary (budgetary, implementation, dependency, reversibility) distinct from the free-form `execution_risks[]`. Levels are `low | limited | moderate | high`; they are never composed into a single score. Prompt targets: `note` ≤180 chars, `dimension_note` ≤200 chars, horizon cell `note` ≤160 chars. Ingest accepts 2× those caps (360 / 400 / 320) so that modest overshoot does not reject an otherwise-valid raw output. The aggregator resynthesizes to the tight targets. See [`../website/candidate-page-polish.md`](../website/candidate-page-polish.md) §3.2.

---

### `intergenerational`

Dedicated cross-cutting section. See [`intergenerational-audit.md`](intergenerational-audit.md) for measurement framework.

```json
"intergenerational": {
  "net_transfer_direction": "young_to_old | old_to_young | neutral | mixed",
  "magnitude_estimate": {
    "value": "string — quantified where possible",
    "units": "€/person/year | % of GDP | etc.",
    "confidence": 0.5,
    "caveats": "string"
  },
  "impact_on_25yo_in_2027": {
    "fiscal": { "summary": "string", "quantified": "string | null" },
    "housing": { "summary": "string", "quantified": "string | null" },
    "pension_outlook": { "summary": "string", "quantified": "string | null" },
    "labor_market": { "summary": "string", "quantified": "string | null" },
    "environmental_debt": { "summary": "string", "quantified": "string | null" },
    "narrative_summary": "string — 2-3 sentences"
  },
  "impact_on_65yo_in_2027": {
    "fiscal": { "summary": "string", "quantified": "string | null" },
    "pension": { "summary": "string", "quantified": "string | null" },
    "healthcare": { "summary": "string", "quantified": "string | null" },
    "narrative_summary": "string"
  },
  "reasoning": "string — the analytical path from source material to these findings",
  "source_refs": [...],
  "confidence": 0.6,
  "horizon_matrix": [
    {
      "row": "pensions | public_debt | climate | health | education | housing",
      "dimension_note": "string ≤200 chars — row-level mechanism",
      "cells": {
        "h_2027_2030": { "impact_score": -3..3, "note": "≤160 chars", "source_refs": [...] },
        "h_2031_2037": { "impact_score": -3..3, "note": "...", "source_refs": [...] },
        "h_2038_2047": { "impact_score": -3..3, "note": "...", "source_refs": [...] }
      }
    }
    // ... exactly 6 rows, one per fixed key, any order
  ]
}
```

**v1.1:** `horizon_matrix` is a fixed 6×3 matrix (domain × horizon) of ordinal integer scores in `[−3, +3]`. Symmetry is enforced by Zod: all 6 row keys and all 3 horizon keys must be present, no duplicates. See [`intergenerational-audit.md`](intergenerational-audit.md) §"Horizon bands and cohort framing" and [`../website/candidate-page-polish.md`](../website/candidate-page-polish.md) §3.3.

**Language constraint:** every field in this section must use measurement framing, not moral framing. See editorial principle 3. The schema does not mechanically enforce this — the prompt does.

---

### `counterfactual`

Compares the program to the "do nothing / continue current trend" baseline.

```json
"counterfactual": {
  "status_quo_trajectory": "string — where France goes if nothing changes (from this model's perspective)",
  "does_program_change_trajectory": true,
  "direction_of_change": "improvement | worsening | neutral | mixed",
  "dimensions_changed": ["economic_fiscal", "environmental_long_term"],
  "dimensions_unchanged": ["institutional_democratic"],
  "reasoning": "string",
  "confidence": 0.7
}
```

This is how we answer "what happens if France continues its stagnation?" while still evaluating the candidate's program on its merits.

---

### `unsolved_problems`

Problems that remain unsolved even if the program is fully and successfully executed.

```json
"unsolved_problems": [
  {
    "problem": "string",
    "why_unsolved": "string — the program doesn't address this because...",
    "severity_if_unsolved": "high | medium | low",
    "source_refs": [...]
  }
]
```

---

### `downside_scenarios`

If the program fails or executes poorly, what does France look like?

```json
"downside_scenarios": [
  {
    "scenario": "string — description",
    "trigger": "string — what causes this failure mode",
    "probability": 0.3,
    "severity": 0.8,
    "reasoning": "string"
  }
]
```

---

### `adversarial_pass`

Self-critique produced by the model after completing the main analysis.

```json
"adversarial_pass": {
  "weakest_claims": [
    {
      "claim_location": "string — where in this JSON the claim lives",
      "critique": "string — why this claim might be wrong",
      "alternative_interpretation": "string"
    }
  ],
  "potential_bias": "string — where the model suspects its own output expresses a political preference",
  "evidence_gaps": "string — claims resting on weak evidence from sources.md",
  "confidence_in_critique": 0.0
}
```

---

### `confidence_self_assessment`

Overall `[0, 1]` confidence in the analysis as a whole.

---

## Aggregated output schema

The aggregator (see [`aggregation.md`](aggregation.md)) consumes N per-model JSONs and produces `aggregated.json`. It has the same top-level structure as per-model output, **plus**:

- `source_models`: array of model identifiers that contributed
- `agreement_map`: per-claim structure showing which models agreed/dissented
- `aggregation_method`: description + version
- `flagged_for_review`: claims with source-contradiction flags

See [`aggregation.md`](aggregation.md) for full schema.

---

## Validation

- All JSON output is validated against Zod schema in `scripts/lib/schema.ts`
- Invalid output triggers retry (up to 2 attempts)
- On persistent failure, output is written to `<model>.FAILED.json` with error log
- Aggregation proceeds with the remaining valid outputs, noting which models failed

---

## Schema versioning

- `schema_version` field in every output
- Breaking changes require major version bump
- Migration notes recorded in this spec
- Old outputs retained as-is (they are historical artifacts); new runs use new schema

---

## Related Specs

- [`editorial-principles.md`](editorial-principles.md)
- [`dimensions.md`](dimensions.md)
- [`analysis-prompt.md`](analysis-prompt.md)
- [`political-positioning.md`](political-positioning.md)
- [`intergenerational-audit.md`](intergenerational-audit.md)
- [`aggregation.md`](aggregation.md)
