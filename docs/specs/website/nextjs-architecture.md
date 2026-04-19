# Next.js Architecture (M_WebsiteCore)

> **Version:** 1.0
> **Status:** Stable
> **Scope:** Candidate page and the Next.js app shell. Landing, comparison,
> methodology, changelog are **out of scope** for this spec (see their own
> milestones).

---

## Overview

The Élection 2027 website is a **fully static Next.js application** that
reads per-candidate JSON artifacts from the `candidates/` directory at build
time and renders one `/candidat/<id>` page per candidate. There is no
runtime data layer, no API routes, no runtime database. `pnpm --filter site
build` produces a static HTML / CSS / JS bundle ready to serve from any CDN.

The site package lives alongside the pipeline package in the same
repository:

```
election-project/
├── candidates/          # pipeline-produced JSON (read-only input to site)
├── prompts/
├── scripts/             # pipeline (existing)
├── site/                # this package (new, added by M_WebsiteCore)
└── docs/specs/website/  # this spec lives here
```

This spec defines:

1. The `site/` package layout and build flow
2. The build-time data loader contract
3. Derivation rules that convert `AggregatedOutput` into view models
4. The candidate page component inventory (what ships in M_WebsiteCore vs.
   deferred)
5. Styling (Tailwind + OKLCH tokens) and typography port
6. Test strategy

---

## 1. Package layout

```
site/
├── package.json             # depends on "election-2027" root via workspace
├── next.config.mjs          # output: "export"
├── tsconfig.json            # extends root, paths alias "@pipeline/*"
├── tailwind.config.ts
├── postcss.config.mjs
├── app/
│   ├── layout.tsx           # html shell, <head>, fonts, theme attribute
│   ├── page.tsx             # placeholder landing (real one → M_Landing)
│   ├── candidat/
│   │   └── [id]/
│   │       └── page.tsx     # candidate page (the core product)
│   └── not-found.tsx
├── components/
│   ├── chrome/
│   │   ├── NavBar.tsx
│   │   ├── SectionNav.tsx           # sticky scrollspy
│   │   ├── Hero.tsx
│   │   ├── ThemeToggle.tsx          # client
│   │   └── LanguageToggle.tsx       # client
│   ├── sections/
│   │   ├── SyntheseSection.tsx
│   │   ├── PositionnementSection.tsx
│   │   ├── DomainesSection.tsx
│   │   ├── IntergenSection.tsx
│   │   └── RisquesSection.tsx
│   ├── widgets/
│   │   ├── PositioningRadar.tsx     # baseline version; polished in M_VisualComponents
│   │   ├── AxisAgreementBars.tsx
│   │   ├── DimensionTile.tsx
│   │   ├── IntergenSplitPanel.tsx
│   │   ├── RiskHeatmap.tsx
│   │   ├── ConfidenceDots.tsx
│   │   └── GradeBadge.tsx
│   └── transparency/
│       └── TransparencyFooter.tsx   # drawer → M_Transparency
├── lib/
│   ├── candidates.ts        # loader — see §2
│   ├── schema.ts            # re-exports AggregatedOutputSchema from pipeline
│   ├── anchors.ts           # per-axis anchor figures (from political-positioning.md)
│   ├── i18n.ts              # { fr, en } literal resolver
│   ├── grade-color.ts       # A..F → token color
│   └── derived/
│       ├── top-level-grade.ts
│       ├── synthese-selection.ts
│       └── positioning-shape.ts
├── public/                  # static assets (candidate photos etc.)
└── styles/
    └── globals.css          # OKLCH CSS variables, theme overrides
```

### pnpm workspace

Root `package.json` gains:

```json
"workspaces": ["site"]
```

and a pass-through script:

```json
"site:build": "pnpm --filter site build",
"site:dev":   "pnpm --filter site dev"
```

### TypeScript path alias

`site/tsconfig.json` adds:

```json
"paths": { "@pipeline/*": ["../scripts/lib/*"] }
```

so `import { AggregatedOutputSchema } from "@pipeline/schema"` works without
duplicating types.

---

## 2. Build-time data loader

### Contract — `site/lib/candidates.ts`

