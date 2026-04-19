---
id: "0015"
title: "Script skeleton: consolidate.ts (sources-raw → sources.md.draft)"
type: task
status: open
priority: medium
created: 2026-04-19
milestone: M_DataPipeline
spec: docs/specs/data-pipeline/overview.md
context:
  - docs/specs/data-pipeline/overview.md
  - docs/specs/data-pipeline/source-gathering.md
  - docs/specs/candidates/repository-structure.md
  - prompts/README.md
test_command: npm run test -- consolidate
depends_on: ["0011", "0012", "0013", "0014"]
---

## Context

Stage 2 of the pipeline: take `sources-raw/` files and produce a `sources.md.draft` via an LLM call. The human reviews the draft before it becomes `sources.md`. This task creates the script with real LLM integration but the prompt file itself is deferred to M_AnalysisPrompts — use a placeholder prompt for now.

## Objectives

1. **`scripts/consolidate.ts`** — CLI entry point
   - CLI: `npm run consolidate -- --candidate <id> --version <date> [--force] [--dry-run] [--verbose]`
   - Validates that `sources-raw/` exists and is non-empty
   - Reads all source files from `sources-raw/` (text extraction for supported formats)
   - Reads consolidation prompt from `prompts/consolidate-sources.md` (or placeholder)
   - Calls a single LLM with the prompt + source content
   - Writes output to `sources.md.draft`
   - Computes and records prompt SHA256 in version `metadata.json`
   - **Does NOT overwrite an existing `sources.md`** — only produces `.draft`
   - Logs a clear message: "Draft produced. Human review required before proceeding."

2. **Placeholder prompt** — `prompts/consolidate-sources.md`
   - Minimal placeholder with correct YAML frontmatter structure
   - Will be replaced by M_AnalysisPrompts with the real prompt
   - Good enough to produce recognizable output for integration testing

3. **Text extraction helpers** (in `scripts/lib/`)
   - Read `.txt`, `.md` files directly
   - Read `.pdf` files — basic extraction (use `pdf-parse` or similar, or stub with "PDF extraction not yet implemented")
   - Read `.meta.json` to get source metadata

4. **Tests** — `consolidate.test.ts`
   - Mock LLM provider returns a structured markdown response
   - Script writes `sources.md.draft` (not `sources.md`)
   - Script does not proceed if `sources-raw/` is empty
   - Script does not overwrite existing `sources.md`
   - Prompt SHA256 is correctly recorded

## Acceptance Criteria

- [ ] CLI parses arguments correctly
- [ ] Reads source files from `sources-raw/`
- [ ] Calls LLM provider with prompt + sources
- [ ] Writes `sources.md.draft` to correct location
- [ ] Does NOT produce `sources.md` directly
- [ ] Records prompt SHA256 in metadata
- [ ] Placeholder prompt file exists with proper frontmatter
- [ ] All tests pass (with mock provider): `npm run test -- consolidate`
- [ ] No lint errors: `npm run lint`
- [ ] No type errors: `npm run typecheck`

## Hints for Agent

- The consolidation prompt is a single LLM call, not multi-turn
- For PDF extraction, a stub that returns "PDF content extraction pending" is acceptable for v1
- The human review gate is procedural (rename `.draft` to final) — no code enforces it, but the script MUST NOT auto-rename

## Editorial check (if applicable)

- [ ] Prompts in `prompts/` — does this change analysis behavior? → Placeholder only; real prompt is M_AnalysisPrompts scope
