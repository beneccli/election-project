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

## Landing (`/`)

Route shipped by milestone **M_Landing**. Renders a France-level context
band, the candidate grid (analyzed + pending), a compare CTA, the
methodology block, and the footer. Spec:
[`../docs/specs/website/landing-page.md`](../docs/specs/website/landing-page.md).

- **Editorial safeguards** — enforced by
  `app/__tests__/landing-editorial.test.tsx`:
  - no ranking vocabulary (classement, gagnant, winner, meilleur candidat,
    score global) anywhere in the rendered landing DOM,
  - no alarmist vocabulary (catastrophique, désastre, disaster, crise) in
    the rendered landing DOM,
  - the hero stats panel uses no red / amber class or inline color — the
    context is neutral, not alarmist (spec §2, §3.2),
  - the compare CTA does not render a "Bientôt" / "Coming soon" pill —
    comparison has shipped.
  The test renders `app/page.tsx` with a stubbed candidate loader so it
  does not depend on filesystem fixtures. A route-level smoke test
  (`app/__tests__/page.test.tsx`) verifies the six regions compose.
- **Candidate ordering** — by `updatedAt` desc, tie-broken by
  `displayName` asc. Never by any score or model consensus — landing
  must not insinuate a ranking. See `lib/landing-cards.ts`.

## Comparison (`/comparer`)

Route shipped by milestone **M_Comparison**. Lets readers juxtapose 2 to 4
candidates on the same dimensions. Spec:
[`../docs/specs/website/comparison-page.md`](../docs/specs/website/comparison-page.md).

- **URL query** — selection is reflected via repeated `?c=<id>` parameters.
  Example: `/comparer?c=test-omega&c=other-candidate`. The URL is the
  canonical state; sharing the URL reproduces the view.
- **Persistence** — after the first interaction, the selection is mirrored
  to `localStorage` under the key `e27-compare` (JSON array of ids). A
  subsequent visit to `/comparer` with an empty query will rehydrate from
  localStorage. The URL always wins when both are present.
- **Capacity** — 2 to 4 candidates. Unknown ids, non-analyzable entries, and
  (when `EXCLUDE_FICTIONAL=1`) fictional candidates are dropped silently.
- **Entry points** — landing page CTA ("Comparer plusieurs candidats",
  pre-selects the two most recently updated analyzable candidates) and a
  small inline link on each candidate page ("Comparer à un autre candidat →",
  pre-fills one slot with the current candidate).
- **Editorial guardrails** — enforced by
  `app/comparer/comparison-editorial.test.tsx`:
  - no "gagnant / winner / vainqueur / classement général / score global /
    meilleur candidat / best candidate" anywhere in comparison source,
  - no ranking vocabulary in any `aria-label` / `title` of the exported HTML,
  - no cardinal averaging — every cell reads a single aggregated ordinal
    field (`modal_score`, `modal_level`, grade consensus).
  The test runs in two phases: a source-file scan on every `pnpm test` run,
  and a post-build scan of `site/out/comparer/index.html` that auto-activates
  whenever the file exists.
- **Transparency** — the /comparer page renders a scoped transparency
  footer that links to each selected candidate's per-version
  `metadata.json`. It does NOT mount the raw-outputs drawer; for the
  complete run (prompts, sources, raw outputs) readers open the candidate
  page itself.
