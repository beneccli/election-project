# `site/` — Élection 2027 static website

Next.js (App Router) static export. Reads candidate analysis JSON from
`../candidates/` at build time.

See [`../docs/specs/website/nextjs-architecture.md`](../docs/specs/website/nextjs-architecture.md).

## Commands

From the repository root:

```bash
pnpm install                     # installs root + site via workspace
pnpm --filter site dev           # dev server on :3000
pnpm --filter site build         # static export → site/out/
pnpm --filter site test          # Vitest
```

## Environment

| Variable | Default | Purpose |
|---|---|---|
| `CANDIDATES_DIR` | `../candidates` (relative to `site/`) | Root of candidate artifacts |
| `EXCLUDE_FICTIONAL` | unset | When `1`, fictional candidates are filtered out of the build |

## Output

`pnpm --filter site build` produces a fully static site in `site/out/`,
ready to serve from any CDN.
