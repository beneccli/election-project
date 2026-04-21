---
id: "0092"
title: "TransparencyDrawer shell + hash-fragment deep-linking"
type: task
status: open
priority: high
created: 2026-04-21
milestone: M_Transparency
spec: docs/specs/website/transparency.md
context:
  - docs/specs/website/transparency.md
  - site/components/chrome/Drawer.tsx
  - site/components/chrome/Drawer.test.tsx
  - site/app/candidat/[id]/page.tsx
test_command: pnpm --filter site test -- TransparencyDrawer transparency-hash
depends_on: []
---

## Context

The drawer itself — the shell that hosts the four tabs and the
hash-fragment URL scheme. This task ships the chrome but not the
content of any individual tab (those are tasks 0093–0096).

See spec §3 "Drawer anatomy" and §8 "Deep-linking (URL scheme)".

## Objectives

### Hash-fragment utility

1. Create `site/lib/transparency-hash.ts` exposing:
   - `TransparencyHashState` — discriminated union over the five
     tab states (`sources | document | prompts | results | null`),
     carrying the optional secondary parameters defined in spec §8
     (`file`, `anchor`, `sha`, `view`, `model`, `claim`).
   - `parseTransparencyHash(hash: string): TransparencyHashState` —
     pure parser, returns `null` when the hash does not start with
     `transparence=`.
   - `formatTransparencyHash(state: TransparencyHashState): string`
     — inverse; returns empty string for `null`.
   - A `useTransparencyHash()` hook that subscribes to `hashchange`
     and returns `[state, setState]` where `setState` calls
     `history.replaceState` (not `pushState`) so closing does not
     pollute browser history.
2. 100% unit test coverage of parser + formatter round-trips for
   every documented fragment in §8.

### TransparencyDrawer shell

3. Create `site/components/chrome/TransparencyDrawer.tsx`
   (`"use client"`) that:
   - Accepts `{ id, versionMeta, aggregated }` props (already
     available in the candidate page).
   - Uses the existing `<Drawer size="xl">` primitive.
   - Computes `open` from the hash state (open when state !== null).
   - Renders the tab strip with `role="tablist"` and four
     `role="tab"` buttons; arrow-key navigation between tabs
     (Left/Right, Home/End).
   - Renders the always-visible summary row (§3) from
     `versionMeta`.
   - Renders a placeholder per tab for now — real content comes in
     0093–0096. Each placeholder must read "À implémenter — task
     009X" so missing content is obvious during integration.
   - Renders the coverage + human-review warning ribbons (§7
     "Coverage warnings") — these affect drawer chrome, so they
     belong here.
4. Unit tests:
   - Drawer opens when hash is `transparence=sources`.
   - Switching tabs updates the hash.
   - Closing removes the `#transparence=...` fragment.
   - Warning ribbons appear when `coverage_warning === true` or
     `human_review_completed === false`.

### Page integration

5. Mount `<TransparencyDrawer>` in
   `site/app/candidat/[id]/page.tsx` so it is available for the
   subsequent content tasks to light up. No trigger UI yet
   (task 0098).

## Acceptance Criteria

- [ ] `site/lib/transparency-hash.ts` implemented with exhaustive
      tests for all hash states in spec §8.
- [ ] `site/components/chrome/TransparencyDrawer.tsx` renders the
      four tabs with correct `tablist` semantics + keyboard
      navigation.
- [ ] Opening / closing the drawer via hash fragment works without
      a full page navigation; closing removes the fragment.
- [ ] Warning ribbons render correctly for the covered cases.
- [ ] Drawer is mounted on the candidate page but no user-facing
      trigger is added yet.
- [ ] All tests pass: `pnpm --filter site test -- TransparencyDrawer
      transparency-hash`.
- [ ] No lint / type errors.

## Hints for Agent

- Reuse the existing `<Drawer>` primitive — do not create a second
  modal component.
- Hash parsing should be case-sensitive on keys, case-insensitive
  on empty whitespace — keep it simple; `URLSearchParams` works
  fine once you strip the leading `transparence=` token.
- Keep the drawer's content panels as empty placeholders; the real
  panels ship one per task.

## Editorial check

- [ ] No new prose content is generated.
- [ ] No cardinal aggregation is introduced.
- [ ] Drawer chrome itself carries no editorial signal.
