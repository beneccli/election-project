# Website Structure

> **Version:** 1.0
> **Status:** Draft — to be finalized by M_WebsiteCore spike

---

## Overview

The website is a **static Next.js application** (static export) that reads from `candidates/<id>/current/aggregated.json` at build time and renders a visual, scannable presentation of each candidate's analysis, plus a comparison mode and a transparency drawer.

---

## Design principles

1. **Scannable in 30 seconds, deep in 30 minutes.** Information is layered: top-level visual summary → expandable dimension details → source-level evidence.
2. **Comparison is the killer feature.** One candidate alone is interesting; comparing 2–4 on identical dimensions is the core value.
3. **Every claim has a traceable source.** Hover or click reveals the evidence. No orphan claims.
4. **Transparency is always one click away.** The raw per-model outputs, prompts, and sources are accessible from every candidate page.
5. **Mobile-first, fast, accessible.** LCP < 1.5s on mobile. WCAG 2.1 AA.
6. **Same visual grammar for every candidate.** No one gets a nicer-looking page than another — symmetric scrutiny extends to layout.

---

## Page inventory

| Page | Route | Purpose |
|------|-------|---------|
| Landing | `/` | Stakes framing + candidate grid + entry to comparison |
| Candidate | `/candidat/<id>` | The core product — full analysis of one candidate |
| Compare | `/comparer?c=<id>&c=<id>&…` | Side-by-side across identical dimensions |
| Methodology | `/methodologie` | How every claim is produced |
| Changelog | `/changelog` | When each candidate was last updated and why |
| About / Legal | `/a-propos`, `/mentions-legales` | Team, funding disclosure, legal |

Language: French primary. Future milestone may add English.

---

## Landing page (`/`)

### Layout top-to-bottom

1. **Hero band** — project title, one-sentence description, editorial stance ("analyse, pas plaidoyer").
2. **Stakes panel** — two or three France-level charts that set context for every candidate analysis:
   - Public debt trajectory
   - Demographic pyramid / birthrate trajectory
   - Age cohort net fiscal position (optional)
   These are **context charts**, not candidate-specific. They render the counterfactual baseline visually.
3. **Candidate grid** — cards, one per candidate, with:
   - Photo
   - Name + party
   - 5-axis mini-radar (consensus intervals only, no details)
   - Last updated date
   - Click → candidate page
4. **Comparison CTA** — "Comparer plusieurs candidats" → comparison page with candidate-picker
5. **Methodology CTA** — "Comment ça marche" → methodology page
6. **Transparency summary** — short paragraph with: number of models used, when last updated, link to repository.

### Visual tone

Minimal chrome. The charts and candidate cards are the content. No hero graphics, no stock photos, no animations beyond subtle entrance fades.

---

## Candidate page (`/candidat/<id>`)

**The core product.** This page is opened more than any other, and its structure carries the editorial argument.

### Structure top-to-bottom

#### 1. Header band

- Candidate photo (modest size, not hero-scale)
- Name, party, declared candidate date
- Version metadata: "Analyse basée sur le programme au <date>. Mise à jour : <date>."
- Link to all historical versions (future milestone)
- Link to transparency drawer (sources, prompts, raw outputs)

#### 2. One-paragraph summary

3–4 sentences synthesizing what this candidate is fundamentally proposing. Written from `aggregated.json`'s `summary` field. Under the paragraph: a confidence note ("consensus across 4 of 5 models" or "significant disagreement on economic dimension").

#### 3. Political positioning

**Two views, presented together:**

- **5-axis radar chart** — consensus intervals rendered as bands, modal values as markers. The radar is a summary.
- **Horizontal axis view** — one row per axis, with anchor figures labeled (e.g., "Hollande 2012" at -2 on economic axis, "Mélenchon 2022" at -4). This is the canonical representation; the radar is an at-a-glance shortcut.

Click any axis reveals:
- Evidence quotes from `sources.md`
- Per-model positions (dissent preservation)
- The model's reasoning for its placement

See [`visual-components.md`](visual-components.md) for the component specs.

#### 4. Intergenerational panel (prominent)

**The signature visual component.** Two-column split:

| À 25 ans (né en 2002) | À 65 ans (né en 1962) |
|-----------------------|------------------------|
| Fiscal impact         | Fiscal impact          |
| Housing projection    | Pension projection     |
| Pension outlook       | Healthcare projection  |
| Labor market          |                        |
| Environmental debt    |                        |

