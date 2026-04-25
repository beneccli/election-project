---
id: "0122"
title: "Translator prompt + manual translation scripts (prepare/ingest)"
type: task
status: open
priority: high
created: 2026-04-25
milestone: M_I18n
spec: docs/specs/website/i18n.md
context:
  - docs/specs/website/i18n.md
  - prompts/aggregate-analyses.md
  - prompts/README.md
  - scripts/prepare-manual-aggregation.ts
  - scripts/ingest-aggregated.ts
  - scripts/lib/translatable-paths.ts
  - scripts/lib/hash.ts
test_command: npm run test -- "translation"
depends_on: ["0121"]
---

## Context

Translation is human-driven via web-chat. We mirror the existing
`prepare-manual-aggregation.ts` / `ingest-aggregated.ts` pattern with
a translation-specific prompt and ingest pipeline.

## Objectives

1. Author `prompts/translate-aggregated.md` (see spec §3.1):
   - States the target language as a CLI placeholder
     (`{{TARGET_LANGUAGE}}`).
   - Lists the translatable-paths allowlist literally (auto-imported
     content from `scripts/lib/translatable-paths.ts` via the
     prepare script — the markdown contains a marker the script
     fills).
   - Bans paraphrase, list mutation, identifier translation,
     advocacy verbs, number/unit translation.
   - Requires a single JSON object output that re-validates against
     `AggregatedOutputSchema` with non-translatable fields verbatim
     from input.
2. Generate and commit `prompts/translate-aggregated.sha256.txt` (run
   the same hash helper used for other prompts).
3. Implement `scripts/prepare-manual-translation.ts` (CLI: `--candidate
   --version --lang`). Writes `_translation/translation-bundle.txt`
   containing prompt (with target language and allowlist
   substituted) followed by FR `aggregated.json`. Add a
   `_translation/README.md`. Ensure `.gitignore` excludes
   `_translation/` (except its README) — extend the existing
   `_manual/` rules in `candidates/.gitignore` or the per-version
   `.gitignore`.
4. Implement `scripts/ingest-translation.ts` (CLI: `--candidate
   --version --lang --input <path>`). Behavior per spec §3.2:
   parse → parity check → write `aggregated.<lang>.draft.json` →
   append `translations.<lang>` block to `metadata.json` with
   `human_review_completed: false` → print promote instructions.
5. Tests:
   - `prepare-manual-translation.test.ts`: bundle file written, prompt
     hash recorded, allowlist substituted in.
   - `ingest-translation.test.ts`: happy path writes draft + metadata;
     a tampered (mutated number) input rejected with non-zero exit;
     idempotent re-ingest overwrites draft and bumps `ingested_at`.

## Acceptance Criteria

- [ ] `prompts/translate-aggregated.md` exists with stable wording,
      target-language placeholder, and inlined allowlist marker.
- [ ] `prompts/translate-aggregated.sha256.txt` exists and matches
      file content.
- [ ] `npm run prepare-manual-translation -- --candidate test-omega
      --version <date> --lang en` produces a non-empty bundle.
- [ ] `npm run ingest-translation -- ...` rejects a numerically
      tampered file and accepts a parity-clean one.
- [ ] `metadata.json` after ingest contains a `translations.en` block
      validated by the updated `VersionMetadataSchema`.
- [ ] All tests pass: `npm run test`. No lint/type errors.

## Editorial check

- [ ] Translator prompt explicitly bans advocacy verbs (principle 1).
- [ ] Translator prompt forbids translating party / candidate names
      (user-stated invariant).
- [ ] Promote-to-final step is a manual `mv` (preserves human review
      gate, principle 5).
- [ ] Translation prompt is hashed and recorded in metadata
      (principle 5, transparency).
