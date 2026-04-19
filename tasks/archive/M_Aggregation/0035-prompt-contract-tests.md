---
id: "0035"
title: "Prompt-contract tests for prompts/aggregate-analyses.md"
type: task
status: done
priority: medium
created: 2026-04-19
milestone: M_Aggregation
spec: docs/specs/analysis/aggregation.md
context:
  - docs/specs/analysis/aggregation.md
  - docs/specs/analysis/editorial-principles.md
  - prompts/aggregate-analyses.md
  - prompts/analyze-candidate.md
  - scripts/lib/hash.ts
  - scripts/lib/prompt-contract.test.ts
test_command: npm run test -- prompt
depends_on: ["0033"]
---

## Context

The aggregator prompt is a versioned editorial artifact. The same drift risks apply as for `analyze-candidate.md` — with one addition: the aggregator is the place where dissent is most likely to collapse into prose hedging. Contract tests must defend against that.

Pattern reference: task `0025` did this for the per-model prompt; reuse its test structure.

## Objectives

1. Add a test suite (co-located with the existing `scripts/lib/prompt-contract.test.ts` or a sibling file) with assertions on `prompts/aggregate-analyses.md`:
   - Required section headings present (Role, Inputs, Editorial principles, Aggregation rules, Dissent vs consensus, Intergenerational aggregation, Banned language, Output format).
   - Frontmatter has `version: "1.0"` and `status: stable`.
   - File contains **no candidate names** from the banned list (Macron, Le Pen, Mélenchon, Zemmour, Bardella, Attal, Philippe, Ciotti, Bellamy, …) outside any reference-anchors block.
   - File contains **no banned moral verbs** in instruction position: `sacrifice`, `steal`, `betray`, `rescue`, `save`, `crush`, `generous` (as verdict), `devastating`. If any appear, they must be inside a clearly-delimited "NEVER USE THESE WORDS:" block.
   - File explicitly forbids producing a positioning `score` field in its "Aggregation rules" or "Output format" section (regex search for a prohibition clause — wording-flexible but presence required).
   - File explicitly forbids arithmetic-mean averaging of positioning (similar regex).
   - File explicitly instructs the aggregator to flag (not publish) claims unsupported by `sources.md`.
   - File ends with exactly one trailing newline.
   - Hashing via `hashFile` is deterministic.
2. Snapshot-style hash test: `prompts/aggregate-analyses.sha256.txt` committed; CI asserts file matches.

## Acceptance Criteria

- [ ] All structural assertions above covered
- [ ] Tests fail when a banned moral verb is injected as an instruction (verified manually)
- [ ] Tests fail when the "no score field" prohibition is removed (verified manually)
- [ ] `prompts/aggregate-analyses.sha256.txt` committed
- [ ] `npm run test -- prompt` passes
- [ ] `npm run lint` clean

## Hints for Agent

- Reuse the banned-name list and moral-verb list from task `0025`'s test file. If that file already exports these as constants, import them; otherwise refactor into a shared `prompts/banned-vocab.ts` and update both test suites — but only if the refactor is small.
- For the "no score field" check, a regex like `/no\s+.{0,30}score.{0,30}field/i` or similar phrase search is sufficient; the spec for task `0033` requires the prompt to contain an explicit prohibition.
- Keep the contract tests wording-flexible: assert prohibitions by anchor keywords, not exact sentences.

## Editorial check

- [ ] The "no cardinal averaging of positioning" rule is defended by at least two independent contract assertions (no score field + no arithmetic mean)
- [ ] The "dissent is structural, not prose" rule is defended (at minimum, the "Dissent vs consensus" section must exist and must contain the words `supported_by` and `dissenters`)
- [ ] Running with the placeholder prompt (pre-task-0033) must fail — confirms the tests actually gate the promotion
