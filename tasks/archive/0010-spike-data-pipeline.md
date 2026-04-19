---
id: "0010"
title: "Spike: M_DataPipeline — Pipeline scaffolding, schemas, and script skeletons"
type: spike
status: done
priority: high
created: 2026-04-19
milestone: M_DataPipeline
spec: null  # Will produce: docs/specs/data-pipeline/overview.md (update), docs/specs/candidates/repository-structure.md (update)
context:
  - docs/specs/data-pipeline/overview.md
  - docs/specs/data-pipeline/source-gathering.md
  - docs/specs/data-pipeline/update-workflow.md
  - docs/specs/candidates/repository-structure.md
  - docs/specs/analysis/output-schema.md
  - docs/specs/analysis/editorial-principles.md
  - scripts/README.md
  - prompts/README.md
depends_on: []
---

## Goal

Define the canonical per-candidate folder structure, versioning scheme, and script skeletons so the pipeline is **executable end-to-end** — even if with mock LLM responses initially.

This spike answers:
- What is the exact file layout and naming?
- What Zod schemas validate every JSON artifact?
- What are the script signatures and CLI interfaces?
- How is prompt hashing computed?
- What does version metadata look like precisely?
- How does the `current` symlink work?

## Research Questions

1. **Symlink vs. manifest for `current` version?** → Decided: symlink (see repository-structure.md). Spike confirms.
2. **Should `consolidate.ts` call an LLM or purely concatenate?** → Decided: LLM with mandatory human review (see overview.md). Spike confirms.
3. **Prompt hash calculation method?** → SHA256 of prompt file content at run time.
4. **Where does structured metadata live?** → Per-version `metadata.json`. Spike confirms exact schema.
5. **What editorial principles constrain the pipeline?** → Prompt versioning, human review gates, schema validation, no raw-output editing.

## Existing Context

Substantial draft specs already exist:
- `docs/specs/data-pipeline/overview.md` — 5-stage pipeline (Ingest → Consolidate → Analyze → Aggregate → Publish)
- `docs/specs/data-pipeline/source-gathering.md` — primary source definition and capture format
- `docs/specs/data-pipeline/update-workflow.md` — candidate update process
- `docs/specs/candidates/repository-structure.md` — per-candidate folder layout
- `docs/specs/analysis/output-schema.md` — per-model JSON output structure

These drafts are thorough. The spike's job is to:
1. Resolve remaining open questions
2. Promote specs from "Draft" to "Stable"
3. Break implementation into concrete tasks

## Deliverables

1. **Updated spec documents** (Draft → Stable):
   - `docs/specs/data-pipeline/overview.md` — resolve open questions, finalize
   - `docs/specs/candidates/repository-structure.md` — resolve open questions, finalize

2. **Backlog tasks** in `tasks/backlog/M_DataPipeline/`:
   - Project bootstrap (package.json, tsconfig, tooling)
   - Zod schemas for all JSON artifacts (metadata, version metadata)
   - Utility library (hash, logger, validation helpers)
   - LLM provider abstraction
   - Script skeletons with CLI interfaces
   - Candidate folder scaffolding command
   - Integration test with mock LLM responses

3. **ROADMAP.md** updated with M_DataPipeline status

## Open Questions Resolved

### From overview.md:
- Error handling: scripts are idempotent, re-runs are safe, `--force` overrides
- Cost tracking: logged per LLM call, totals in metadata.json
- Schema validation halts pipeline on violation

### From source-gathering.md:
- Debate transcripts: yes, include for official debates the candidate participated in
- Party-platform candidates: link to party platform, note relationship in metadata
- Interview positions: include with lower confidence marker if contradictory to manifesto
- Git vs. git-lfs: plain git for v1, migrate if size > 100MB per candidate

### From repository-structure.md:
- Symlink confirmed over manifest file (filesystem tools resolve naturally)
- `sources.md` structure finalized with required sections matching dimension clusters

### From update-workflow.md:
- Manual publication only (no auto-schedule for v1)
- No auto-notification of new documents for v1

## Acceptance Criteria

- [x] Existing spec documents reviewed
- [x] Open questions resolved and documented in specs
- [x] Spec status promoted to Stable where appropriate
- [x] At least 7 tasks created in `tasks/backlog/M_DataPipeline/`
- [x] Tasks cover: project init, schemas, utilities, provider abstraction, each script, tests
- [x] Each task has clear acceptance criteria
- [x] No circular dependencies in task graph
- [x] ROADMAP.md updated

## Editorial Principles Check

- ✅ Human review gates preserved at consolidation and aggregation stages
- ✅ Raw outputs are immutable (never edited)
- ✅ Prompt versioning with SHA256 hashing
- ✅ Schema validation halts pipeline (no silent drift)
- ✅ Every claim carries source_refs
- ✅ No asymmetry between candidates (same pipeline for all)

## Notes

No `package.json` exists yet — the first task must bootstrap the project. The scripts/ and prompts/ folders contain only READMEs.
