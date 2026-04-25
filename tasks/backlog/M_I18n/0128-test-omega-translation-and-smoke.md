---
id: "0128"
title: "Translate test-omega aggregated.json + dual-locale build smoke"
type: task
status: open
priority: medium
created: 2026-04-25
milestone: M_I18n
spec: docs/specs/website/i18n.md
context:
  - docs/specs/website/i18n.md
  - candidates/test-omega/
  - prompts/translate-aggregated.md
  - scripts/prepare-manual-translation.ts
  - scripts/ingest-translation.ts
  - scripts/pipeline.integration.test.ts
test_command: npm run build --workspace site && npm run test:integration
depends_on: ["0122", "0123", "0124", "0126", "0127"]
---

## Context

We need an in-repo translated fixture to exercise the full
locale-aware build path in CI. `test-omega` is the canonical fictional
candidate; we add an EN translation of its `aggregated.json` and a
build-smoke + integration test that validates both locales render.

## Objectives

1. Run `prepare-manual-translation -- --candidate test-omega
   --version <date> --lang en` and produce a real, parity-clean
   `aggregated.en.draft.json` (translated by an LLM web-chat or
   Copilot agent — same workflow operators will use).
2. Promote: `mv aggregated.en.draft.json aggregated.en.json`. Update
   `metadata.json` `translations.en.human_review_completed = true`.
3. Add an integration test in `scripts/pipeline.integration.test.ts`
   (or a new sibling) that:
   - Runs `validate-translation` on `test-omega` for `en` and asserts
     exit 0.
   - Builds the site (`npm run build --workspace site`) and asserts
     both `out/candidat/test-omega/index.html` and
     `out/en/candidat/test-omega/index.html` exist and contain
     non-empty body content.
4. Add a second fictional candidate (or reuse `test-delta`) **without**
   an EN translation to prove the fallback banner appears in the EN
   build for that candidate.

## Acceptance Criteria

- [ ] `candidates/test-omega/versions/<date>/aggregated.en.json` exists
      and is parity-clean against the FR file.
- [ ] `npm run test:integration` passes including the new dual-locale
      assertion.
- [ ] Building `out/en/candidat/test-delta/index.html` includes the
      fallback banner string from `UI_STRINGS.TRANSLATION_FALLBACK_*`.
- [ ] No advocacy verb in the EN translation (manual review by
      committer, plus a lint test that fails on a small denylist:
      `sacrifice`, `betray`, `steal`, `crush`, `rescue`).

## Editorial check

- [ ] Party names unchanged in the EN file (parity check covers IDs;
      committer verifies prose).
- [ ] No numbers altered (parity check covers numerics).
- [ ] No dissent entries added/removed (parity check covers array
      lengths).
