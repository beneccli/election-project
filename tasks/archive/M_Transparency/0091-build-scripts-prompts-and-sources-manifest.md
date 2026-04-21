---
id: "0091"
title: "Build scripts: copy-prompts.ts (content-addressed) + sources-raw/manifest.json"
type: task
status: open
priority: high
created: 2026-04-21
milestone: M_Transparency
spec: docs/specs/website/transparency.md
context:
  - docs/specs/website/transparency.md
  - site/scripts/copy-candidate-artifacts.ts
  - site/package.json
  - prompts/analyze-candidate.md
  - prompts/aggregate-analyses.md
  - prompts/consolidate-sources.md
  - scripts/lib/hash.ts
test_command: pnpm --filter site test -- copy-prompts copy-candidate-artifacts
depends_on: []
---

## Context

The transparency drawer needs two build-time inputs that do not yet
exist:

1. A content-addressed snapshot of every `prompts/*.md`, keyed by
   SHA256. This lets the drawer serve prompt bytes that cryptographically
   match the hash recorded in `metadata.json` — even if the file on
   disk has drifted since the version was run.
2. A `sources-raw/manifest.json` per candidate version so the Sources
   tab can render a file index without doing a client-side directory
   listing (incompatible with `output: "export"`).

See spec §6 "Build-time contract" and §4 "Index".

## Objectives

1. Add `site/scripts/copy-prompts.ts`:
   - Reads every `*.md` file under the repo's top-level `prompts/`.
   - Computes SHA256 of each file's bytes.
   - Writes the bytes to `site/public/prompts/<sha256>.md`.
   - Emits `site/public/prompts/manifest.json` with an array of
     `{ logical_name, sha256, byte_length }`, sorted by `logical_name`.
   - Idempotent (safe to re-run); always starts by emptying the
     target `prompts/` directory.
2. Extend `site/scripts/copy-candidate-artifacts.ts` to emit, for
   each candidate version, a `sources-raw/manifest.json` listing:
   - `filename`, `byte_length`, `sha256` for every file under
     `sources-raw/` (excluding any `.meta.json` sidecars and
     `.DS_Store`).
   - If `<filename>.meta.json` exists next to a file, merge its
     contents (`origin_url`, `accessed_at`, …) into the manifest
     entry.
   - Manifest is emitted even when `sources-raw/` is empty (empty
     `{ "files": [] }`).
3. Wire both scripts into `site/package.json` so the existing
   `build` script runs them before `next build`. Order:
   `copy-candidate-artifacts` → `copy-prompts` → `next build`.
4. Unit tests:
   - `copy-prompts` emits expected filenames for a fixture set of
     markdown files; manifest JSON matches expected shape; content
     addressing is deterministic.
   - `copy-candidate-artifacts` produces a `sources-raw/manifest.json`
     from a fixture folder with mixed files + sidecar metadata.

## Acceptance Criteria

- [ ] `site/scripts/copy-prompts.ts` exists and writes to
      `site/public/prompts/<sha256>.md` + `manifest.json`.
- [ ] `site/scripts/copy-candidate-artifacts.ts` emits
      `<dest>/sources-raw/manifest.json` for every candidate version
      it processes.
- [ ] `site/package.json` build script chains both in order before
      `next build`.
- [ ] Running the build against `test-omega` produces a
      `site/public/prompts/manifest.json` containing at minimum the
      analyze and aggregate prompt entries whose SHA256 matches
      `candidates/test-omega/current/metadata.json`.
- [ ] Unit tests pass: `pnpm --filter site test -- copy-prompts
      copy-candidate-artifacts`.
- [ ] No lint / type errors.

## Hints for Agent

- Reuse the existing project SHA256 helper (`scripts/lib/hash.ts`)
  if it is exported from a public entry; otherwise use
  `crypto.createHash("sha256")` directly — the algorithm is fixed.
- Keep scripts CLI-friendly: no side effects at import time; a
  `main()` function invoked under `import.meta.url ===`.
- The copy script already excludes `_manual/` and `.DS_Store`.
  Preserve that exclusion when building the manifest.

## Editorial check

- [ ] No cardinal numbers introduced.
- [ ] No prompt content is rewritten — only copied verbatim.
- [ ] SHA256 values are preserved byte-accurate.
