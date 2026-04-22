---
id: "0104"
title: "Regenerate test-omega fixtures with overall_spectrum; update fixture-based tests"
type: task
status: open
priority: high
created: 2026-04-22
milestone: M_PoliticalSpectrum
spec: docs/specs/analysis/political-spectrum-label.md
context:
  - candidates/test-omega/
  - scripts/pipeline.integration.test.ts
  - scripts/lib/fixtures.test.ts
  - scripts/lib/fixtures.aggregated.test.ts
  - scripts/prepare-manual-analysis.ts
  - scripts/prepare-manual-aggregation.ts
  - scripts/ingest-raw-output.ts
  - scripts/ingest-aggregated.ts
depends_on:
  - "0100"
  - "0101"
  - "0102"
---

## Context

After the schema bump (0100) and prompt updates (0101, 0102), the
`test-omega` fixture candidate's raw outputs and aggregated.json
must carry the new `overall_spectrum` field for `schema_version:
"1.2"`. Integration and fixture tests must be updated to expect
it. See spec §9.

## Objectives

1. Regenerate `candidates/test-omega/current/raw-outputs/*.json`
   via the canonical path — mock-provider run OR manual-bundle
   regeneration followed by ingestion. Each raw output must
   include `positioning.overall_spectrum` with all required
   fields; pick values consistent with the fictional candidate's
   axis scores already present in the fixture.
2. Regenerate `candidates/test-omega/current/aggregated.json` via
   the aggregation path so `positioning.overall_spectrum` and
   `agreement_map.positioning_consensus.overall_spectrum` are
   present and consistent.
3. Use at least three distinct labels across the mock models so
   `dissent[]` is non-empty and `modal_label` is the clear
   plurality. Include at least one model emitting `inclassable`
   to exercise the escape hatch.
4. Update `scripts/pipeline.integration.test.ts` to assert the
   presence of `positioning.overall_spectrum` on the aggregated
   output.
5. Update `scripts/lib/fixtures.test.ts` and
   `scripts/lib/fixtures.aggregated.test.ts` to validate against
   the v1.2 schema; unskip any tests temporarily skipped by task
   0100 (`TODO(0104)`).
6. Update `candidates/test-omega/current/metadata.json`
   `schema_version` field if it tracks one.

## Acceptance Criteria

- [ ] Every file in `candidates/test-omega/current/raw-outputs/`
      parses against v1.2 `AnalysisOutputSchema`
- [ ] `candidates/test-omega/current/aggregated.json` parses
      against v1.2 `AggregatedOutputSchema`
- [ ] At least one mock raw output emits `inclassable`
- [ ] `modal_label` in aggregated is a non-null plurality
- [ ] `dissent[]` is non-empty
- [ ] `agreement_map.positioning_consensus.overall_spectrum`
      consistent with `positioning.overall_spectrum`
- [ ] `npm run test` passes end-to-end (no skipped fixture tests)
- [ ] `npm run test:schema` passes

## Hints

- Mock provider lives at `scripts/lib/mock-provider.ts`; it may
  need a small update to emit the new field. Prefer editing the
  mock provider over hand-editing the JSON so regeneration is
  reproducible.
- Do not hand-edit aggregated.json to "fix" a mismatch — either
  fix the raw outputs or regenerate via the aggregator path.

## Editorial check

- [ ] Raw outputs are generated, not hand-forged, so the
      transparency artifact invariant holds (AGENTS.md "Never
      edit files in raw-outputs/")
- [ ] The fixture demonstrates dissent preservation — does not
      artificially force consensus
