---
id: "0064"
title: "End-to-end build test + site README"
type: task
status: open
priority: medium
created: 2026-04-19
milestone: M_WebsiteCore
spec: docs/specs/website/nextjs-architecture.md
context:
  - docs/specs/website/nextjs-architecture.md
  - package.json
test_command: npm run test:site-build
depends_on: ["0058", "0059", "0060", "0061", "0062", "0063"]
---

## Context

Closing task for M_WebsiteCore: prove the full candidate page builds against
the test-omega fixture, document how to run the site, and fold the build
check into the root test workflow so regressions from future pipeline
changes are caught here.

## Objectives

1. Add `"test:site-build": "pnpm --filter site build"` to root
   `package.json` (already proposed in 0052 — verify it exists; wire it in
   if missing).
2. Add a tiny post-build smoke check, `site/scripts/verify-build.ts`, that:
   - Asserts `site/out/candidat/test-omega/index.html` exists
   - Asserts that file contains the candidate display name
     ("Omega Synthétique") and all five section headings
   - Asserts that the copied `site/out/candidates/test-omega/<date>/
     aggregated.json` file exists
   - Exits non-zero on any failure
3. Add root script `"test:site-smoke": "pnpm --filter site run verify-build"`
   and a sibling script in `site/package.json` that runs
   `tsx scripts/verify-build.ts`.
4. Expand `site/README.md` with:
   - `pnpm install` → `pnpm --filter site dev` (dev)
   - `pnpm --filter site build` (static export) → serves from `site/out/`
   - `pnpm --filter site test` (unit tests)
   - `pnpm --filter site run verify-build` (smoke)
   - Env vars: `CANDIDATES_DIR`, `EXCLUDE_FICTIONAL`
5. Update root `README.md` "Testing & Lint" block to mention
   `npm run test:site-build` and `npm run test:site-smoke`.
6. Manual acceptance check (documented as a numbered list in
   `site/README.md` under "QA checklist"): compare rendered
   `/candidat/test-omega` against `Candidate Page.html` across the five
   sections; note any deliberate divergences (grade modifiers, risk table
   restructure, intergen layout fidelity) so future contributors do not
   "fix" them back to the prototype.

## Acceptance Criteria

- [ ] `pnpm install && npm run test:site-build && npm run test:site-smoke`
      all green from a clean checkout
- [ ] `site/out/candidat/test-omega/index.html` exists after build
- [ ] `site/out/candidates/test-omega/2027-11-01/aggregated.json` exists
- [ ] `site/README.md` documents all run commands + QA checklist
- [ ] Root README points to the site build commands

## Hints for Agent

- Keep `verify-build.ts` dependency-free (`node:fs`, `node:path` only).
- The QA checklist is essential context for M_VisualComponents — the
  contributors there will want to know which visual divergences from the
  prototype are intentional.

## Editorial check

- [ ] QA checklist explicitly documents each intentional divergence from
      `Candidate Page.html`, with reasoning pointing back to the spec
      section that mandated it
