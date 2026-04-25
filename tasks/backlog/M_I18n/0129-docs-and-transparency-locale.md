---
id: "0129"
title: "Documentation: quick-start translation step + Transparency drawer locale block"
type: task
status: open
priority: medium
created: 2026-04-25
milestone: M_I18n
spec: docs/specs/website/i18n.md
context:
  - docs/specs/website/i18n.md
  - docs/quick-start-zero-api.md
  - docs/specs/website/transparency.md
  - site/components/chrome/TransparencyDrawer.tsx
  - prompts/CHANGELOG.md
test_command: npm run test --workspace site -- TransparencyDrawer
depends_on: ["0122", "0128"]
---

## Context

Wrap up M_I18n by documenting the operator workflow and surfacing the
translation provenance (prompt, hash, attested model) in the
Transparency drawer for any candidate that has a translation.

## Objectives

1. Append a "Step 7 (optional): Translate to English" section to
   `docs/quick-start-zero-api.md` covering:
   - `npm run prepare-manual-translation -- ...`
   - paste prompt-bundle.txt into a chat UI, save reply
   - `npm run ingest-translation -- ...`
   - human review
   - `mv aggregated.en.draft.json aggregated.en.json`
   - editing `human_review_completed` to `true` in metadata
2. Update `prompts/CHANGELOG.md` with the new
   `translate-aggregated.md` entry.
3. Update `docs/specs/website/transparency.md` to describe the
   per-locale provenance block.
4. Extend `TransparencyDrawer.tsx` so that, when
   `bundle.translation.status === "available"`, it renders an extra
   "Translation" subsection with: target locale, attested model
   version, translator prompt SHA256, ingest timestamp, and the
   human-review-completed flag. When `lang === "fr"` or status is
   `"missing"`, this subsection is omitted (banner handles the
   missing case).
5. Tests in `TransparencyDrawer.test.tsx` covering the three states
   (`native_fr`, `available`, `missing`).

## Acceptance Criteria

- [ ] `docs/quick-start-zero-api.md` ends with a working translation
      walkthrough.
- [ ] Transparency drawer on `/en/candidat/test-omega` shows the
      Translation subsection with real values from `metadata.json`.
- [ ] Transparency drawer on `/candidat/test-omega` (FR) does not
      show the Translation subsection.
- [ ] All tests pass; lint and typecheck clean.

## Editorial check

- [ ] Translation provenance is fully exposed (principle 5,
      transparency).
- [ ] Drawer always links to the FR canonical artifacts (sources,
      raw outputs, FR aggregated) regardless of current locale.