```ts
// See docs/specs/website/nextjs-architecture.md §2
export interface CandidateIndexEntry {
  id: string;
  displayName: string;
  party: string;
  partyId: string;
  isFictional: boolean;
  versionDate: string;   // ISO date of the `current` version
  updatedAt: string;     // ISO datetime from metadata
}

export interface CandidateBundle {
  meta: CandidateMeta;           // from candidates/<id>/metadata.json
  versionMeta: VersionMeta;      // from candidates/<id>/current/metadata.json
  aggregated: AggregatedOutput;  // parsed by AggregatedOutputSchema
  rawSummaries: RawModelSummary[]; // model, version, prompt_sha256, status
}

/** Enumerate all candidates that have a `current/` symlink. */
export function listCandidates(): CandidateIndexEntry[];

/** Load one candidate's full bundle, validating aggregated.json. */
export function loadCandidate(id: string): CandidateBundle;
```

### Resolution rules

- The `candidates/` path is resolved via
  `path.resolve(process.cwd(), "..", "candidates")` when `site/` is the cwd,
  or via a `CANDIDATES_DIR` env var override (used by tests).
- Candidates whose `current/` does not exist or does not contain
  `aggregated.json` are **excluded from the index** (not an error — a
  candidate may be scaffolded before first analysis).
- Fictional candidates (`metadata.is_fictional === true`) are included in
  dev builds but **excluded from production builds** when the env var
  `EXCLUDE_FICTIONAL=1` is set. The production build command in the
  deployment pipeline (M_PublicLaunch) sets this flag. Default dev behavior
  renders fictional candidates so the site can be exercised against
  `test-omega` before any real candidate exists.

### Schema validation

`loadCandidate` calls `AggregatedOutputSchema.parse(...)` — no `safeParse`.
Schema drift is a **build-time fatal error**. A dedicated typed error
(`CandidateDataError` with `{ id, path, zodIssues }`) is thrown so the Next.js
build surface shows the candidate id and the failing field.

### `generateStaticParams`

```ts
// app/candidat/[id]/page.tsx
export async function generateStaticParams() {
  return listCandidates().map(({ id }) => ({ id }));
}
```

---

## 3. Derivation rules

All derivations are **pure functions** taking `AggregatedOutput` (or a
sub-tree) and returning a view-model object. They are unit-tested against
`candidates/test-omega/current/aggregated.json`.

### 3.1 Top-level grade

```ts
// site/lib/derived/top-level-grade.ts
export function deriveTopLevelGrade(agg: AggregatedOutput): {
  letter: "A" | "B" | "C" | "D" | "F";
  modifier: "+" | "-" | null;
};
```

Rule:

- `letter` = modal of the 5 dimension consensus grades, treating
  `NOT_ADDRESSED` as the worst letter present elsewhere if any, else `F`.
  Tie → the lower letter (more conservative summary).
- `modifier` = `"+"` if `summary_agreement >= 0.8`, `"-"` if `< 0.5`, else
  `null`.

**Editorial note:** the modifier describes **consensus strength**, not a
substantive judgement. This is documented in the transparency footer.

### 3.2 Synthèse selection

```ts
// site/lib/derived/synthese-selection.ts
export function deriveSynthese(agg: AggregatedOutput): {
  strengths: DerivedBullet[];
  weaknesses: DerivedBullet[];
  gaps: DerivedBullet[];
};

interface DerivedBullet {
  text: string;
  sourceDimension: DimensionKey | null;
  supportedBy: string[];
  dissenters: string[];
}
```

Rules (deterministic, identical across candidates):

- `strengths`: flatten all `dimensions.*.problems_addressed`, filter to
  `strength >= 0.7`, sort descending by `strength`, take top 3. Each bullet's
  `text` = `problem`.
- `weaknesses`: flatten all `dimensions.*.problems_worsened`, sort descending
  by `severity`, take top 3. `text` = `problem`.
- `gaps`: `unsolved_problems`, sorted by `severity_if_unsolved` (high →
  medium → low), take top 3. `text` = `problem`.

If a list is empty after filtering, render the block with a neutral
"Aucun élément marquant identifié dans cette analyse" message — **not** a
positive framing like "programme complet". Absence is a finding.

### 3.3 Positioning shape

```ts
// site/lib/derived/positioning-shape.ts
export function deriveRadarShape(p: AggregatedPositioning): {
  axes: {
    key: AxisKey;
    interval: [number, number];
    modal: number | null;
    radarValue: number; // used ONLY for pentagon shape; never displayed as a score
    hasDissent: boolean;
  }[];
};
```

- `radarValue = modal ?? (interval[0] + interval[1]) / 2`. The midpoint is
  a shape-only input, **never labeled as a score** in UI. If `modal === null`,
  the axis gets a `⚠ dissent` badge.
