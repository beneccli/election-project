---
id: "0042"
title: "Extend metadata schema with execution_mode + attestation fields"
type: task
status: open
priority: high
created: 2026-04-19
milestone: M_AnalysisModes
spec: docs/specs/data-pipeline/analysis-modes.md
context:
  - scripts/lib/schema.ts
  - scripts/lib/schema.test.ts
  - scripts/lib/fixtures/analysis-output/
  - docs/specs/candidates/repository-structure.md
test_command: npm run test -- schema
depends_on: ["0041"]
---

## Context

All three execution modes must record, per run, which mode produced the
output and (for non-`api` modes) who attested the model version. The
spec adds four fields to `ModelRunEntry` and `aggregator_model`, plus
`is_fictional` to `CandidateMetadataSchema`.

Current schemas are in `scripts/lib/schema.ts`.

## Objectives

1. Add to `ModelRunEntrySchema`:
   - `execution_mode: z.enum(["api", "manual-webchat", "copilot-agent"])`
   - `attested_by: z.string().min(1).optional()`
   - `attested_model_version: z.string().min(1).optional()`
   - `provider_metadata_available: z.boolean()`
2. Add a **refinement** on `ModelRunEntrySchema`:
   - When `execution_mode !== "api"`, `attested_by` and
     `attested_model_version` are **required**.
   - When `provider_metadata_available === true`,
     `execution_mode === "api"` must hold.
3. Make `tokens_in`, `tokens_out`, `cost_estimate_usd` optional when
   `provider_metadata_available === false` (i.e. allow them to be
   absent for non-api rows). Keep them required for `api` rows via the
   refinement.
4. Mirror the same four fields on
   `VersionMetadataSchema.aggregation.aggregator_model`, with the same
   refinement.
5. Add `is_fictional: z.boolean().optional()` to
   `CandidateMetadataSchema`. Absence means `false`.
6. Update schema tests to cover: valid `api` row, valid
   `manual-webchat` row, valid `copilot-agent` row, invalid rows
   missing required attestation, invalid row claiming
   `provider_metadata_available: true` with `execution_mode:
   "manual-webchat"`.

## Acceptance Criteria

- [ ] Schema updated in `scripts/lib/schema.ts`
- [ ] Existing tests still pass unchanged
- [ ] New tests cover the three modes and the refinement failures
- [ ] `CandidateMetadataSchema` accepts `is_fictional: true/false/absent`
- [ ] `npm run test -- schema` passes
- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes

## Hints for Agent

- Use `.superRefine(...)` on the object schema for cross-field rules,
  not `.refine(...)`, so you can emit path-scoped errors.
- Add `type ExecutionMode = z.infer<...>` export for use in scripts.
- Existing fixtures in `scripts/lib/fixtures/analysis-output/` are for
  the analysis output, not metadata — no need to change them.

## Editorial check

- [ ] The `execution_mode` field is required (not optional) — we
      always know provenance
- [ ] No field allows arbitrary prose that could hide which model was
      used

## Notes

This task is a pure schema + test change. No scripts consume the new
fields yet; that happens in `0043`–`0046`.