Each cell shows a quantified finding where possible ("€X/an", "Y% de chance de devenir propriétaire"), a confidence marker, and a hover affordance for source evidence.

Below the split: a one-line narrative synthesis for each cohort.

This panel is **not buried**. It appears before the full dimension grid because it's cross-cutting.

See [`visual-components.md`](visual-components.md) for the Intergenerational Split Panel spec.

#### 5. Dimension scorecard grid

Tile grid, one tile per dimension cluster (from [`../analysis/dimensions.md`](../analysis/dimensions.md)):

```
┌─────────────────┬─────────────────┬─────────────────┐
│ Économique &    │ Social &        │ Sécurité &      │
│ fiscal          │ démographique   │ souveraineté    │
│ Grade: B-       │ Grade: C+       │ Grade: B        │
│ ●○○○○           │ ●●○○○           │ ●●●○○           │
└─────────────────┴─────────────────┴─────────────────┘
┌─────────────────┬─────────────────┐
│ Institutionnel  │ Environnement & │
│ & démocratique  │ long terme      │
│ Grade: A-       │ Grade: B        │
│ ●●●●○           │ ●●●○○           │
└─────────────────┴─────────────────┘
```

Each tile is clickable → expands into full dimension detail below.

Color coding reflects grade, but color is **secondary** to the grade letter itself (accessibility: information is not conveyed by color alone).

#### 6. Problems solved / ignored / worsened

Three-column layout:

```
┌────────────────────┬────────────────────┬────────────────────┐
│ ✓ Problèmes        │ — Problèmes        │ ⚠ Problèmes       │
│   adressés         │   non adressés     │   aggravés         │
├────────────────────┼────────────────────┼────────────────────┤
│ • Item 1           │ • Item 1           │ • Item 1           │
│ • Item 2           │ • Item 2           │ • Item 2           │
│ ...                │ ...                │ ...                │
└────────────────────┴────────────────────┴────────────────────┘
```

Items are brief (5–10 words), clickable → evidence drawer.

#### 7. Execution risk heatmap

2-axis chart: probability × severity. Each execution risk from `aggregated.json` plotted as a point with label. Click → reasoning.

#### 8. Downside scenarios

A short section: "Si ce programme échoue, à quoi ressemble la France ?"

2–4 scenarios from `aggregated.json`, each with: description, trigger, probability, severity.

#### 9. Counterfactual comparison

"Par rapport à la trajectoire actuelle (statu quo)"

- Does this program change France's trajectory? (yes/no/mixed)
- On which dimensions?
- In which direction?

