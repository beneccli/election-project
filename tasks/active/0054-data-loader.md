---
id: "0054"
title: "Build-time candidate data loader with Zod re-validation"
type: task
status: open
priority: high
created: 2026-04-19
milestone: M_WebsiteCore
spec: docs/specs/website/nextjs-architecture.md
context:
  - docs/specs/website/nextjs-architecture.md
  - scripts/lib/schema.ts
  - candidates/test-omega/current/aggregated.json
  - candidates/test-omega/current/metadata.json
  - candidates/test-omega/metadata.json
test_command: pnpm --filter site test
depends_on: ["0052"]
---

## Context

Implement the build-time data loader — the boundary between the pipeline's
JSON artifacts and the site's component tree. The loader reads
`candidates/<id>/current/aggregated.json` and `metadata.json`, revalidates
against `AggregatedOutputSchema` from the pipeline, and returns typed
`CandidateBundle` objects.

See spec §2 for the full contract.

## Objectives

1. Re-export schemas from `site/lib/schema.ts`:
   ```ts
   export { AggregatedOutputSchema } from "@pipeline/schema";
   export type { AggregatedOutput } from "@pipeline/schema";
   ```
2. Implement `site/lib/candidates.ts` per spec §2:
   - `listCandidates(): CandidateIndexEntry[]`
   - `loadCandidate(id: string): CandidateBundle`
   - Custom `CandidateDataError extends Error` with `{ id, path, zodIssues? }`
3. Resolution: `process.env.CANDIDATES_DIR ?? path.resolve(process.cwd(),
   "..", "candidates")`.
4. `loadCandidate` uses `AggregatedOutputSchema.parse` (throws on drift).
   Version metadata is loaded but its schema validation is best-effort in
   v1 (TODO comment referencing future task for a metadata schema).
5. `listCandidates` skips directories with no `current/aggregated.json`
   (non-fatal — scaffolded candidates are expected).
6. Fictional exclusion: when `EXCLUDE_FICTIONAL=1`, `listCandidates` filters
   out entries whose root `metadata.json` has `is_fictional: true`.
7. Setup Vitest for the `site/` package (config extends root where
   reasonable).
8. Write tests in `site/lib/candidates.test.ts`:
   - happy path against real `candidates/test-omega`
   - throws when `current/aggregated.json` is missing
   - throws with Zod issues on a deliberately corrupted aggregated.json
     (use a temp dir with a mutated fixture; do not modify the real file)
   - `EXCLUDE_FICTIONAL=1` removes test-omega from the index

## Acceptance Criteria

- [ ] `listCandidates()` returns at least `test-omega` when run from `site/`
- [ ] `loadCandidate("test-omega")` returns a typed bundle with `aggregated`
      matching `AggregatedOutput`
- [ ] Corrupted fixture throws `CandidateDataError` with `zodIssues` populated
- [ ] All tests pass via `pnpm --filter site test`
- [ ] `npm run typecheck` passes

## Hints for Agent

- The `@pipeline/*` alias is already set up by 0052. Use it; do not
  re-implement schemas.
- Use `fs.readFileSync` + `JSON.parse` — no async needed for build-time
  loaders; App Router RSCs can call sync code.
- For the corrupted-fixture test, copy test-omega into `os.tmpdir()`, mutate
  one required field, set `CANDIDATES_DIR` env var for the duration of that
  test.

## Editorial check

- [ ] Schema drift surfaces as a **hard error**, not a silent fallback
      (editorial principle: transparency, no silent data corruption)
- [ ] Loader never invents fields the schema does not define
