---
id: "0033"
title: "Write full prompts/aggregate-analyses.md (replace placeholder)"
type: task
status: done
priority: high
created: 2026-04-19
milestone: M_Aggregation
spec: docs/specs/analysis/aggregation.md
context:
  - docs/specs/analysis/aggregation.md
  - docs/specs/analysis/editorial-principles.md
  - docs/specs/analysis/output-schema.md
  - docs/specs/analysis/political-positioning.md
  - prompts/aggregate-analyses.md
  - prompts/analyze-candidate.md
  - prompts/README.md
  - prompts/CHANGELOG.md
test_command: npm run test -- prompt
depends_on: ["0032"]
---

## Context

Today `prompts/aggregate-analyses.md` is a ~45-line placeholder (`version: "0.1"`, `status: placeholder`) producing a minimal consensus/dissent/flagged structure — not the real aggregated schema. This task writes the production prompt matching `AggregatedOutputSchema` from task `0032`.

Pattern reference: `prompts/analyze-candidate.md` is the canonical example of a production-grade prompt in this project — mirror its structure and tone.

## Objectives

1. Rewrite `prompts/aggregate-analyses.md` with the following sections (in order):
   1. **Role framing** — "You are aggregating N independent analyses… your job is synthesis that preserves dissent, not averaging."
   2. **Inputs** — `sources.md`, N per-model JSON analyses (labeled with their model version strings).
   3. **Editorial principles** — concise restatement (analysis-not-advocacy, symmetric scrutiny, measurement-over-indictment, dissent-preserved, transparency).
   4. **Aggregation rules** — explicit enumeration matching `aggregation.md` Q4–Q7:
      - Inline provenance on every claim (`supported_by`, `dissenters`)
      - Positioning: consensus interval + modal + dissent; **never** produce a `score` field; **never** arithmetic-mean positions
      - Source contradiction: any claim not supported by `sources.md` → `flagged_for_review[]`, not merged
      - Correlated hallucination rule: if all models agree on a claim but `sources.md` does not support it, still flag
   5. **Dissent vs consensus** — structural rules: how to classify a claim as contested, how to synthesize an anchor narrative when models disagree, required dissenting-reasoning verbatim.
   6. **Intergenerational aggregation** — quantified fields union'd; narrative synthesized in measurement framing; `agreement.direction_consensus` + `magnitude_consensus` computed.
   7. **Banned language** — explicit list of moral verbs forbidden in aggregated prose (`sacrifice`, `betray`, `steal`, `crush`, `rescue`, `save`, etc.). Applies to `summary`, `anchor_narrative`, all `reasoning` fields.
   8. **Output format** — strict JSON matching `AggregatedOutputSchema`. No surrounding prose. `schema_version: "1.0"`.
2. Frontmatter:
   - `version: "1.0"`
   - `status: stable`
   - `description`: describes the production aggregator prompt
3. Add a changelog entry to `prompts/CHANGELOG.md` documenting the `0.1` → `1.0` promotion and linking to spike `0030`.
4. Record the prompt SHA256 in a sibling file `prompts/aggregate-analyses.sha256.txt` if the project convention exists (check for `prompts/analyze-candidate.sha256.txt` pattern; mirror it).
5. Do NOT change `scripts/aggregate.ts` in this task (prompt-hash flow is already wired).

## Acceptance Criteria

- [ ] `prompts/aggregate-analyses.md` has all 8 sections above
- [ ] Frontmatter version `1.0`, status `stable`
- [ ] Prompt forbids any positioning `score` field in output (matches schema gate from task `0032`)
- [ ] Prompt explicitly lists banned moral verbs
- [ ] Prompt contains zero candidate-specific instructions (generic for all candidates)
- [ ] `prompts/CHANGELOG.md` updated
- [ ] SHA256 sidecar file produced if convention exists
- [ ] `npm run test -- prompt` passes (contract tests land in task `0035`; this task must at least pass existing hash/structure tests)
- [ ] `npm run lint` clean

## Hints for Agent

- Mirror the section structure of `prompts/analyze-candidate.md` §§1–8.
- Prompt length target: 250–500 lines of markdown. Longer than the placeholder, shorter than the per-model analysis prompt.
- Keep the "Output format" section at the bottom with a complete JSON skeleton a model can fill in — do NOT rely on the model remembering the schema from earlier sections.
- Do NOT paste the full Zod schema into the prompt; describe the shape in natural language + JSON skeleton.

## Editorial check

- [ ] No candidate name or party appears in the prompt
- [ ] Every banned moral verb from `editorial-principles.md §3` is listed in §7
- [ ] Positioning aggregation section explicitly forbids arithmetic averaging and any `score` field
- [ ] Dissent preservation is structural (fields), not prose hedging ("models broadly agree…")
- [ ] Source-contradiction rule explicitly covers correlated hallucination
