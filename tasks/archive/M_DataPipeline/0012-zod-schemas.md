---
id: "0012"
title: "Zod schemas for pipeline JSON artifacts"
type: task
status: open
priority: high
created: 2026-04-19
milestone: M_DataPipeline
spec: docs/specs/candidates/repository-structure.md
context:
  - docs/specs/analysis/output-schema.md
  - docs/specs/candidates/repository-structure.md
  - docs/specs/data-pipeline/source-gathering.md
test_command: npm run test -- schema
depends_on: ["0011"]
---

## Context

Every JSON artifact in the pipeline must be validated against a Zod schema before writing to disk (see `docs/specs/data-pipeline/overview.md`). The schemas are the single source of truth for data structures. This task covers the **pipeline infrastructure schemas** — the analysis output schema and aggregated output schema are deferred to M_AnalysisPrompts and M_Aggregation respectively.

## Objectives

1. Create `scripts/lib/schema.ts` with Zod schemas for:

   a. **`CandidateMetadataSchema`** — top-level `candidates/<id>/metadata.json`
      - `id` (kebab-case string)
      - `display_name`, `party`, `party_id`
      - `photo_url`, `photo_credit`
      - `declared_candidate_date` (ISO date string)
      - `official_website` (URL)
      - `created`, `updated` (ISO date strings)

   b. **`SourceMetaSchema`** — `sources-raw/*.meta.json`
      - `origin_url` (URL string)
      - `accessed_at` (ISO-8601)
      - `sha256` (hex string, 64 chars)
      - `notes` (optional string)
      - `license` (optional string)

   c. **`VersionMetadataSchema`** — `versions/<date>/metadata.json`
      - `candidate_id`, `version_date`, `schema_version`
      - `sources` block: consolidation method, prompt SHA256, sources.md SHA256, reviewer info
      - `analysis` block: prompt file, prompt SHA256, prompt version, per-model entries (provider, exact version, temperature, timestamps, token counts, cost estimate, status)
      - `aggregation` block: prompt info, aggregator model info, human review status
      - `total_cost_estimate_usd` (number)

2. Export TypeScript types derived from schemas (`z.infer<typeof ...>`)

3. Create `scripts/lib/schema.test.ts` with tests:
   - Valid fixtures parse successfully
   - Invalid fixtures (missing required fields, wrong types) fail with useful errors
   - Edge cases: empty optional fields, boundary values

## Acceptance Criteria

- [ ] `CandidateMetadataSchema` validates the example from repository-structure.md spec
- [ ] `SourceMetaSchema` validates the example from source-gathering.md spec
- [ ] `VersionMetadataSchema` validates the example from repository-structure.md spec
- [ ] TypeScript types are exported alongside schemas
- [ ] At least 3 valid and 3 invalid fixture tests per schema
- [ ] All tests pass: `npm run test -- schema`
- [ ] No lint errors: `npm run lint`
- [ ] No type errors: `npm run typecheck`

## Hints for Agent

- Use `z.object()`, `z.string().regex()` for SHA256, `z.string().date()` for dates
- The analysis output schema (`AnalysisOutputSchema`) is NOT in scope here — it belongs to M_AnalysisPrompts
- Keep placeholder exports: `export const AnalysisOutputSchema = z.any()` and `export const AggregatedOutputSchema = z.any()` so downstream code can import them
- See `docs/specs/candidates/repository-structure.md` for the exact JSON structures

## Editorial check (if applicable)

- [ ] Schemas — does this preserve evidence/source_refs? → N/A for infrastructure schemas (analysis schemas checked in M_AnalysisPrompts)
