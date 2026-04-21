---
id: "0088"
title: "Close milestone: update visual-components.md + nextjs-architecture.md + integration tests"
type: task
status: open
priority: medium
created: 2026-04-20
milestone: M_CandidatePagePolish
spec: docs/specs/website/candidate-page-polish.md
context:
  - docs/specs/website/visual-components.md
  - docs/specs/website/nextjs-architecture.md
  - docs/specs/README.md
  - site/app/candidat/[id]/page.tsx
test_command: pnpm test && pnpm --filter site test
depends_on: ["0084", "0085", "0086", "0087"]
---

## Context

After the four UI tasks land, the website specs drift from the
implementation. This task brings them back in sync and adds integration-
level coverage for the new screenshot-worthy layouts.

## Objectives

1. Bump `docs/specs/website/visual-components.md` to v1.2:
   - Add §4.12 `<ConfidenceBar>` (from task 0085).
   - Add §4.13 `<IntergenHorizonTable>` (from task 0086).
   - Add §4.14 `<RiskSummaryMatrix>` (from task 0087).
   - Add §4.15 `<Drawer>` (from task 0087; chrome-level, not widget,
     but documented here for cross-reference).
   - Amend §4.1 `<PositioningRadar>` to document per-model overlays.
   - Amend §4.5 `<RiskHeatmap>` with a "Now rendered inside a Drawer
     per candidate-page-polish" note; cross-link.
   - Amend §4.7 `<DimensionTile>` with a note that the tile grid is
     replaced by a list row in `DomainesSection`; the underlying
     `GradeBadge` / `ConfidenceBar` usage is preserved.
2. Update `docs/specs/website/nextjs-architecture.md` §4 component
   inventory for the candidate page to reflect:
   - Positionnement: radar now per-model selectable.
   - Domaines: list row + inline deep-dive (replacing tile grid).
   - Intergénérationnel: horizon matrix primary + split panel secondary.
   - Risques: summary matrix primary + drawer with full list
     secondary.
3. Ensure `docs/specs/README.md` lists the new
   `candidate-page-polish.md` entry under `website/`.
4. Add or extend integration tests in `site/app/candidat/[id]/page.test.tsx`
   (create if missing) to assert at least one row visible in each new
   widget when rendering `test-omega`. This is a smoke test — not a
   full visual regression.
5. Verify `pnpm --filter site build` succeeds end-to-end and the
   built page renders all four redesigned sections.
6. Archive this milestone: `mv tasks/backlog/M_CandidatePagePolish tasks/archive/M_CandidatePagePolish`
   and update `docs/ROADMAP.md` to mark the milestone ✅ Done.

## Acceptance Criteria

- [ ] `visual-components.md` at Version 1.2 with the new subsections.
- [ ] `nextjs-architecture.md` §4 updated to describe the new
      composition.
- [ ] `docs/specs/README.md` references
      `docs/specs/website/candidate-page-polish.md`.
- [ ] A smoke integration test renders the candidate page and asserts
      the presence of: a positioning radar, a headline row for each of
      the 5 dimensions, a 6×3 horizon matrix, a 5×4 risk matrix, a
      "Voir tous les risques identifiés" button that opens the Drawer.
- [ ] `pnpm --filter site build` succeeds.
- [ ] All tests pass: `pnpm test && pnpm --filter site test`.
- [ ] Milestone marked Done in ROADMAP; tasks archived.
- [ ] No lint errors.
- [ ] No type errors.

## Hints for Agent

- Follow the existing doc style — prose first, component tables
  second, Never / Editorial blocks at the end.
- The integration smoke test can use React Testing Library with a
  mocked `CANDIDATES_DIR` pointing at `test-omega`.
- If `site/app/candidat/[id]/page.test.tsx` does not exist, bootstrap
  it from patterns in `site/lib/candidates.test.ts`.
- Archive command: `git mv tasks/backlog/M_CandidatePagePolish tasks/archive/M_CandidatePagePolish`.

## Editorial check

- [ ] Spec amendments describe **what shipped**, not aspirations.
      Versioned correctly; cross-links updated.
- [ ] Integration tests assert structure, not content — no
      candidate-specific content assertions that would create
      asymmetric scrutiny.
- [ ] Transparency preserved: the Drawer surface hosting `RiskHeatmap`
      is documented and accessible.

## Notes

- This is the milestone-closing task. It is the last place to catch
  cross-task inconsistency before archiving.
