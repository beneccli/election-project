---
id: "0011"
title: "Bootstrap project: package.json, tsconfig, tooling"
type: task
status: open
priority: critical
created: 2026-04-19
milestone: M_DataPipeline
spec: docs/specs/data-pipeline/overview.md
context:
  - scripts/README.md
  - AGENTS.md
test_command: npm run typecheck && npm run lint
depends_on: []
---

## Context

No `package.json` exists yet. The project needs a proper TypeScript project setup before any pipeline code can be written. All downstream tasks depend on this.

## Objectives

1. Create `package.json` with:
   - `"type": "module"` (ES modules)
   - All required dependencies: `zod`, `tsx`, `typescript`, `vitest`, `eslint`, `@typescript-eslint/*`, `prettier`, `pino`
   - CLI framework: `commander` (for script argument parsing)
   - npm scripts: `test`, `test:schema`, `test:pipeline`, `lint`, `typecheck`, `build`
   - npm scripts for pipeline commands: `consolidate`, `analyze`, `aggregate`, `review`, `publish`, `diff`
   - Node >=20 engine requirement

2. Create `tsconfig.json` with:
   - `"strict": true`
   - ES2022 target, NodeNext module resolution
   - `"noEmit": true` (scripts run via tsx, not compiled)
   - Path aliases if useful (e.g., `@lib/*` → `scripts/lib/*`)

3. Create ESLint config with `@typescript-eslint/recommended`

4. Create `.gitignore` with:
   - `node_modules/`
   - `scripts/logs/`
   - `*.draft.json`
   - `*.draft.md` (but NOT `sources.md.draft` — that's a pipeline artifact that stays)
   - `.env`

5. Create `scripts/logs/.gitkeep`

6. Verify: `npm install && npm run typecheck && npm run lint` all pass

## Acceptance Criteria

- [ ] `npm install` succeeds
- [ ] `npm run typecheck` passes (with empty src)
- [ ] `npm run lint` passes
- [ ] `npm run test` runs vitest (can have 0 tests)
- [ ] `"type": "module"` in package.json
- [ ] `"strict": true` in tsconfig.json
- [ ] Node 20+ engine requirement in package.json
- [ ] `.gitignore` covers logs, node_modules, drafts, .env
- [ ] All tests pass: `npm run test`
- [ ] No lint errors: `npm run lint`
- [ ] No type errors: `npm run typecheck`

## Hints for Agent

- Keep dependencies minimal — only what's needed for M_DataPipeline
- LLM SDKs (`@anthropic-ai/sdk`, `openai`, etc.) are NOT needed yet — add them in the provider abstraction task
- Use flat ESLint config format (eslint.config.js)
- Vitest config can be inline in `vitest.config.ts` or in package.json

## Notes

This is the foundation task — every other M_DataPipeline task depends on it.
