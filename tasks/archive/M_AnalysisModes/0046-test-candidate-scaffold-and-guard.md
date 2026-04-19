---
id: "0046"
title: "Test-candidate scaffolding: is_fictional flag, publish guard, scaffold prompt"
type: task
status: open
priority: high
created: 2026-04-19
milestone: M_AnalysisModes
spec: docs/specs/data-pipeline/analysis-modes.md
context:
  - docs/specs/data-pipeline/analysis-modes.md
  - scripts/scaffold-candidate.ts
  - scripts/scaffold-candidate.test.ts
  - scripts/publish.ts
  - scripts/publish.test.ts
  - scripts/lib/schema.ts
test_command: npm run test -- scaffold-candidate publish
depends_on: ["0042"]
---

## Context

Operators need a cheap way to create a fictional candidate for pipeline
testing, and a hard guard that prevents such a candidate from being
published to production by accident.

## Objectives

1. Extend `scripts/scaffold-candidate.ts`:
   - Add `--is-fictional` flag.
   - When set: write `is_fictional: true` into
     `candidates/<id>/metadata.json`.
   - When set: enforce ID prefix `test-` — refuse to scaffold
     non-prefixed IDs with `--is-fictional`, and refuse to scaffold
     `test-*` IDs **without** `--is-fictional` (symmetric guard).
   - When set: write a placeholder `sources.md.draft` with the
     fictional-banner paragraph from the spec at the top.
2. Extend `scripts/publish.ts` with a pre-flight guard:
   - Read `candidates/<id>/metadata.json`.
   - If `is_fictional === true` and `--allow-fictional` not passed,
     exit 1 with a clear error message.
   - If `--allow-fictional` is passed, log a loud warning and proceed.
3. Create `.github/prompts/generate-test-candidate.prompt.md`:
   - Drives Copilot to prompt the operator for a fictional candidate
     name + party.
   - Enforces the `test-` prefix.
   - Runs `scripts/scaffold-candidate.ts` with `--is-fictional`.
   - Prints a next-step pointer to
     `prompts/fixtures/generate-test-sources.md` (produced by task
     `0047`).
4. Update tests:
   - `scaffold-candidate.test.ts`: cover both guards (non-prefixed ID
     with `--is-fictional` rejected; `test-` ID without
     `--is-fictional` rejected; `test-` + `--is-fictional` succeeds).
   - `publish.test.ts`: cover publish refused on fictional candidate;
     publish succeeds with `--allow-fictional`.

## Acceptance Criteria

- [ ] `scaffold-candidate --is-fictional --id test-foo --name ...` produces
      metadata with `is_fictional: true`
- [ ] `scaffold-candidate --is-fictional --id foo --name ...` fails
- [ ] `scaffold-candidate --id test-foo --name ...` (no flag) fails
- [ ] `publish.ts` refuses fictional candidate without
      `--allow-fictional`
- [ ] `publish.ts` proceeds with `--allow-fictional` and logs a warning
- [ ] `.github/prompts/generate-test-candidate.prompt.md` exists and
      documents the workflow
- [ ] All tests pass: `npm run test -- scaffold-candidate publish`
- [ ] `npm run lint` and `npm run typecheck` clean

## Hints for Agent

- The "symmetric guard" (test-prefix ↔ fictional flag) prevents
  accidents: you cannot create a real candidate with `test-` prefix,
  and you cannot create a fictional candidate without the prefix. This
  keeps visual distinction reliable.
- The `sources.md.draft` banner wording comes directly from the spec
  ("Test-candidate scaffolding" section).

## Editorial check

- [ ] Fictional candidates are visually distinguishable in `sources.md`
      via banner (for humans) and in metadata via flag (for tooling)
- [ ] No path allows a fictional candidate to become `current` without
      an explicit override flag
- [ ] The symmetric ID-prefix rule prevents silent renames from
      laundering fictional content into real IDs

## Notes

Schema support for `is_fictional` is delivered by task `0042`. The
publish guard test will require that task to be merged first.
