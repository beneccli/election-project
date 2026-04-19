# Analysis output fixtures

Regression fixtures for `AnalysisOutputSchema` (see
[`../../schema.ts`](../../schema.ts) and
[`docs/specs/analysis/output-schema.md`](../../../../docs/specs/analysis/output-schema.md)).

All fixtures describe a **synthetic, fictional candidate** ("Jean Synthèse" /
"Parti Fictif", `candidate_id: test-candidate`). They must never be confused
with a real 2027 candidate and must never appear in `candidates/`.

## Files

| File | Purpose |
|------|---------|
| `builder.ts` | Programmatic source of truth — `buildValidAnalysisOutput()` |
| `valid-full.json` | All arrays populated, every optional path exercised |
| `valid-minimal.json` | Empty arrays where schema allows — smallest passing shape |
| `valid-not-addressed.json` | Two dimensions graded `NOT_ADDRESSED` (absence finding) |
| `invalid-missing-source-refs.json` | `problems_addressed[0].source_refs` empty — violates `.min(1)` |
| `invalid-positioning-out-of-range.json` | `positioning.economic.score = 7` (>5) |
| `invalid-positioning-non-integer.json` | `positioning.economic.score = 1.5` |
| `invalid-grade-enum.json` | `dimensions.economic_fiscal.grade = "A+"` |
| `invalid-confidence-out-of-range.json` | `confidence_self_assessment = 1.5` |

## Round-trip test

See [`../../fixtures.test.ts`](../../fixtures.test.ts). Every `valid-*.json`
must parse; every `invalid-*.json` must throw `ZodError` with an issue path
matching the intended violation.
