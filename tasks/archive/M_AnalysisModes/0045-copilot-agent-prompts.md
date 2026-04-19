---
id: "0045"
title: "Copilot-agent prompts for analyze and aggregate"
type: task
status: open
priority: high
created: 2026-04-19
milestone: M_AnalysisModes
spec: docs/specs/data-pipeline/analysis-modes.md
context:
  - docs/specs/data-pipeline/analysis-modes.md
  - docs/specs/analysis/editorial-principles.md
  - prompts/analyze-candidate.md
  - prompts/aggregate-analyses.md
  - .github/prompts/ingest-sources.prompt.md
  - .github/prompts/update-candidate.prompt.md
test_command: npm run lint
depends_on: ["0044"]
---

## Context

Copilot-agent mode uses two agent prompts that instruct Copilot to act
as the analyst/aggregator model, loading `prompts/analyze-candidate.md`
or `prompts/aggregate-analyses.md` verbatim as its operational
instructions.

Keeping the prompt loading in the agent's control (rather than embedding
the prompt text) preserves the single-source-of-truth invariant.

## Objectives

1. Create `.github/prompts/analyze-candidate-via-copilot.prompt.md`
   with the structure described in the spec's "Copilot agent prompt
   structure" section:
   - Preface (you ARE the analyst model, not a coordinator)
   - Editorial principles reminder (compact restatement)
   - Instruction to read `prompts/analyze-candidate.md` verbatim and
     `sources.md` as input
   - Validation step (`npm run validate-raw`)
   - Write step to
     `candidates/<id>/versions/<date>/raw-outputs/<model>.json`
   - Ingest step (`npm run ingest-raw-output -- --mode copilot-agent
     --already-written ...`)
   - Red-flag stop conditions
2. Create
   `.github/prompts/aggregate-analyses-via-copilot.prompt.md` mirroring
   the structure for aggregation.
3. Accept arguments as the other `.github/prompts/` files do: the
   operator invokes with candidate id and version date; the prompt
   asks for the model identifier if not clear from the Copilot
   session.
4. Include an explicit paragraph telling the agent: "You will halt and
   ask for human confirmation if (a) you cannot determine the model
   you are running as, (b) `prompts/analyze-candidate.md` fails to
   load or is empty, or (c) validation fails repeatedly (≥3 attempts)."

## Acceptance Criteria

- [ ] Both prompt files exist in `.github/prompts/`
- [ ] Each links to the spec and the editorial-principles doc
- [ ] Each explicitly loads the canonical prompt file by path (does
      NOT embed the prompt content)
- [ ] Each calls the ingest script with the correct mode flag
- [ ] Red-flag stop conditions are listed
- [ ] `npm run lint` passes (markdown lint if configured)

## Hints for Agent

- Mirror the tone and structure of
  `.github/prompts/update-candidate.prompt.md`.
- Emphasize "you are the model, not a meta-coordinator" — Copilot's
  default tendency is to plan work, which would defeat the purpose.
- Reference the red flags in
  `docs/specs/analysis/editorial-principles.md` and
  `prompts/analyze-candidate.md` §8 (adversarial pass) so the agent
  knows to produce a genuine self-critique.

## Editorial check

- [ ] Prompt instructs the agent to **load the canonical prompt file
      verbatim**, not to paraphrase or restate it
- [ ] Compact editorial-principles reminder matches the wording in
      `docs/specs/analysis/editorial-principles.md` (no drift)
- [ ] No candidate-specific branching introduced
- [ ] Dissent preservation (adversarial pass) is required, not
      optional

## Notes

These prompts depend on task `0044` (ingest script). Until then, the
prompt's final step is a no-op.
