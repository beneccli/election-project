---
id: "0051"
title: "Promote website structure spec to Stable and cross-link nextjs-architecture"
type: task
status: open
priority: medium
created: 2026-04-19
milestone: M_WebsiteCore
spec: docs/specs/website/nextjs-architecture.md
context:
  - docs/specs/website/structure.md
  - docs/specs/website/visual-components.md
  - docs/specs/website/transparency.md
  - docs/specs/README.md
  - docs/specs/website/nextjs-architecture.md
test_command: npm run lint
depends_on: []
---

## Context

`docs/specs/website/structure.md` has been Draft since foundation. The
M_WebsiteCore spike validated its contents against the real aggregated
schema and produced `nextjs-architecture.md` as the implementation-level
companion. Time to promote.

## Objectives

1. Change `structure.md` header Status from `Draft` to `Stable`.
2. Add a "Related specs" link to `nextjs-architecture.md` at the bottom of
   `structure.md`.
3. Update `docs/specs/README.md`:
   - Change `website/structure.md` status marker from `[Draft]` to `[Stable]`
   - Add `nextjs-architecture.md [Stable]` under the `website/` block
4. Leave `visual-components.md` and `transparency.md` as Draft — they belong
   to their own milestones.

## Acceptance Criteria

- [ ] `structure.md` header reads `Status: Stable` (no longer "Draft — to be
      finalized by M_WebsiteCore spike")
- [ ] `structure.md` bottom links include `nextjs-architecture.md`
- [ ] `docs/specs/README.md` lists `nextjs-architecture.md` with `[Stable]`
- [ ] `npm run lint` clean

## Notes

Documentation-only task. No code.
