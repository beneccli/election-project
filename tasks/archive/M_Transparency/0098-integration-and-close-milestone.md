---
id: "0098"
title: "Integration: NavBar + TransparencyFooter entry points; e2e smoke; close milestone"
type: task
status: open
priority: high
created: 2026-04-21
milestone: M_Transparency
spec: docs/specs/website/transparency.md
context:
  - docs/specs/website/transparency.md
  - site/components/chrome/NavBar.tsx
  - site/components/chrome/TransparencyFooter.tsx
  - site/components/chrome/TransparencyDrawer.tsx
  - docs/ROADMAP.md
  - docs/specs/README.md
test_command: pnpm --filter site test && pnpm --filter site build
depends_on: ["0091", "0092", "0093", "0094", "0095", "0096", "0097"]
---

## Context

Wire the three entry points specified in §10, add an end-to-end
smoke test that renders the drawer for `test-omega`, and close the
milestone.

## Objectives

### Entry points

1. **TransparencyFooter**: add a prominent primary-action button at
   the very top of the footer labeled "Ouvrir la transparence
   complète". Clicking sets the hash to
   `#transparence=document`. Do not remove any existing footer
   content (it remains the JS-disabled fallback per spec §2).
2. **NavBar**: add a `Transparence` section-nav entry that scrolls
   to the footer AND sets the transparency hash. This entry sits
   alongside the existing section links.
3. **Trigger when hash is present**: confirm (via test) that
   landing on `/candidat/test-omega#transparence=results&view=agreement`
   opens the drawer on the agreement-map sub-view.

### E2E smoke test

4. Add `site/app/candidat/[id]/page.transparency.test.tsx` that
   renders the candidate page for `test-omega` and, for each hash
   state in spec §8 table, asserts the drawer opens in the
   expected state and the expected tab content is present (or the
   empty-state copy for the Sources tab).
5. Add a minimal integration build verification: running
   `pnpm --filter site build` produces
   `site/public/prompts/<analysis-sha>.md` and the
   `sources-raw/manifest.json` for every copied candidate. This
   can be a CLI-level test, not Vitest.

### Close the milestone

6. Update `docs/specs/README.md` so the transparency row reads
   `Stable` (not `Draft`).
7. Update `docs/ROADMAP.md`:
   - `M_Transparency` row → ✅ Done.
   - Add a "Spike produces" block mirroring other milestones.
   - Promote milestone status to `Done` with a 2026-MM-DD stamp.
8. Move the archived spike:
   ```bash
   mv tasks/active/0090-spike-transparency.md tasks/archive/M_Transparency/
   ```
   (Spike archival is task 0090's responsibility at the end of the
   spike — but this task verifies that the archive folder exists
   and the file is in the right place.)

## Acceptance Criteria

- [ ] Footer button + NavBar entry added and tested.
- [ ] Landing with a `#transparence=...` hash opens the drawer in
      the correct state.
- [ ] E2E smoke test covers every hash state from spec §8.
- [ ] `pnpm --filter site build` produces both new manifests
      successfully for `test-omega`.
- [ ] `docs/specs/README.md` updated (`transparency.md` → Stable).
- [ ] `docs/ROADMAP.md` updated (`M_Transparency` → Done with
      dated stamp + Spike-produces block).
- [ ] Spike file archived under `tasks/archive/M_Transparency/`.
- [ ] All tests pass.
- [ ] No lint / type errors.

## Editorial check

- [ ] Entry-point copy is descriptive ("Ouvrir la transparence
      complète"), not promotional.
- [ ] No change in analytical behavior — drawer is pure artifact
      exposure.
- [ ] Every candidate reaches the drawer via the same chrome
      (symmetric scrutiny preserved).