- `hasDissent = dissent.length > 0`.

---

## 4. Candidate page component inventory

For each section the table lists: data source, M_WebsiteCore scope, and what
is deferred.

### 4.1 NavBar + Hero + SectionNav (chrome)

| Component | Data | Scope |
|---|---|---|
| `NavBar` | static + candidate display name | full |
| `Hero` | `meta`, `versionMeta`, `aggregated.summary`, derived top-level grade, `metadata.analysis.models` keys | full |
| `SectionNav` | section ids | full (sticky, scrollspy via `IntersectionObserver`) |

### 4.2 Synthèse section

| Widget | Data source | Scope |
|---|---|---|
| Headline | `aggregated.summary` | full |
| Confidence note | `aggregated.summary_agreement` + `aggregated.coverage_warning` | full |
| Strengths / Weaknesses / Gaps columns | `deriveSynthese()` | full |
| Counterfactual paragraph | `aggregated.counterfactual` | full (text only; chart deferred to M_VisualComponents) |
| Downside scenarios | `aggregated.downside_scenarios` | full (simple list: scenario, trigger, probability + severity dots) |

### 4.3 Positionnement section

| Widget | Data source | Scope |
|---|---|---|
| Radar (5-axis pentagon with consensus-interval bands) | `deriveRadarShape` | **baseline** — static SVG, no animation; polished version → M_VisualComponents |
| Per-axis agreement bar row | `aggregated.positioning.<axis>.dissent`, `consensus_interval`, `modal_score` | full |
| Anchor labels | `site/lib/anchors.ts` | full |
| Hover tooltip on dissent marker | dissent reasoning | **deferred** to M_VisualComponents |

### 4.4 Domaines section

| Widget | Data source | Scope |
|---|---|---|
| `DimensionTile` grid (5 tiles) | `aggregated.dimensions.<dim>.grade.consensus` + dissent count | full |
| Expand → deep-dive panel | dimension summary, problems_addressed / problems_ignored / problems_worsened, execution_risks, key_measures, per-model grade map | full (collapsible via `<details>` or client component) |

Note: the Zod schema grades are `A..F` / `NOT_ADDRESSED` only — no
`+`/`-` gradations. The tile renders the letter verbatim.

### 4.5 Impact intergénérationnel section

| Widget | Data source | Scope |
|---|---|---|
| Two-column split panel | `aggregated.intergenerational.impact_on_25yo_in_2027` and `impact_on_65yo_in_2027` | full (static, no hover; hover affordances → M_VisualComponents) |
| Net transfer direction header | `aggregated.intergenerational.net_transfer_direction` + `magnitude_estimate` | full |
| Narrative summaries | `*.narrative_summary` | full |

### 4.6 Risques section

| Widget | Data source | Scope |
|---|---|---|
| Per-risk rows grouped by dimension | `aggregated.dimensions.<dim>.execution_risks[]` | full |
| Columns: probability, severity (confidence dots) | `execution_risks[*].probability`, `.severity` | full |
| Dimension group header | dimension label | full |
| Color scale (background tint on cells) | `max(probability, severity)` | full |
| Interactive filtering / sorting | — | **deferred** |

### 4.7 Transparency footer (stub)

| Element | Data source | Scope |
|---|---|---|
| "Analyse produite par N modèles" line | `metadata.analysis.models` keys + `source_models` | full |
| Per-model pill (provider + exact_version + status) | `metadata.analysis.models.<id>` | full |
| Prompt SHA256s (analysis + aggregation) | `metadata.analysis.prompt_sha256`, `metadata.aggregation.prompt_sha256` | full |
| Human review status + reviewer + date | `metadata.aggregation.human_review_completed`, `.reviewer`, `.reviewed_at` | full |
| Link: download aggregated.json | static path | full |
| **Slide-in drawer with raw JSONs, agreement map, prompts rendered** | — | **deferred to M_Transparency** |

---

## 5. Styling

### 5.1 OKLCH token port

The prototype's CSS variables (`Candidate Page.html` `:root` and
`[data-theme="dark"]`) are ported **verbatim** into `site/styles/globals.css`.
Tailwind consumes them via `theme.extend.colors`:

```ts
// tailwind.config.ts (excerpt)
theme: {
  extend: {
    colors: {
      bg: "oklch(var(--bg))",
      "bg-subtle": "oklch(var(--bg-subtle))",
      text: "oklch(var(--text))",
      "text-secondary": "oklch(var(--text-secondary))",
      accent: "oklch(var(--accent))",
      "risk-red": "oklch(var(--risk-red))",
      rule: "oklch(var(--rule))",
      // ...
    },
  },
}
```

