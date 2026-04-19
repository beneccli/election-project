---
id: "0043"
title: "Manual-mode prepare scripts: prepare-manual-analysis and prepare-manual-aggregation"
type: task
status: open
priority: high
created: 2026-04-19
milestone: M_AnalysisModes
spec: docs/specs/data-pipeline/analysis-modes.md
context:
  - docs/specs/data-pipeline/analysis-modes.md
  - scripts/analyze.ts
  - scripts/aggregate.ts
  - scripts/lib/hash.ts
  - scripts/lib/paths.ts
  - prompts/analyze-candidate.md
  - prompts/aggregate-analyses.md
test_command: npm run test -- prepare-manual
depends_on: ["0041"]
---

## Context

Manual mode starts with an operator-facing bundle generator. The script
packages the canonical prompt + sources into a single copy-pasteable
text file and writes per-UI instructions, without any network calls.

## Objectives

1. Create `scripts/prepare-manual-analysis.ts`:
   - CLI: `--candidate <id> --version <date> [--force]`
   - Reads `prompts/analyze-candidate.md`, strips YAML frontmatter,
     computes SHA256.
   - Reads `candidates/<id>/versions/<date>/sources.md`.
   - Writes `candidates/<id>/versions/<date>/_manual/prompt-bundle.txt`
     following the format in
     `docs/specs/data-pipeline/analysis-modes.md` ("prompt-bundle.txt
     format" section).
   - Copies `sources.md` to `_manual/sources.md` for chat-UI upload.
   - Writes `_manual/README.md` with step-by-step instructions for
     ChatGPT, Claude.ai, and Gemini (file upload vs. paste, expected
     output format, ingest command template).
   - Writes `_manual/expected-filenames.txt` listing the supported
     model slugs and how to derive the filename (e.g.
     `claude-opus-4-1.json`).
   - Refuses to write if `_manual/` exists non-empty without `--force`.
2. Create `scripts/prepare-manual-aggregation.ts`:
   - Same pattern, bundling `prompts/aggregate-analyses.md` + all
     existing `raw-outputs/*.json` + `sources.md`.
   - Output under
     `candidates/<id>/versions/<date>/_manual-aggregation/`.
3. Ensure the generated `_manual/` and `_manual-aggregation/` folders
   (except `README.md`) are `.gitignore`'d — add entries to
   `.gitignore`.
4. Unit tests cover: correct bundle structure, SHA256 included and
   matches file, sources content present verbatim, refuses overwrite
   without `--force`.

## Acceptance Criteria

- [ ] `prepare-manual-analysis.ts` exists and runs end-to-end on a
      scaffolded candidate
- [ ] `prepare-manual-aggregation.ts` exists and runs when
      `raw-outputs/` is non-empty
- [ ] Both write the expected files with correct content
- [ ] SHA256 in the bundle matches the on-disk prompt file
- [ ] `.gitignore` updated
- [ ] Tests pass: `npm run test -- prepare-manual`
- [ ] `npm run lint` and `npm run typecheck` clean

## Hints for Agent

- Reuse `hashString` from `scripts/lib/hash.ts` (SHA256 of UTF-8 bytes).
- Use `scripts/lib/paths.ts` helpers for directory construction.
- Frontmatter stripping: match `^---\n[\s\S]*?\n---\n` once at start.
- The prompt bundle is a text artifact — use `\n` line endings
  explicitly.

## Editorial check

- [ ] The bundle contains the **verbatim** body of
      `prompts/analyze-candidate.md`. Do not reformat, do not paraphrase.
- [ ] The bundle records the prompt SHA256 the operator is expected to
      pass into ingest — so drift is detectable.

## Notes

These scripts make no LLM calls. They are pure file transforms.
