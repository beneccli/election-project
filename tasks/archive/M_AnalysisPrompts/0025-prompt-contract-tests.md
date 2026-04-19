---
id: "0025"
title: "Prompt-contract tests for prompts/analyze-candidate.md"
type: task
status: done
priority: medium
created: 2026-04-19
milestone: M_AnalysisPrompts
spec: docs/specs/analysis/analysis-prompt.md
context:
  - docs/specs/analysis/analysis-prompt.md
  - docs/specs/analysis/editorial-principles.md
  - prompts/analyze-candidate.md
  - scripts/lib/hash.ts
test_command: npm run test -- prompt
depends_on: ["0023"]
---

## Context

The analysis prompt is a versioned editorial artifact. Silent drift — a word removed, a section reordered, a moral verb slipping in — is the failure mode we most need to catch.

This task adds a test suite that asserts **structural contracts** on `prompts/analyze-candidate.md` without coupling the test to exact wording (which will evolve).

## Objectives

1. Create `prompts/analyze-candidate.contract.test.ts` (or `scripts/lib/prompt-contract.test.ts` — author chooses) with tests that:
   - Required section headings are present (Role, Principles, Source material, Dimensions, Output structure, Evidence citations, Confidence scores, Adversarial pass, Positioning).
   - Frontmatter has `version` and `status: stable`.
   - File contains no candidate names from a banned list (Macron, Le Pen, Mélenchon, Zemmour, Bardella, Attal, Philippe, Ciotti, Bellamy, …) **outside the positioning anchors section**. (Anchors are allowed to reference these figures by name as historical reference points.)
   - File contains no banned moral verbs when used as instructions (`sacrifice`, `steal`, `betray`, `rescue`, `save`, `crushing`, `generous` as verdict). If any appear, the test permits them only inside a clearly-delimited "AVOID THIS LANGUAGE:" block.
   - File ends with exactly one trailing newline (SHA256 stability).
   - Hashing the file via `hashFile` from `scripts/lib/hash.ts` is deterministic (run twice, same hash).
2. Add a snapshot-style test that records the current SHA256 of the prompt in a committed file `prompts/analyze-candidate.sha256.txt`. CI asserts the file matches. This does **not** prevent updates — it forces every prompt change to also update the hash file, making the change reviewable.

## Acceptance Criteria

- [ ] Test file exists and runs under `npm run test -- prompt`
- [ ] All 6 structural assertions above covered
- [ ] `prompts/analyze-candidate.sha256.txt` committed with the current hash
- [ ] Updating the prompt without updating the hash file makes the test fail (verified manually)
- [ ] Tests pass: `npm run test -- prompt`
- [ ] `npm run lint` clean

## Hints for Agent

- Use `readFile` from `node:fs/promises` and regex / `includes()` for section checks. No heavy parsing needed.
- Read the prompt once per test suite, not per test (`beforeAll`).
- For the anchor-section exception, define the positioning section by its heading and slice the file content excluding that section before running the banned-name check.
- The `sha256.txt` file is a one-line lowercase hex string plus trailing newline.

## Editorial check

- [ ] Prompts — this test **defends** editorial principles by catching drift. Verify it would actually catch a concrete drift: e.g., delete the "Adversarial pass" heading locally → test must fail.
- [ ] No asymmetry — the banned-names list is applied uniformly, not conditionally.