CSS variable form avoids per-theme class toggling — dark mode only swaps the
variables on `[data-theme="dark"]`.

### 5.2 Typography

`site/app/layout.tsx`:

```ts
import { Cormorant_Garamond, DM_Sans } from "next/font/google";

const display = Cormorant_Garamond({ subsets: ["latin"], weight: ["400","600","700"], variable: "--font-display" });
const text    = DM_Sans({ subsets: ["latin"], weight: ["300","400","500","600","700"], variable: "--font-text" });
```

`tailwind.config.ts` maps `fontFamily.display = "var(--font-display)"`,
`fontFamily.sans = "var(--font-text)"`.

### 5.3 Dark mode + width toggle

- `ThemeToggle` client component sets `data-theme` on `<html>`. Persisted to
  `localStorage["e27-theme"]`.
- The prototype's "width" toggle (narrow/wide) is retained and maps to a
  `--content-max` CSS variable. Not persisted across candidates in v1.

---

## 6. Test strategy

### 6.1 Unit tests (Vitest, in `site/`)

- `lib/candidates.test.ts`:
  - loads test-omega successfully
  - throws `CandidateDataError` when aggregated.json is missing
  - throws with Zod issues on a corrupted aggregated.json (fixture-mutated)
- `lib/derived/*.test.ts`:
  - `top-level-grade` — all dimension-grade combinations + modifier boundaries
  - `synthese-selection` — top-3 logic, tie-break, empty-fallback message
  - `positioning-shape` — modal-null → midpoint + dissent flag

### 6.2 Build test

Root `package.json` gets a `test:site-build` script:

```json
"test:site-build": "pnpm --filter site build"
```

CI runs this against the `test-omega` fixture. The build must succeed and
produce `site/out/candidat/test-omega/index.html`.

### 6.3 Out of scope

- No Playwright / browser E2E in v1 (deferred to M_Accessibility).
- No visual regression (deferred to M_VisualComponents).
- No lighthouse budget enforcement (deferred to M_Accessibility).

---

## 7. Dependencies (package.json `site/`)

Production:

- `next` (latest stable supporting App Router static export)
- `react`, `react-dom`
- `zod` (shared version with pipeline)

Dev:

- `typescript`, `@types/node`, `@types/react`, `@types/react-dom`
- `tailwindcss`, `postcss`, `autoprefixer`
- `vitest`, `@vitejs/plugin-react`
- `eslint-config-next` (composed with root ESLint config)

**Explicit non-dependencies in v1:**

- No Recharts / D3 / visx — the baseline radar is hand-rolled SVG (same
  approach as the prototype). Reintroduce a charting lib in
  M_VisualComponents if needed.
- No `@next/bundle-analyzer` — defer to M_Accessibility.
- No `framer-motion` — the prototype has almost no animation; we keep it
  that way.

---

## 8. Open questions

1. **Static asset path for candidate photos.** The prototype uses party-color
   placeholder rectangles. Real photos will go in `candidates/<id>/photo.jpg`
   and be copied to `site/public/candidates/` at build time — the copy step
   is out of scope for M_WebsiteCore and will be added when the first real
   candidate has a photo.
2. **Metadata freshness signal.** Should the site show a "Dernière mise à
   jour il y a N jours" line in the hero if the latest `version_date` is
   stale? Deferred to M_UpdateWorkflow.
3. **Markdown rendering.** `sources.md` is referenced by the transparency
   footer as a download link only in v1. Inline markdown rendering arrives
   in M_Transparency with `react-markdown`.

---

## Related specs

- [`structure.md`](structure.md) — overall site structure (stable after 0051)
- [`visual-components.md`](visual-components.md) — component polish spec
  (extended by M_VisualComponents)
- [`transparency.md`](transparency.md) — drawer design (implemented by
  M_Transparency)
- [`../analysis/output-schema.md`](../analysis/output-schema.md) — the
  per-model schema the aggregation derives from
- [`../analysis/aggregation.md`](../analysis/aggregation.md) — the aggregated
  schema this site consumes
- [`../analysis/political-positioning.md`](../analysis/political-positioning.md)
  — axis and anchor definitions
- [`../analysis/editorial-principles.md`](../analysis/editorial-principles.md)
  — the non-negotiables this spec walks through
