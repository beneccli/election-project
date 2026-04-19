# `site/` — Élection 2027 static website

Next.js (App Router) static export. Reads candidate analysis JSON from
`../candidates/` at build time.

See [`../docs/specs/website/nextjs-architecture.md`](../docs/specs/website/nextjs-architecture.md).

## Commands

From the repository root:

```bash
pnpm install                                         # installs root + site via workspace
pnpm --filter @election-2027/site dev                # dev server on :3000
pnpm --filter @election-2027/site build              # prebuild copies artifacts, then next build (→ site/out/)
pnpm --filter @election-2027/site test               # Vitest (site/lib unit tests)
pnpm --filter @election-2027/site run verify-build   # post-build smoke check
```

Shorthands from the root:

```bash
npm run site:dev
npm run site:build
npm run test:site-build     # alias of site:build, used by CI
npm run test:site-smoke     # runs verify-build against site/out/
```

## Build pipeline

`build` runs in two steps:

1. **prebuild** — `scripts/copy-candidate-artifacts.ts` copies each candidate's
   `current/` directory (dereferencing the symlink) into
   `site/public/candidates/<id>/<version_date>/`, so the transparency
   footer's download links resolve against the static export. The
   destination is cleared on every run. `_manual/` scratch directories and
   `.DS_Store` files are skipped.
2. **next build** — standard static export into `site/out/`.

The copied tree is re-generated on every build and is ignored by git
(`site/public/candidates/` is in `.gitignore`).

## Environment

| Variable | Default | Purpose |
|---|---|---|
| `CANDIDATES_DIR` | `../candidates` (relative to `site/`) | Root of candidate artifacts |
| `EXCLUDE_FICTIONAL` | unset | When `1`, fictional candidates are filtered out of the build (applies to both `listCandidates()` and the artifact-copy step) |

## Output

`pnpm --filter @election-2027/site build` produces a fully static site in
`site/out/`, ready to serve from any CDN. Expected structure:

```
site/out/
├── index.html                              # landing page (stub until M_Landing)
├── candidat/<id>/index.html                # candidate analysis
└── candidates/<id>/<version_date>/         # downloadable artifacts
    ├── aggregated.json
    ├── metadata.json
    ├── sources.md
    └── raw-outputs/
        ├── index.html                      # minimal listing
        └── <model>.json
```

## QA checklist

When reviewing a candidate page against the design prototype
(`../Candidate Page.html`), verify the items below. **Intentional divergences**
are *not* bugs — they implement the editorial spec, not the visual mockup.
Future contributors: re-open the linked spec before "fixing" any of them.

1. **NavBar** — é27 wordmark, candidate display name, Transparence CTA
   (disabled in M_WebsiteCore; drawer lands in M_Transparency), language +
   theme toggles. → `components/chrome/NavBar.tsx`
2. **Hero** — photo slot, party pill (tinted by `party_color`), top-level
   grade badge via `deriveTopLevelGrade`, AI model dots, version_date.
3. **Section navigation** — sticky below the NavBar, 5 items, scrollspy
   via `IntersectionObserver`. Stable anchors: `#synthese`,
   `#positionnement`, `#dimensions`, `#intergen`, `#risques`.
4. **Synthèse** — headline blockquote from `aggregated.summary`,
   three-column strengths / weaknesses / gaps, counterfactual panel,
   downside scenarios.
5. **Positionnement** — SVG pentagon radar + per-axis agreement bars.
   - *Intentional divergence*: the radar renders only the consensus shape;
     per-model dissent is shown on the agreement bars, never as overlapping
     radar polygons. Ordinal scores must not be visually averaged. See
     [`../docs/specs/analysis/political-positioning.md`](../docs/specs/analysis/political-positioning.md).
6. **Domaines** — five tiles in the canonical `DIMENSION_KEYS` order
   (`coherence_interne`, `faisabilite_economique`, `impact_societal`,
   `execution_institutionnelle`, `effets_intergenerationnels`). Expanded
   panel shows three problem sub-blocks (always rendered — an empty block
   is itself a finding), execution risks, key measures, per-model grade
   dissent.
   - *Intentional divergence*: grades are not displayed with `+`/`−`
     modifiers; the schema uses the A / B / C / D / F / NOT_ADDRESSED
     ladder. See
     [`../docs/specs/analysis/dimensions.md`](../docs/specs/analysis/dimensions.md).
7. **Intergénérationnel** — neutral two-column split (25 y.o. / 65 y.o.),
   net-transfer-direction label, magnitude estimate with units and caveats.
   - *Intentional divergence*: no red/green asymmetry between the two
     columns. Measurement over indictment — the section quantifies, it does
     not moralise. See
     [`../docs/specs/analysis/intergenerational-audit.md`](../docs/specs/analysis/intergenerational-audit.md).
8. **Risques** — heatmap grouped by dimension, `max(probability, severity)`
   driving the tint.
   - *Intentional divergence*: no single cardinal "risk score" is rendered.
     Aggregating heterogeneous risks into one number would hide the very
     disagreement the site exists to expose.
9. **Transparency footer** — per-model pills with the exact model version
   string, full 64-char SHA256 for the analysis and aggregation prompts,
   aggregator attestation, human-review badge, download links. No hash is
   ever truncated. See
   [`../docs/specs/website/transparency.md`](../docs/specs/website/transparency.md).
