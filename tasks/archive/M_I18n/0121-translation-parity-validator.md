---
id: "0121"
title: "Translation parity validator + metadata schema additions"
type: task
status: open
priority: high
created: 2026-04-25
milestone: M_I18n
spec: docs/specs/website/i18n.md
context:
  - docs/specs/website/i18n.md
  - scripts/lib/schema.ts
  - scripts/lib/schema.test.ts
  - candidates/bruno-retailleau/versions/2026-04-25/aggregated.json
test_command: npm run test -- validate-translation
depends_on: ["0120"]
---

## Context

`aggregated.<lang>.json` files must re-validate against the **same**
`AggregatedOutputSchema` as the FR canonical file, and they must be
**structurally identical** (same numbers, same scores, same array
lengths, same identifiers) — only allowlisted prose string fields may
differ. This task implements the parity validator and the
`translations.<lang>` metadata block.

## Objectives

1. Implement `scripts/validate-translation.ts` (CLI:
   `--candidate <id> --version <date> --lang <code>`).
2. Codify the translatable-paths allowlist from spec §2.1 in
   `scripts/lib/translatable-paths.ts` (a single exported constant
   `TRANSLATABLE_PATHS: ReadonlyArray<string>` using the same
   dot/`*`/`<key>` notation as the spec table).
3. Validator algorithm (see spec §2.4): Zod re-parse, deepEqual every
   non-allowlisted leaf against the FR file, enforce identical array
   lengths, identical object key sets, identical numeric values,
   identical IDs.
4. Extend `VersionMetadataSchema` (see spec §3.3) with the optional
   `translations` field — fully additive, existing metadata files
   keep parsing.
5. Unit tests in `scripts/validate-translation.test.ts` covering: happy
   path; modified non-allowlisted string rejected; modified numeric
   value rejected; modified array length rejected; missing key
   rejected; extra key rejected; identical FR-as-EN passes (allowed).

## Acceptance Criteria

- [ ] `npx tsx scripts/validate-translation.ts --candidate
      bruno-retailleau --version 2026-04-25 --lang fr` exits 0 (FR
      validates against itself trivially).
- [ ] All 7 unit tests in `validate-translation.test.ts` pass.
- [ ] `scripts/lib/translatable-paths.ts` exports a const used by both
      the validator and (future) the translator-prompt template.
- [ ] Existing `metadata.json` files still parse (regression covered
      by `scripts/lib/schema.test.ts`).
- [ ] All tests pass: `npm run test`.
- [ ] No lint errors: `npm run lint`. No type errors: `npm run typecheck`.

## Editorial check

- [x] Schema additions are **additive only** — no field removed,
      renamed, or made stricter on existing data.
- [x] Validator enforces that numeric/structural fields are identical,
      preserving editorial principles 3 (measurement) and 4 (dissent
      preserved — array shapes intact).
