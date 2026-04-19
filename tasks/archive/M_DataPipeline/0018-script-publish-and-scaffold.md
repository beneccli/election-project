---
id: "0018"
title: "Script skeleton: publish.ts + candidate scaffolding command"
type: task
status: open
priority: medium
created: 2026-04-19
milestone: M_DataPipeline
spec: docs/specs/data-pipeline/overview.md
context:
  - docs/specs/data-pipeline/overview.md
  - docs/specs/candidates/repository-structure.md
test_command: npm run test -- publish
depends_on: ["0011", "0012", "0013"]
---

## Context

Stage 5 of the pipeline: update the `current` symlink and verify all artifacts are valid. Also includes a scaffolding command to set up a new candidate's folder structure.

## Objectives

1. **`scripts/publish.ts`** — CLI entry point
   - CLI: `npm run publish -- --candidate <id> --version <date> [--dry-run] [--verbose]`
   - Validates:
     - `aggregated.json` exists (not `.draft`) and passes schema validation
     - Version `metadata.json` exists and has `aggregation.human_review_completed: true`
     - `sources.md` exists (not `.draft`)
   - Updates `candidates/<id>/current` symlink → `versions/<date>/`
   - Updates `candidates/<id>/metadata.json` `updated` field
   - Logs what it did (suitable for git commit message)
   - `--dry-run`: validate everything but don't update symlink

2. **`scripts/scaffold-candidate.ts`** — New candidate setup
   - CLI: `npm run scaffold-candidate -- --id <candidate-id> --name "Display Name" --party "Party" [--date <version-date>]`
   - Creates:
     - `candidates/<id>/metadata.json` (from template)
     - `candidates/<id>/versions/<date>/sources-raw/` (empty dir with `.gitkeep`)
     - `candidates/<id>/versions/<date>/metadata.json` (skeleton)
   - Validates candidate ID format (kebab-case, lowercase, ASCII)
   - Refuses to overwrite existing candidate

3. **Tests**
   - `publish.test.ts`:
     - Refuses to publish without `aggregated.json`
     - Refuses to publish without human review flag
     - Creates correct symlink
     - `--dry-run` does not modify filesystem
   - `scaffold-candidate.test.ts`:
     - Creates correct directory structure
     - Creates valid `metadata.json`
     - Refuses invalid candidate ID format
     - Refuses to overwrite existing candidate

## Acceptance Criteria

- [ ] `publish.ts` validates all prerequisites before acting
- [ ] Symlink created/updated correctly
- [ ] `--dry-run` mode works
- [ ] `scaffold-candidate.ts` creates correct folder structure
- [ ] Candidate metadata validated against `CandidateMetadataSchema`
- [ ] Version metadata skeleton validated against `VersionMetadataSchema`
- [ ] All tests pass: `npm run test -- publish`
- [ ] No lint errors: `npm run lint`
- [ ] No type errors: `npm run typecheck`

## Hints for Agent

- Use `fs.symlink` with `'dir'` type for cross-platform symlink creation
- Remove existing symlink before creating new one (`fs.unlink` then `fs.symlink`)
- Candidate ID validation: `/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/`
- The scaffold command is a convenience — it could also be done manually per the spec
