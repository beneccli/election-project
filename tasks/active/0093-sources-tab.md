---
id: "0093"
title: "Sources tab — file index + inline viewers (PDF/markdown/text/JSON)"
type: task
status: open
priority: medium
created: 2026-04-21
milestone: M_Transparency
spec: docs/specs/website/transparency.md
context:
  - docs/specs/website/transparency.md
  - site/components/chrome/TransparencyDrawer.tsx
  - site/scripts/copy-candidate-artifacts.ts
test_command: pnpm --filter site test -- SourcesTab
depends_on: ["0091", "0092"]
---

## Context

Tab 1 of the transparency drawer exposes primary-source files
archived under `candidates/<id>/<version>/sources-raw/`. Files are
indexed via the `sources-raw/manifest.json` emitted by task 0091.

See spec §4.

## Objectives

1. Create `site/components/transparency/SourcesTab.tsx`:
   - Fetches `/candidates/<id>/<version>/sources-raw/manifest.json`
     on tab activation. Renders a loading placeholder, then the
     file list.
   - Each row: icon by file type, filename, byte size, truncated
     `sha256`, `origin_url` + `accessed_at` when present, [Voir]
     [Télécharger] actions.
   - Clicking [Voir] opens an inline viewer below the row (only
     one open at a time), and writes
     `#transparence=sources&file=<filename>` to the hash.
   - On mount, if the hash carries `file=<filename>`, opens that
     viewer.
2. Viewers by file type:
   - `.pdf` → `<iframe sandbox="…" src="…">` with a reasonable
     height (~600px).
   - `.md` / `.txt` → inline `fetch` then `<pre>` (no markdown
     rendering — that is Tab 2).
   - `.json` → inline `fetch` then `JSON.stringify(data, null, 2)`
     in `<pre>`.
   - `.html` or unknown → external link only.
3. Empty-state rendering (per spec §4):
   > Les sources primaires archivées ne sont pas encore disponibles
   > pour cette version. Voir le document consolidé pour le contenu
   > du programme tel qu'il a été soumis aux modèles.
   With a button switching to the Document tab (by setting the
   hash to `#transparence=document`).
4. Unit tests (mock `fetch`):
   - Populated manifest renders rows with correct metadata.
   - Empty manifest renders the empty-state copy + switch button.
   - Clicking a row's [Voir] toggles the viewer and updates hash.

## Acceptance Criteria

- [ ] `SourcesTab` renders from manifest data.
- [ ] Every file format viewer behaves as specified.
- [ ] Empty state renders correctly for `test-omega` (empty
      `sources-raw/`).
- [ ] Deep-link `#transparence=sources&file=<filename>` opens the
      corresponding viewer on mount.
- [ ] Tests pass: `pnpm --filter site test -- SourcesTab`.
- [ ] No lint / type errors.

## Hints for Agent

- The PDF iframe does not need `allow-scripts` — defaults are safe.
- Keep icons inline SVG or Unicode; no new icon library.
- Truncate SHA256 visually (first 7 chars + "…") but expose the
  full value in `title` for copy-paste.

## Editorial check

- [ ] No new prose generated; empty-state copy is measurement-
      framed (neutral, not apologetic).
- [ ] Byte-for-byte fidelity preserved — no filtering of file
      contents.
