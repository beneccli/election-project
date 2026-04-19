---
id: "0023"
title: "Write the full prompts/analyze-candidate.md (replace placeholder)"
type: task
status: open
priority: high
created: 2026-04-19
milestone: M_AnalysisPrompts
spec: docs/specs/analysis/analysis-prompt.md
context:
  - docs/specs/analysis/analysis-prompt.md
  - docs/specs/analysis/editorial-principles.md
  - docs/specs/analysis/dimensions.md
  - docs/specs/analysis/political-positioning.md
  - docs/specs/analysis/intergenerational-audit.md
  - docs/specs/analysis/output-schema.md
  - prompts/analyze-candidate.md
  - prompts/README.md
test_command: npm run test -- prompt
depends_on: ["0021", "0022"]
---

## Context

`prompts/analyze-candidate.md` is currently a 30-line placeholder. This task replaces it with the full, production prompt matching the 9-section design in [`analysis-prompt.md`](../../../docs/specs/analysis/analysis-prompt.md).

The prompt is a **versioned artifact**. Its SHA256 is recorded in every run's metadata. Every word matters.

## Objectives

1. Rewrite `prompts/analyze-candidate.md` with all 9 sections from `analysis-prompt.md`:
   1. Role and context (analytical assistant, analysis-not-advocacy framing)
   2. The five editorial principles (restated operationally, not as style notes)
   3. Source material placeholder / instruction ("the candidate program below is ground truth")
   4. Dimensions to analyze — enumerate the 6 clusters from `dimensions.md`
   5. Required output JSON structure — reference `AnalysisOutputSchema`, include an annotated example
   6. Evidence citation requirements — every claim needs `source_refs`
   7. Self-confidence scores — `[0, 1]`, justify <0.6
   8. Adversarial pass (inline) — weakest claims, potential bias, evidence gaps
   9. Positioning specifics — 5 axes, integer `[-5, +5]`, 4 anchors listed, rhetoric vs. proposals separation
2. Update the frontmatter:
   - `version: "1.0"`
   - `status: stable`
   - `description`: short, accurate
3. Explicit prohibitions the prompt must state:
   - No moral verbs (enumerate: sacrifice, steal, betray, save, rescue, crushing, generous …)
   - No candidate names in the prompt itself
   - No recommendation / voter-advice framing
   - No request-for-clarification — single-shot
4. Explicit output constraints:
   - Respond ONLY with JSON matching the schema
   - Do not wrap in markdown fences
   - Do not include chain-of-thought outside the schema's `reasoning` fields
5. Keep the placeholder frontmatter keys compatible with the hashing done in `scripts/lib/hash.ts` — the whole file is hashed; no dynamic substitution.

## Acceptance Criteria

- [ ] `prompts/analyze-candidate.md` contains all 9 sections in the order prescribed by the spec
- [ ] Anchor figures/parties listed per axis match `political-positioning.md`
- [ ] Prompt contains no candidate names (grep-testable)
- [ ] Prompt contains no banned moral verbs in its instructions to the model (grep-testable)
- [ ] Frontmatter: `version: "1.0"`, `status: stable`
- [ ] Prompt file ends with a single trailing newline (stable hashing)
- [ ] Test suite `npm run test -- prompt` (from task `0025`) passes
- [ ] `npm run lint` clean

## Hints for Agent

- The prompt is written in English (models are instructed in English, the content they analyze is in French).
- Example JSON embedded in the prompt should use `<placeholder>` values, not real candidate data.
- Reference the schema by name (`AnalysisOutputSchema`) and include a compact JSON-shape summary in the prompt rather than pasting the full Zod source.
- Keep the prompt under ~250 lines — models lose focus on very long system messages.

## Editorial check

- [ ] Prompts — does this change analysis behavior? → **Yes, this is the first real analysis prompt.** Re-read `editorial-principles.md` before and after writing.
- [ ] Every principle restated in the prompt is operational (instructions), not decorative.
- [ ] Candidate-name check: `grep -iE '(macron|le pen|mélenchon|zemmour|bardella|attal|philippe|ciotti|bellamy)' prompts/analyze-candidate.md` returns nothing **in the instructions** (anchor examples in positioning section are allowed — they are reference figures, not the candidate under analysis).
- [ ] No asymmetry — prompt is universal across candidates.
