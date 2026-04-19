---
id: "0024"
title: "Analysis output fixtures and round-trip validation tests"
type: task
status: open
priority: medium
created: 2026-04-19
milestone: M_AnalysisPrompts
spec: docs/specs/analysis/output-schema.md
context:
  - docs/specs/analysis/output-schema.md
  - docs/specs/analysis/dimensions.md
  - docs/specs/analysis/political-positioning.md
  - scripts/lib/schema.ts
  - scripts/lib/schema.test.ts
test_command: npm run test -- fixture
depends_on: ["0022"]
---

## Context

Task `0022` implements `AnalysisOutputSchema`. This task creates **concrete fixture JSON** files — one full valid example plus several invalid variants — that downstream code, tests, and future schema migrations validate against.

Fixtures are the regression safety net: any schema change that breaks them is caught immediately.

## Objectives

1. Create `scripts/lib/fixtures/analysis-output/` containing:
   - `valid-full.json` — complete, richly populated analysis output (synthetic candidate, fictional party). Every field populated; every dimension analyzed; at least one `dissent` and one `flagged` shape included where relevant.
   - `valid-minimal.json` — smallest output that still parses (all required fields, empty arrays where allowed).
   - `valid-not-addressed.json` — a candidate whose program only covers some dimensions; others set to `grade: "NOT_ADDRESSED"` with the required "not addressed" evidence handling.
   - `invalid-missing-source-refs.json` — a claim missing its `source_refs`.
   - `invalid-positioning-out-of-range.json` — economic axis score = 7.
   - `invalid-positioning-non-integer.json` — economic axis score = 1.5.
   - `invalid-grade-enum.json` — grade = "A+" (not in enum).
   - `invalid-confidence-out-of-range.json` — confidence = 1.5.
   - `invalid-advocacy-verb.json` — (optional, content-level check — skip if not enforceable in schema)
2. Add `scripts/lib/fixtures.test.ts`:
   - Every `valid-*.json` parses via `AnalysisOutputSchema.parse`
   - Every `invalid-*.json` throws with a `ZodError` whose `.issues[]` points at the expected field
3. Fixtures use a synthetic candidate ID (e.g., `test-candidate`) and a fictional party — never a real 2027 candidate. Document this in a header comment inside each fixture.

## Acceptance Criteria

- [ ] ≥3 valid fixtures and ≥4 invalid fixtures created
- [ ] `valid-full.json` populates every field of the schema (no `undefined` for optionals unless explicitly testing absence)
- [ ] Tests pass: `npm run test -- fixture`
- [ ] No real candidate names appear in fixtures
- [ ] `npm run typecheck` clean
- [ ] `npm run lint` clean

## Hints for Agent

- Use a placeholder candidate: `id: "test-candidate"`, `display_name: "Jean Synthèse"`, `party: "Parti Fictif"`.
- `source_refs` in fixtures point to `sources.md#fictional-section` — not real sources.
- Keep fixtures checked into git so they serve as documentation of the schema.
- The `valid-full.json` fixture will also be consumed by task `0026` (mock-provider end-to-end test).

## Editorial check

- [ ] No real candidate mentioned in any fixture
- [ ] Intergenerational section in `valid-full.json` uses measurement language only (no banned moral verbs) — the fixture models the editorial principle for future contributors
