---
id: "0052"
title: "Bootstrap site/ Next.js package with App Router + static export"
type: task
status: open
priority: high
created: 2026-04-19
milestone: M_WebsiteCore
spec: docs/specs/website/nextjs-architecture.md
context:
  - docs/specs/website/nextjs-architecture.md
  - package.json
  - tsconfig.json
  - eslint.config.js
test_command: pnpm --filter site build
depends_on: ["0051"]
---

## Context

Create the `site/` package skeleton: Next.js App Router with
`output: "export"`, TypeScript strict, pnpm workspace wiring, minimal
placeholder `/` route. No styling or candidate route yet (those are later
tasks) — this task proves the build pipeline works end-to-end.

## Objectives

1. Add `"workspaces": ["site"]` to root `package.json`.
2. Create `site/package.json` with dependencies from spec §7 (no Tailwind
   yet — that's task 0053).
3. Create `site/next.config.mjs` with `output: "export"` and
   `images: { unoptimized: true }`.
4. Create `site/tsconfig.json` extending root strict config, with the
   `@pipeline/*` path alias from spec §1.
5. Create `site/app/layout.tsx` (minimal HTML shell, no fonts yet) and
   `site/app/page.tsx` (placeholder: "Élection 2027 — site en construction").
6. Add root scripts `site:build`, `site:dev`, `test:site-build`.
7. Extend root `eslint.config.js` to cover `site/**` with
   `eslint-config-next` composed on top.
8. Add `site/README.md` with run commands.

## Acceptance Criteria

- [ ] `pnpm install` at repo root installs site deps via workspaces
- [ ] `pnpm --filter site build` succeeds and produces `site/out/index.html`
- [ ] `pnpm --filter site dev` starts Next.js dev server
- [ ] `npm run typecheck` (root) passes including site files
- [ ] `npm run lint` (root) passes including site files
- [ ] No runtime errors loading the placeholder `/` route

## Hints for Agent

- Use the latest Next.js major that supports App Router static export
  (15.x at time of writing).
- The `@pipeline/*` alias points to `../scripts/lib/*` — verify with a trivial
  import in `layout.tsx` (can be removed afterward).
- Keep `site/package.json` `"type": "module"` to match the root.

## Editorial check

Not applicable — scaffolding only.
