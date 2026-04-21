# Analysis Prompt Design

> **Version:** 1.1
> **Status:** Stable (v1.1 additive update by M_CandidatePagePolish task `0082`, 2026-04-20)

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

### 10. v1.1 output fields — headline, risk_profile, horizon_matrix

v1.1 (2026-04-20) adds three field groups consumed by the candidate-page
polish UI. They are purely additive — all v1.0 dimensions, grades, axes,
and editorial rules are unchanged.

- **`headline`** (per dimension, ≤140 characters). A single-sentence
  plain-language summary of the dimension verdict. Must be consistent with
  the dimension's `summary` and `grade`. Carries `source_refs`.
- **`risk_profile`** (per dimension). Four fixed categories in this order:
  `budgetary`, `implementation`, `dependency`, `reversibility`. Each
  category has an ordinal `level` on the scale `low < limited < moderate <
  high` plus a ≤180-char `note`. No omissions; silent categories are
  rated `low` with a justification.
- **`horizon_matrix`** (under `intergenerational`). Exactly six rows in
  fixed order — `pensions`, `public_debt`, `climate`, `health`,
  `education`, `housing` — each with three horizon cells
  (`h_2027_2030`, `h_2031_2037`, `h_2038_2047`). Every cell carries an
  integer `impact_score` in `[-3, +3]` where `0` = no change and `±3` is
  reserved for transformative effects. Silent cells score `0` with
  `"Not addressed."` as note.

Risk levels and horizon scores are **ordinal**. Aggregators must not
compute arithmetic mean across models. See
[`aggregation.md`](aggregation.md) §4.11–4.12.

### 11. Measurement-framing reminder

A final reminder block points at the authoritative disallowed-language
lists in [`editorial-principles.md §3`](editorial-principles.md) and
[`intergenerational-audit.md`](intergenerational-audit.md). These lists
are the single source of truth — the prompt does not duplicate them.

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
  "prompt_version": "1.1",
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

`temperature: 0` (or provider equivalent) is used for all analysis runs to maximize reproducibility. The adversarial pass runs inline at the same temperature (spike decision — no separate call in v1).

---

## Resolved decisions (spike `0020`)

- **Adversarial pass is inline** in the same model call (§8 of this prompt). No separate `adversarial-pass.md` in v1. Rationale: doubles cost otherwise, and the structured `adversarial_pass` output field provides a checkable contract. Revisit if quality suffers in practice.
- **Structured JSON output mode** is preferred where the provider exposes it; otherwise a strict JSON extractor wraps the response and the schema-validation retry loop catches malformed output.
- **No clarification requests.** Single-shot call. Deterministic inputs. If the program is too thin to answer a dimension, the finding is `grade: "NOT_ADDRESSED"`.
- **Retries on schema validation: 2** (3 attempts total). Persistent failure produces `<model>.FAILED.json` with structured Zod issues; aggregation proceeds without that model.
- **Low-quality but valid output** is not auto-rejected — it is flagged for human review. Hiding divergence would violate editorial principle 4 (dissent preserved).
- **Temperature: 0** (or provider equivalent) for the entire call, including the adversarial section.

### Deferred to future milestones

- Separate-call adversarial pass (may revisit after first real candidate run in M_FirstCandidate)
- Fine-grained quality-gate heuristics beyond schema validity (deferred to M_Aggregation review queue)

---

## Related Specs

- [`editorial-principles.md`](editorial-principles.md)
- [`dimensions.md`](dimensions.md)
- [`output-schema.md`](output-schema.md)
- [`political-positioning.md`](political-positioning.md)
- [`intergenerational-audit.md`](intergenerational-audit.md)
- [`aggregation.md`](aggregation.md)
- [`../data-pipeline/overview.md`](../data-pipeline/overview.md)
