# Aggregated-output fixtures

On-disk JSON fixtures for `AggregatedOutputSchema` (see
[`../../schema.ts`](../../schema.ts) and
[`../../../../docs/specs/analysis/aggregation.md`](../../../../docs/specs/analysis/aggregation.md)).

These files serve two purposes:

1. **Regression tests** — every fixture round-trips through the schema in
   [`../fixtures.aggregated.test.ts`](../fixtures.aggregated.test.ts).
2. **Living documentation** — contributors read these files to see what a
   complete aggregated output looks like.

All candidate content is synthetic. The fictional candidate id is
`test-candidate` and `source_refs` point at `sources.md#fictional-section`.
Historical positioning anchors (Macron 2017, Mélenchon 2022, etc.) are
references, not real 2027 candidates.

## Files

| File | Purpose |
|---|---|
| `valid-full.json` | Fully populated aggregated output with three source models, dissent on one positioning axis, one flagged-for-review item, `coverage_warning: false`. |
| `valid-single-model.json` | Only one model contributed; `coverage: { <A>: complete, <B>: failed, <C>: failed }`; `coverage_warning: true`; every claim's `supported_by` contains only the surviving model; `high_confidence_claims` empty (the N-1 rule collapses when N=1). |
| `invalid-cardinal-positioning.json` | `positioning.economic.score = -2.5` — must be rejected. Permanent documentation of the "no aggregated cardinal score" editorial rule. |
| `invalid-empty-supported-by.json` | A dimension claim with `supported_by: []` — must be rejected. |
| `invalid-reversed-interval.json` | `positioning.economic.consensus_interval = [3, 1]` — must be rejected (min > max). |

## Builder

[`builder.ts`](builder.ts) exports `buildValidAggregatedOutput()`, the
single source of truth for what "a complete valid aggregated output" looks
like. `valid-full.json` is produced by JSON-serializing that builder.
