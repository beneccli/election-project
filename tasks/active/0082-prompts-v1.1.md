---
id: "0082"
title: "Prompts v1.1: analyze + aggregate with new output fields"
type: task
status: open
priority: high
created: 2026-04-20
milestone: M_CandidatePagePolish
spec: docs/specs/website/candidate-page-polish.md
context:
  - prompts/analyze-candidate.md
  - prompts/aggregate-analyses.md
  - prompts/CHANGELOG.md
  - prompts/analyze-candidate.sha256.txt
  - prompts/aggregate-analyses.sha256.txt
  - .github/prompts/analyze-candidate-via-copilot.prompt.md
  - .github/prompts/aggregate-analyses-via-copilot.prompt.md
  - docs/specs/analysis/analysis-prompt.md
test_command: pnpm test -- prompt-contract
depends_on: ["0081"]
---

## Context

Schema v1.1 adds 4 new output surfaces (headline, risk_profile,
horizon_matrix, positioning per-model). Prompts must instruct models to
produce them. Per `M_AnalysisModes`, the canonical prompt files
(`prompts/*.md`) are loaded verbatim by all three execution modes — the
Copilot-agent prompt wrappers inherit changes automatically.

See spec §4.

## Objectives

1. Update `prompts/analyze-candidate.md` with three new output-structure
   sections:
   - **Dimension headline** (≤140 chars, after `summary`)
   - **Risk profile** (4 fixed categories × 4-level ordinal scale)
   - **Horizon matrix** (6 rows × 3 horizons × integer score in [−3, +3])
   Include a measurement-framing reminder block at the end that lists
   banned advocacy words (mirror `intergenerational-audit.md`
   "Disallowed language" list).
2. Update `prompts/aggregate-analyses.md` with three synthesis rules:
   - Headline synthesis: pick plurality phrasing, preserve per-model
     in `per_model`.
   - Risk-profile aggregation: `modal_level` + ordered `level_interval` +
     per-model verbatim; no cardinal composition.
   - Horizon-matrix aggregation: `modal_score` (int plurality) +
     `score_interval` (min/max) + per-model verbatim; scores never
     averaged.
   Also add a positioning subsection reminding the aggregator to emit
   the complete `per_model` list (not only dissenters).
3. Update `docs/specs/analysis/analysis-prompt.md` to v1.1 with the new
   output sections documented.
4. Regenerate `prompts/analyze-candidate.sha256.txt` and
   `prompts/aggregate-analyses.sha256.txt` via the existing hash tooling
   (see `scripts/lib/hash.ts`). Verify via `pnpm test -- prompt-contract`.
5. Add a `1.1 (2026-04-xx)` entry to `prompts/CHANGELOG.md` summarizing
   the additive changes and their editorial framing.

## Acceptance Criteria

- [ ] `prompts/analyze-candidate.md` contains 3 new output-structure
      subsections with explicit JSON examples matching schema v1.1.
- [ ] `prompts/aggregate-analyses.md` contains synthesis rules for all
      new fields; explicit "never cardinally average ordinal scores"
      reminder present.
- [ ] Both prompt files end with a refreshed version banner and date.
- [ ] `prompts/*.sha256.txt` files regenerated and committed.
- [ ] `prompts/CHANGELOG.md` has a v1.1 entry.
- [ ] `docs/specs/analysis/analysis-prompt.md` updated to v1.1.
- [ ] Copilot-agent wrapper prompts re-read as unchanged (they load the
      canonical prompt bytes).
- [ ] `pnpm test -- prompt-contract` passes (hashes match).
- [ ] All tests pass: `pnpm test`
- [ ] No lint errors: `pnpm lint`

## Hints for Agent

- Follow the existing prose style in `prompts/analyze-candidate.md` —
  declarative, numbered, with embedded JSON skeletons.
- The horizon-matrix section of the analysis prompt should explicitly
  state: `0` = "no material change from the counterfactual in this
  horizon"; `−3 / +3` reserved for transformative effects; "Program does
  not specify" → `0` with a note documenting the absence.
- For the aggregator prompt, reuse the exact language pattern from the
  existing positioning section ("NEVER cardinally average").
- Hash regeneration is automated; see `scripts/lib/hash.ts` usage in
  existing prompt-contract tests.

## Editorial check

- [ ] No advocacy language inserted; reminder block explicitly lists
      banned words.
- [ ] Horizon-matrix instructions clarify `impact_score` is the
      **estimated net effect of the program**, not ideology.
- [ ] No candidate-specific instructions.
- [ ] CHANGELOG entry frames changes as "additive fields for
      screenshot-worthy summary layer", no promises of new editorial
      stance.

## Notes

Depends on schema (0081) because the JSON examples in the prompts must
match the Zod schema exactly. No website work yet.
