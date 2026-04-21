---
id: "0095"
title: "Prompts tab — SHA-verified display with mismatch warning"
type: task
status: open
priority: medium
created: 2026-04-21
milestone: M_Transparency
spec: docs/specs/website/transparency.md
context:
  - docs/specs/website/transparency.md
  - site/components/chrome/TransparencyDrawer.tsx
  - site/scripts/copy-prompts.ts
  - candidates/test-omega/current/metadata.json
test_command: pnpm --filter site test -- PromptsTab
depends_on: ["0091", "0092"]
---

## Context

Tab 3 exposes the exact prompt bytes used to produce the analysis,
verified by SHA256 against `metadata.json`. If the file on disk has
drifted since the version ran, the tab refuses to render the current
(wrong) bytes under the historic SHA and instead shows an
"unavailable in current repository" state.

See spec §6.

## Objectives

1. Create `site/components/transparency/PromptsTab.tsx`:
   - Reads `analysis.prompt_file` + `analysis.prompt_sha256`,
     `aggregation.prompt_file` + `aggregation.prompt_sha256`, and
     optionally `consolidation.*` (rendered only if present) from
     `metadata.json`.
   - For each entry, attempts to fetch
     `/prompts/<recorded-sha>.md`.
   - **Match found:**
     - Render the content in a monospace-friendly `<pre>` with
       soft-wrap.
     - Show logical name (`prompt_file`), version (`prompt_version`
       when available), SHA256 displayed in **full** (never
       truncated — the hash is the verification hook).
     - Copy + download buttons.
   - **Not found** (HTTP 404 or non-OK):
     - Render the "prompt non disponible dans l'état courant du
       dépôt" badge from spec §6.
     - Include a link to the project's git history for the file
       (`https://github.com/<owner>/<repo>/commits/HEAD/<prompt_file>`
       — pull the repo URL from a site config entry; if no config
       exists, add one at `site/lib/config.ts` reading from env).
2. Deep-link: `#transparence=prompts&sha=<sha256>` scrolls the
   matching card into view and visually highlights it.
3. Cross-verify: a tiny runtime assertion that the served bytes'
   SHA256 (re-computed via `crypto.subtle.digest`) matches the
   recorded SHA256; if not, render a **red** warning — this should
   never trigger (content addressing guarantees it) but the check
   is cheap and proves integrity.
4. Unit tests (mock `fetch`):
   - Match case: content rendered, SHA displayed in full.
   - 404 case: mismatch warning rendered, git-history link shown.
   - Digest-mismatch case: red warning visible.
   - `consolidation.*` optional entry is omitted when absent.

## Acceptance Criteria

- [ ] PromptsTab renders analyze + aggregate entries for `test-omega`.
- [ ] SHA256 shown in full, monospace.
- [ ] Missing-prompt state renders with a git-history link.
- [ ] Runtime digest verification passes in the happy path and
      surfaces a red warning otherwise.
- [ ] Deep-link highlights the matching card.
- [ ] Tests pass: `pnpm --filter site test -- PromptsTab`.
- [ ] No lint / type errors.

## Hints for Agent

- Repository URL: check `package.json#repository` first before
  adding new config.
- A minimal "copy" button via `navigator.clipboard.writeText` is
  enough; no library needed.

## Editorial check

- [ ] Prompt bytes are rendered verbatim — never edited, never
      summarized.
- [ ] No cardinal aggregation introduced.
- [ ] The mismatch path is explicit about what is missing and why,
      rather than silently substituting content (§6 non-negotiable).
