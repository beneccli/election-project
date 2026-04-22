---
id: "0114"
title: "Landing: `<LandingHero>` (title, body, stats panel, charts row, divider)"
type: task
status: open
priority: high
created: 2026-04-22
milestone: M_Landing
spec: docs/specs/website/landing-page.md
context:
  - docs/specs/website/landing-page.md
  - Landing Page.html
  - site/lib/i18n.ts
  - site/components/chrome/Hero.tsx
test_command: pnpm --filter site test -- LandingHero
depends_on: ["0111", "0113"]
---

## Context

Implement the hero band per spec §5.3. Headline stats render in the
default text color (editorial adjustment vs. prototype — see spec §2
and §3.2). Charts row is a two-up grid calling `<StakesAreaChart>`
twice.

## Objectives

1. `site/components/landing/LandingHero.tsx` (server wrapper + client
   island `StakesCharts`).
2. Hero title includes an `<em>` emphasis on the key word, per the
   prototype (FR: "vraiment", EN: "actually"). Pulled from `UI_STRINGS`.
3. Stats panel: three stacked tiles rendered from `CONTEXT_STATS`.
4. Divider row shows `{analyzedCount} candidats analysés · {pendingCount} à venir`.
5. Uses existing Tailwind tokens + the OKLCH palette — no new CSS
   variables.

## Acceptance Criteria

- [ ] Headline stat numbers have NO red/amber class or inline color
- [ ] Hero title em-emphasis uses accent color (same token as
      candidate-page hero)
- [ ] Stats panel source notes rendered alongside each figure
- [ ] Chart panels render side-by-side ≥ 720 px, stacked below
- [ ] Test: analyzed-count label reflects the input counts
- [ ] Editorial regression test for the hero: no banned words in rendered DOM
- [ ] Lint + typecheck + test clean

## Hints for Agent

- Candidate-page `Hero.tsx` is the closest layout precedent for
  grid-cols-[auto_1fr] but shapes differ; do not share code directly.

## Editorial check

- [ ] Stat figures rendered factually (color neutral).
- [ ] No moral language ("catastrophe", "crise", "désastre").
- [ ] Chart reference line labeled factually (e.g. "Critère 60 %
      (Maastricht)").