Visual: a small "France trajectory" chart (same as landing page's stakes chart) with the candidate's projected adjustment overlaid.

#### 10. Deep dive sections (collapsible)

One per dimension cluster. When collapsed, only the tile in section 5 is visible. When expanded:

- Summary
- All problems addressed / ignored / worsened for this dimension
- All execution risks for this dimension
- Key measures with quantifications
- Source references (clickable, open `sources.md` drawer at the right section)
- Agreement annotation (which models agreed, which dissented, on each claim)

#### 11. Transparency footer

Always visible at the bottom of the page:

- "Cette analyse a été produite par N modèles d'IA : <list with versions>"
- Links:
  - Programme source (PDFs in `sources-raw/`)
  - Document consolidé (`sources.md`)
  - Prompts utilisés (`prompts/*.md` with commit hash)
  - Résultats bruts par modèle (`raw-outputs/*.json`)
  - Notes d'agrégation (`aggregation-notes.md`)

See [`transparency.md`](transparency.md) for the drawer design.

---

## Comparison page (`/comparer`)

### Structure

1. **Candidate picker** — multi-select, 2–4 candidates
2. **Dimensions as rows, candidates as columns:**

```
              │ Dupont   │ Moreau   │ Lefebvre │
──────────────┼──────────┼──────────┼──────────┤
Positioning   │ [radar]  │ [radar]  │ [radar]  │
──────────────┼──────────┼──────────┼──────────┤
Economic      │ B-       │ C+       │ A-       │
──────────────┼──────────┼──────────┼──────────┤
Social        │ C        │ B        │ B+       │
──────────────┼──────────┼──────────┼──────────┤
...
Intergen (25) │ €-X/yr   │ €+Y/yr   │ ≈0       │
Intergen (65) │ €+X/yr   │ €-Y/yr   │ ≈0       │
```

Each cell clickable → takes user to the corresponding section on that candidate's page.

3. **Visual diff highlighter** — when a dimension has meaningfully different grades across selected candidates, the row is subtly emphasized.

### Non-features

- No "winner" designation
- No composite "overall score" across candidates
- No ideological alignment calculator
- No voter-preference match

These are intentional non-features — they would compromise the analysis/advocacy distinction.

---

## Methodology page (`/methodologie`)

A long-form page explaining:

1. How sources are gathered (links to `docs/specs/data-pipeline/source-gathering.md`)
2. How the consolidation works (`sources.md` and the human review gate)
3. Which models are used and why (model diversity rationale)
4. The analysis prompt (link to `prompts/analyze-candidate.md`)
5. How aggregation works (Option A meta-LLM + agreement map + human review)
6. The editorial principles (link to `docs/specs/analysis/editorial-principles.md`)
7. The 5-axis positioning methodology
8. The intergenerational measurement approach
9. Known limitations and potential biases
10. How to replicate or audit our work

This page is **long and detailed by design**. It is for the subset of users who want to scrutinize the methodology — and it's how the project defends itself against good-faith criticism.

---

## Changelog page (`/changelog`)

Reverse-chronological list:

```
2026-06-01  Dupont — version mise à jour
            Nouveau programme publié le 2026-05-28. Réanalyse complète.
            Changements notables : positionnement économique +1, nouvelles
            propositions retraite.
            [Version précédente] [Diff]

2026-05-15  Moreau — correction
            Correction factuelle section Environnement (erreur d'attribution).
            [Version précédente] [Diff]
```

---

## Data loading

At **build time** (`npm run build`):

- For each candidate:
  - Resolve `candidates/<id>/current/aggregated.json`
  - Load into static props for candidate page
- Aggregate all candidates into landing page data
- Generate all pages as static HTML

Runtime data loading: none. The site is fully static.

### Consequences

- Every deployment = a fresh build
- Updating a candidate = new commit + auto-deploy
- Incredibly fast (sub-second LCP achievable)
- Near-zero hosting cost
- No runtime database, no API surface to secure

---

## Component inventory (summary)

Detailed specs in [`visual-components.md`](visual-components.md). Summary:

| Component | Usage |
|-----------|-------|
| `<PositioningRadar>` | 5-axis radar with consensus bands |
| `<PositioningAxisRow>` | Horizontal single-axis with anchors |
| `<IntergenerationalSplit>` | Two-column cohort impact panel |
| `<DimensionTile>` | Scorecard tile with grade |
| `<ProblemsColumns>` | 3-column solved/ignored/worsened |
| `<RiskHeatmap>` | Execution risk 2-axis scatter |
| `<TrajectoryChart>` | Status-quo baseline + candidate delta |
| `<ConsensusBadge>` | "4 of 5 models agree" annotation |
| `<SourceRef>` | Clickable citation into sources.md |
| `<TransparencyDrawer>` | Side drawer with full artifact access |

---

## Accessibility

- All interactive elements keyboard-navigable
- ARIA labels on visual components
- Color not the sole carrier of meaning (letters on grade tiles, icons on trend indicators)
- Contrast ratios meeting WCAG 2.1 AA
- Charts have tabular fallback views (toggle or hidden-for-accessibility)
- Text scaling up to 200% preserves layout

---

## Performance budget

- LCP < 1.5s on mobile 4G
- Total page weight < 500KB for candidate page (excluding photos)
- No runtime JavaScript on marketing/static sections
- Chart components lazy-loaded below the fold
- No third-party analytics on the hot path (if any analytics, self-hosted, privacy-preserving)

---

## Open questions (for spike)

- Print-friendly view of candidate page?
- Shareable social cards (Open Graph images) per candidate?
- RSS / JSON feed for updates?
- What happens when a candidate withdraws? (Archive page with final analysis.)
- Dark mode? (Yes, via prefers-color-scheme.)

---

## Related Specs

- [`visual-components.md`](visual-components.md)
- [`transparency.md`](transparency.md)
- [`../analysis/dimensions.md`](../analysis/dimensions.md)
- [`../analysis/political-positioning.md`](../analysis/political-positioning.md)
- [`../analysis/intergenerational-audit.md`](../analysis/intergenerational-audit.md)
- [`../analysis/editorial-principles.md`](../analysis/editorial-principles.md)
