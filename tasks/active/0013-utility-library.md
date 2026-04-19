---
id: "0013"
title: "Utility library: hash, logger, validation, file helpers"
type: task
status: open
priority: high
created: 2026-04-19
milestone: M_DataPipeline
spec: docs/specs/data-pipeline/overview.md
context:
  - scripts/README.md
  - docs/specs/data-pipeline/overview.md
  - docs/specs/candidates/repository-structure.md
test_command: npm run test -- lib
depends_on: ["0011"]
---

## Context

Pipeline scripts need shared utilities: SHA256 hashing, structured logging, schema validation with useful errors, and helpers for resolving candidate/version paths. These belong in `scripts/lib/` and are used by every pipeline script.

## Objectives

1. **`scripts/lib/hash.ts`** — SHA256 utilities
   - `hashFile(filePath: string): Promise<string>` — SHA256 of file contents
   - `hashString(content: string): string` — SHA256 of a UTF-8 string
   - Uses Node.js `crypto` module
   - Returns lowercase hex string

2. **`scripts/lib/logger.ts`** — Structured logger
   - Wraps `pino` (or lightweight alternative)
   - Default level: `info`, override via `--verbose` flag or `LOG_LEVEL` env var
   - Includes `timestamp`, `level`, `msg`, plus arbitrary context fields
   - No `console.log` in pipeline code — all logging through this

3. **`scripts/lib/validate.ts`** — Schema validation helpers
   - `validateAndWrite<T>(schema: ZodSchema<T>, data: unknown, outputPath: string): Promise<T>` — validates then writes JSON
   - `validateOrThrow<T>(schema: ZodSchema<T>, data: unknown, label: string): T` — validates or throws with context
   - On failure: logs the Zod error path + message, throws a typed `ValidationError`

4. **`scripts/lib/paths.ts`** — Candidate/version path resolution
   - `candidateDir(candidateId: string): string` — resolves `candidates/<id>/`
   - `versionDir(candidateId: string, versionDate: string): string` — resolves `candidates/<id>/versions/<date>/`
   - `currentVersionDir(candidateId: string): string` — resolves via `current` symlink
   - `rawOutputsDir(candidateId: string, versionDate: string): string`
   - Validates path existence where appropriate

5. **Tests** for each module in colocated test files (`hash.test.ts`, etc.)

## Acceptance Criteria

- [ ] `hashFile` produces correct SHA256 for a known test fixture
- [ ] `hashString` produces correct SHA256 for known inputs
- [ ] Logger outputs structured JSON, respects log level
- [ ] `validateAndWrite` writes valid JSON and rejects invalid data
- [ ] `validateOrThrow` throws `ValidationError` with field-level details
- [ ] Path helpers resolve correct paths relative to project root
- [ ] All tests pass: `npm run test -- lib`
- [ ] No lint errors: `npm run lint`
- [ ] No type errors: `npm run typecheck`

## Hints for Agent

- Use `import { createHash } from 'node:crypto'`
- For path resolution, use `import.meta.url` or a project root constant
- Keep logger simple — pino with `pino-pretty` for dev, JSON for production
- `ValidationError` should extend `Error` and include the Zod issues array
