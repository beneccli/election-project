# Analysis Prompt Design

> **Version:** 1.0
> **Status:** Draft — to be finalized by M_AnalysisPrompts spike

---

## Overview

This spec describes the **per-candidate, per-model analysis prompt** — the single prompt that, given a candidate's consolidated `sources.md`, produces a structured JSON analysis matching [`output-schema.md`](output-schema.md).

**Key design decision: one prompt per candidate.** Multiple prompts create stitching problems and lose coherent thinking. Modern context windows easily fit a full program plus analytical instructions.

The actual prompt text lives in [`prompts/analyze-candidate.md`](../../../prompts/analyze-candidate.md) — this document describes its design, not its exact wording.

---

## Design goals

1. **Identical across candidates.** No per-candidate customization. The *input* (`sources.md`) differs; the *prompt* does not.
2. **Produces structured JSON.** Output validated against Zod schema; non-conforming output is retried (up to N times) then flagged.
3. **Evidence-grounded.** Every analytical claim carries source citations into `sources.md`.
4. **Self-critical.** The prompt includes an adversarial pass where the model critiques its own conclusions.
5. **Neutral-framed.** Prompt language avoids primed framings ("is this program fair?", "is this sacrificing the youth?"). Instead: "quantify the distributional impact across age cohorts over 20 years."
6. **Pinned.** Prompt file is versioned; SHA256 recorded per run.

---

## Prompt Structure

The prompt is organized in these sections:

### 1. Role and context

Establishes the model as an analytical assistant producing structured output for a transparency-oriented website. Frames the task as *analysis, not advocacy*.

### 2. The editorial principles (abbreviated)

The five principles from [`editorial-principles.md`](editorial-principles.md) are restated in the prompt. They are not optional style suggestions — they are operational constraints that shape the output.

### 3. Source material

Full content of `sources.md` embedded in the prompt. The prompt instructs the model to treat this as ground truth for the candidate's program — if something is not in `sources.md`, the model should not claim the candidate proposes it.

### 4. Dimensions to analyze

Reference to the fixed list from [`dimensions.md`](dimensions.md), restated in the prompt. The prompt requires analysis of every dimension, including those not addressed by the candidate (with "not addressed" as a valid finding).

### 5. Required output structure

Full Zod-derived JSON schema description. The prompt requires JSON output matching the schema exactly. Structured output mode used where providers support it.

### 6. Required evidence citations

Every analytical claim must include `source_refs` — an array of references into `sources.md` (section anchors, line ranges, or direct quotes). Claims without evidence are considered bugs.

### 7. Self-confidence scores

Per-section confidence in `[0, 1]` with the model required to justify scores below 0.6.

### 8. Adversarial pass

After completing the main analysis, the model is prompted to critique its own conclusions:

- Where might I be wrong?
- What's the strongest case against my judgments?
- Which claims rest on weak evidence?
- Where does my analysis appear to express a political preference, and how could that affect reliability?

Output as a separate `adversarial_pass` field in the JSON.

### 9. Positioning specifically

Political positioning scores use the 5-axis methodology from [`political-positioning.md`](political-positioning.md). The prompt requires:
- An ordinal placement (`-5` to `+5`) on each axis
- **Evidence quotes from `sources.md`** justifying the placement
- **An explicit comparison** to other public figures/parties as anchors ("more statist than X, less than Y")
- Clear separation of rhetoric (what candidates say) from proposals (what their measures actually do)

---

## What the prompt MUST NOT do

- **Must not ask value-laden framing questions** ("is this fair?"). Instead: "measure the distributional impact."
- **Must not contain candidate names.** The prompt is universal. Candidate identity comes from `sources.md`.
- **Must not give higher confidence for agreement with prior assumptions.** The prompt explicitly instructs: confidence reflects evidence quality, not familiarity.
- **Must not conclude with a recommendation.** No "this candidate should…" or "voters should…" framings.

---

## Schema validation loop

The pipeline (`scripts/analyze.ts`) handles schema validation:

```
1. Call model with prompt + sources.md
2. Parse response as JSON
3. Validate against Zod schema
4. If valid → write to raw-outputs/<model>.json
5. If invalid:
   a. Retry up to 2 times with a corrective follow-up message
   b. On final failure, write to raw-outputs/<model>.FAILED.json with error log
   c. Mark this model as missing in aggregation
```

Schema failures are **data**, not errors to be hidden. If a specific model can't produce valid output for a specific candidate, that's itself a finding about model capability.

---

## Prompt hash + metadata

Every run records in the version's `metadata.json`:

```json
{
  "prompt_file": "prompts/analyze-candidate.md",
  "prompt_sha256": "...",
  "prompt_version": "1.0",
  "models": {
    "claude-opus-4-7": {
      "provider": "anthropic",
      "version": "claude-opus-4-7",
      "temperature": 0,
      "run_at": "2026-04-19T10:32:00Z",
      "tokens_in": 42000,
      "tokens_out": 8500
    },
    ...
  }
}
```

`temperature: 0` (or provider equivalent) is used for all analysis runs to maximize reproducibility. Adversarial passes may use slightly higher temperature — to be decided in the spike.

---

## Open questions (for spike)

- Should the adversarial pass be a separate LLM call, or part of the same prompt? (Same prompt is cheaper but less adversarial; separate call is more independent but more expensive.)
- How do we handle models that don't support structured JSON output mode? (Likely: wrap with a strict JSON extractor + retry.)
- Should we allow the model to request clarification? (Probably no — this makes outputs non-deterministic.)
- How many retries on schema validation? (Default: 2.)
- What if a model's output is valid JSON but obviously low-quality (e.g., boilerplate-heavy)? (Flag for human review, do not auto-reject — we don't want to hide real divergence.)

---

## Related Specs

- [`editorial-principles.md`](editorial-principles.md)
- [`dimensions.md`](dimensions.md)
- [`output-schema.md`](output-schema.md)
- [`political-positioning.md`](political-positioning.md)
- [`intergenerational-audit.md`](intergenerational-audit.md)
- [`aggregation.md`](aggregation.md)
- [`../data-pipeline/overview.md`](../data-pipeline/overview.md)
