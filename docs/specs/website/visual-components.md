# Visual Components

> **Version:** 1.1
> **Status:** Stable (promoted from Draft by spike `0070`, 2026-04-20)
> **Scope:** Signature visual components of the candidate page.
> **Out of scope:** Source-ref linking, transparency drawer, raw-output
> viewer (see [`transparency.md`](transparency.md)). Landing and comparison
> visuals (see [`structure.md`](structure.md)).

---

## 1. Overview

This spec is the canonical description of the visual components used by
the candidate page. Each component lives in `site/components/` and
consumes `aggregated.json` via the types re-exported from `@pipeline/*`.

Components are divided into three categories:

- **Widgets** (`site/components/widgets/`) — reusable leaf components.
- **Sections** (`site/components/sections/`) — page-level compositions.
- **Chrome** (`site/components/chrome/`) — navigation, section heads,
  transparency footer.

This spec covers widgets. Section composition is in
[`nextjs-architecture.md`](nextjs-architecture.md) §4–§5.

---

## 2. Design constraints (apply to every component)

1. **Symmetric treatment.** Identical rendering for every candidate. No
   candidate gets a special view, no dimension is hidden when empty.
2. **Information layered.** Top-level at-a-glance → hover/focus reveals
   evidence and dissent. Never hide information permanently.
3. **Color secondary to content.** Color reinforces but never carries the
   signal alone. Text, icons, or position must convey the same
   information for colorblind / dark-mode / print readers.
4. **Measurement visible.** Where `aggregated.json` carries a quantified
   claim, show the number — not an adjective.
5. **Dissent visible.** When models disagreed, the visual shows it.
   Positioning scores are ordinal; see
   [`../analysis/political-positioning.md`](../analysis/political-positioning.md).
6. **No fabrication.** If upstream data is missing a field (e.g. year-by-
   year trajectory values), the visual says so or is not shipped. See
   `TrajectoryChart` deferral in §6.

---

## 3. Component inventory

| Widget | File | Data source | Category |
|---|---|---|---|
| `PositioningRadar` | `widgets/PositioningRadar.tsx` | `positioning` | §4.1 |
| `AxisAgreementBars` | `widgets/AxisAgreementBars.tsx` | `positioning[axis]` | §4.2 |
| `PositioningLegend` | `widgets/PositioningLegend.tsx` | `positioning` | §4.3 |
| `IntergenSplitPanel` | `widgets/IntergenSplitPanel.tsx` | `intergenerational` | §4.4 |
| `RiskHeatmap` | `widgets/RiskHeatmap.tsx` | `dimensions.*.execution_risks` | §4.5 |
| `GradeBadge` | `widgets/GradeBadge.tsx` | `top_level.overall_grade` / dimension grades | §4.6 |
| `DimensionTile` | within `sections/DomainesSection.tsx` | `dimensions[k]` | §4.7 |
| `ProblemsColumns` | within `sections/DomainesSection.tsx` (`DimensionDeepDive`) | `dimensions[k].problems_*` | §4.8 |
| `CounterfactualBlock` | within `sections/SyntheseSection.tsx` | `counterfactual` | §4.9 |
| `ConfidenceDots` | `widgets/ConfidenceDots.tsx` | any `confidence` ∈ [0, 1] | §4.10 |
| `Tooltip` | `widgets/Tooltip.tsx` | — (infrastructure) | §4.11 |

Components out of scope here:

- `SourceRef`, `TransparencyDrawer` → [`transparency.md`](transparency.md).
- `TrajectoryChart` → deferred; see §6.

---

## 4. Component specs

### 4.1 `<PositioningRadar>`

**Purpose.** At-a-glance 5-axis positioning summary.

**Rendering.** Pure SVG, server component. 280×280 viewBox, concentric
pentagon grid (5 levels), spokes, consensus polygon filled with
`var(--accent-subtle)` + stroke `var(--accent)`.

**Data.** Takes a `RadarShape` view-model from
`site/lib/derived/positioning-shape.ts`. The shape includes, per axis:
consensus interval `[min, max]`, modal `radarValue` in `[-5, +5]`,
`hasDissent` flag.

**Required behavior.**
- Concentric grid always visible; zero-line (value 0) emphasized.
- Consensus polygon filled at the modal values.
- Axis labels at each vertex, using canonical anchor labels from
  `site/lib/anchors.ts` (shared across all candidates — never per-
  candidate).
- `aria-label` summarizes every axis for screen readers.
- **Per-axis hover** reveals the consensus interval, modal value,
  `hasDissent` state, and a short dissent summary. Implemented by an
  invisible hit-area at each vertex wrapping a `<Tooltip>`. Task `0071`.

**Responsive.** Below `sm` breakpoint (<640 px), the radar is replaced by
a compact vertical list of axes (reuses `AxisAgreementBars`) — avoids
unreadably small SVG. Task `0074`.

**Never.**
- Never display a single "average score". Positioning is ordinal.
- Never hide the consensus interval when it is wide — a wide interval is
  the signal.

---

### 4.2 `<AxisAgreementBars>`

**Purpose.** Canonical representation of positioning on a single axis
(11-point scale `−5…+5`). The radar is a summary; this is the truth.

**Rendering.** Pure DOM; each marker is an `absolute`-positioned span
whose `left` is the axis percentage.

**Data.** Per-axis `PositioningAxis` from `aggregated.json > positioning[axis]`:
- `consensus_interval: [min, max]`
- `modal_score: number` (the anchored "consensus" point)
- `dissent: Array<{model, position, reasoning}>`
- `anchor_narrative: string`

**Required behavior.**
- Horizontal axis with tick marks at every integer `−5…+5`.
- Consensus interval rendered as a shaded band (`var(--accent-subtle)`).
- Modal marker rendered as a filled dot using `var(--accent)`.
- Anchor labels (e.g. `Fillon 2017`, `Mélenchon 2022`) rendered beneath
  the axis at their scripted positions, pulled from `site/lib/anchors.ts`.
- Dissenting model scores rendered as hollow dots; border color is the
  deterministic palette entry from `site/lib/model-color.ts` so each
  model is visually distinct.
- Every marker (anchor tick, modal, dissent) wraps a `<Tooltip>` — no
  native `title=""` attributes — so hover is instant.
- Dissent tooltip shows `<strong>{model}</strong> — position N` + the
  model's `reasoning`.

**Anchor set.** Fixed per project. Changes to the anchor set are a new
analysis version (they change how scores are interpretable across runs).

---

### 4.3 `<PositioningLegend>`

**Purpose.** Map the model-color palette used by `AxisAgreementBars`
dissent markers to model identifiers, so the reader can translate a
hollow dot to a model name.

**Rendering.** Pure DOM. Collects the union of all `positioning[axis].dissent[].model`
across the five axes, sorts them, renders a swatch + model name for each.

**Data.** Derived from `aggregated.json > positioning`.

**Required behavior.**
- Empty-state text: "Aucun désaccord significatif entre les modèles."
- Consensus swatch entry on top: `var(--accent)` filled dot.
- Per-model swatches colored by `modelColor(id)` from
  `site/lib/model-color.ts`.

---

### 4.4 `<IntergenSplitPanel>`

**Purpose.** Signature visual of the intergenerational audit — two
columns with identical visual weight comparing impact on a 25-year-old
vs a 65-year-old in 2027.

**Rendering.** Two-column CSS grid (`md:grid-cols-2`), stacks to one
column on mobile.

**Data.** `aggregated.json > intergenerational`:
- `impact_on_25yo_in_2027 > {fiscal, housing, pension_outlook, labor_market, environmental_debt, narrative_summary}`
- `impact_on_65yo_in_2027 > {fiscal, pension, healthcare, narrative_summary}`
- Each cell: `{quantified_finding?, qualitative_description, reasoning, source_refs, confidence}`
- Top-level `confidence`

**Required behavior.**
- Every cell shows: sub-dimension label, `ConfidenceDots` (cell-level
  confidence), quantified finding or qualitative description.
- Both columns padded to equal row count; empty rows render "Non
  quantifié" in the tertiary text color. Neither column is ever hidden.
- **Per-cell hover** opens a `<Tooltip>` showing the full `reasoning` and
  the raw `source_refs` strings (e.g. `REF:social:42`). Tasks `0072`.
  - Source-ref strings are shown as plain text for now; navigation into
    `sources.md` is implemented by M_Transparency's drawer.
- Narrative summary at the bottom of each column.

**Editorial rules (enforced by design review, not code).**
- Cell language is measurement, never moral claim. See
  [`../analysis/intergenerational-audit.md`](../analysis/intergenerational-audit.md).
- Numbers where possible; "Non quantifié" when absent.

**Never.**
- Never color one column red and the other green.
- Never hide a cohort, even if the program primarily affects one.

---

### 4.5 `<RiskHeatmap>`

**Deliberate divergence from the original draft spec.** The draft
described a 2D scatter (probability × severity). The implementation is a
**per-risk expandable table**, grouped by dimension. Rationale
(from spike `0050`):

- A scatter invites composing probability × severity into a single
  "risk score", which is the exact cardinal aggregation we refuse for
  positioning. Showing each risk on its own row with both axes reported
  independently as `ConfidenceDots` avoids the composition temptation.
- The number of risks (5×dimensions × multiple risks each) is small
  enough that a table is readable and does not require zoom/pan.
- Expandable rows surface model provenance and reasoning without a
  separate drawer.

**Rendering.** Client component (`"use client"`). 5-column table:
Risque / Probabilité / Sévérité / Modèles / chevron. Rows grouped by
dimension header row.

**Data.** `aggregated.json > dimensions[k].execution_risks[]`:
- `risk`, `probability`, `severity`, `reasoning`, `source_refs`,
  `supported_by`, `dissenters?`, `human_edit?`.

**Required behavior.**
- Probability and severity each rendered as a `ConfidenceDots` 5-dot
  scale — never composed.
- `Modèles` column shows `supported_by.length / totalCoverage` as a pill.
- Whole row is clickable (`cursor-pointer`) and toggles the expanded
  panel; a secondary chevron `<button>` exists for keyboard access with
  `aria-expanded`.
- Expanded panel: two-column grid, reasoning on the left, `supported_by`
  and (optional) `dissenters` pills on the right.
- Row background tint driven by `max(probability, severity)` using a
  5-step OKLCH palette, staying well below saturation thresholds (purely
  supplementary — text still carries the signal).

**Responsive.** Horizontal overflow (`overflow-x-auto`) on the table
wrapper; no other mobile treatment is needed because the column widths
are already content-driven.

**Never.**
- Never synthesize a single risk score.
- Never hide rows with low values; measurement includes "we looked and
  it is not a risk".

---

### 4.6 `<GradeBadge>`

**Purpose.** Letter grade (A–F, or "Non abordé") with optional `+`/`−`
suffix.

**Rendering.** Pure DOM pill. Letter carries the signal; color fill is
supplementary. Sizes: `sm`, `md`, `lg`.

**Color mapping** (from `site/lib/grade-color.ts`):

| Grade | Color token |
|---|---|
| A | `oklch(0.62 0.14 145)` (green) |
| B | `oklch(0.68 0.14 120)` |
| C | `oklch(0.72 0.14 90)` |
| D | `oklch(0.66 0.17 50)` |
| F | `var(--risk-red)` |
| Non abordé | `var(--text-tertiary)` |

**Editorial rule.** The `+`/`−` modifier reflects **consensus strength**
(how tightly models agreed), not substantive judgement. See
[`../analysis/editorial-principles.md`](../analysis/editorial-principles.md).

---

### 4.7 `<DimensionTile>`

**Purpose.** One tile per dimension on the domain scorecard grid.

**Rendering.** `<button>` element (keyboard + a11y), expands the
`DimensionDeepDive` panel below the grid. Five tiles, responsive grid
(`1 / 2 / 5` columns by breakpoint).

**Data.** `aggregated.json > dimensions[k]`:
- `grade.consensus: GradeLetter`
- `grade.dissent: Record<modelId, GradeLetter>`
- `confidence: number`

**Required behavior.**
- Shows `GradeBadge` (consensus), dimension label, `ConfidenceDots`,
  and a dissent indicator `⚡ N` when at least one model's grade
  differs from the consensus letter.
- **Per-model grade reveal** on hover/focus: `<Tooltip>` listing each
  model's grade, ordered by `modelId`. Task `0073`.
- `aria-expanded` drives the active deep-dive section.

---

### 4.8 `<ProblemsColumns>`

**Purpose.** Three-column summary within `DimensionDeepDive`: Problems
addressed / ignored / worsened.

**Rendering.** Three equal CSS grid columns on `md+`, stacks on mobile.

**Data.** Per dimension, three parallel lists from
`aggregated.json > dimensions[k] > problems_addressed | problems_ignored | problems_worsened`.

**Required behavior.**
- Icons carry the signal (`✓` / `—` / `⚠`); color is reinforcement.
- Truncates to `MAX_ITEMS = 5` per column with an "+N autres" overflow
  pill.
- `supported_by` / `dissenters` pills shown inline per item.
- `source_refs` display deferred to M_Transparency (drawer).

**Never.**
- Never double-count: a problem that is simultaneously addressed and
  worsened appears under `worsened` only, with a note.
- Never hide an empty column (shows "Aucun …" fallback text).

---

### 4.9 `<CounterfactualBlock>`

**Purpose.** Qualitative summary of how the candidate's program deviates
from the status-quo trajectory. This is the editorial stand-in for
`TrajectoryChart` (see §6).

**Rendering.** DOM block within `SyntheseSection`. Two-column body
(Statu quo / Effet du programme), direction badge + confidence on the
top-right.

**Data.** `aggregated.json > counterfactual`:
- `status_quo_trajectory: string`
- `does_program_change_trajectory: boolean`
- `direction_of_change: "improvement" | "worsening" | "neutral" | "mixed"`
- `dimensions_changed[]`, `dimensions_unchanged[]`
- `reasoning: string`
- `confidence: number`
- `supported_by[]`, `dissenters?[]`

**Required behavior.**
- Direction badge: icon + label + color, one of
  ↑ improvement (green) / ↓ worsening (red) / → neutral (grey) /
  ↔ mixed (amber).
- `ConfidenceDots` + numeric `%` next to the badge.
- Title "Si rien ne change" with an info `i` tooltip explaining the
  counterfactual methodology.
- Dimension pills translate the canonical `DimensionKey` via
  `site/lib/dimension-labels.ts` — filled style for
  `dimensions_changed`, dashed for `dimensions_unchanged`.
- `supported_by` / `dissenters` pills at the block's bottom.

**Never.**
- Never use advocacy framing. Colors are direction labels, not moral
  colors (e.g. a "worsening" arrow does not mean "bad" — the reader
  draws the conclusion from their own axiology).

---

### 4.10 `<ConfidenceDots>`

**Purpose.** 5-dot indicator for any `confidence ∈ [0, 1]`.

**Rendering.** Five circles; filled `= round(confidence × 5)`, unfilled
outline otherwise. `aria-label` includes the numeric value.

**Editorial rule.** Never used for "agreement" counts; those use the
`k/n` pill form instead.

---

### 4.11 `<Tooltip>`

**Purpose.** Instant-display tooltip wrapper used everywhere native
`title=""` (2-second delay) would be too slow.

**Rendering.** Pure CSS. `group/tt` wrapper + `group-hover/tt` /
`group-focus-within/tt` on the bubble. Transition `duration-75`.

**Props.**
- `content: ReactNode`
- `children: ReactNode` (the visible trigger)
- `side?: "top" | "bottom"` (default: top)
- `as?: "span" | "div" | "button"` (default: span)
- `className?: string`
- `style?: CSSProperties`

**Accessibility.**
- Wrapper gets `tabIndex={0}` so keyboard users can focus it.
- Bubble uses `role="tooltip"` and references `aria-describedby` when
  `children` is interactive.
- `bg-text` / `text-bg` pair inverts naturally with the theme.

**When NOT to use.** For pure decoration with no additional
information, don't wrap — Tooltip implies the hover carries content.

---

## 5. Shared helpers

| Helper | File | Purpose |
|---|---|---|
| `AXES`, `ANCHORS` | `site/lib/anchors.ts` | Canonical axis labels + scripted anchor positions. |
| `DIMENSION_KEYS`, `DimensionKey` | `site/lib/derived/keys.ts` | Canonical dimension key list. |
| `DIMENSION_LABELS`, `dimensionLabel()` | `site/lib/dimension-labels.ts` | i18n for dimension keys. |
| `modelColor(id)` | `site/lib/model-color.ts` | Deterministic hash → OKLCH palette index. |
| `toRadarShape()` | `site/lib/derived/positioning-shape.ts` | `positioning` → `RadarShape` view-model. |
| `gradeColor()` | `site/lib/grade-color.ts` | Grade letter → OKLCH token. |
| `t(i18nString, lang)` | `site/lib/i18n.ts` | Lookup helper. |

---

## 6. Deferred components

### 6.1 `<TrajectoryChart>` — deferred

The draft spec described a time-series chart of France's status-quo
trajectory vs. the candidate's projected deviation, with year-by-year
values from `counterfactual`.

**Why deferred.** The current `AggregatedOutputSchema` does not carry
year-by-year trajectory values. Rendering a chart would require either
(a) fabricating the series (unacceptable — violates transparency and
measurement principles), or (b) a schema + prompt extension to produce
trajectory series per metric per candidate.

**Replacement in v1.** `CounterfactualBlock` (§4.9) gives a qualitative
direction + confidence summary using only data that exists. This is
sufficient for launch.

**Future work.** A new milestone — provisionally `M_TrajectoryData` —
would extend the analysis prompt to produce year-by-year series for a
fixed set of metrics (debt-to-GDP, working-age population share, energy
mix) anchored on public INSEE / Banque de France baselines. This is an
analysis-prompt change, not a visual change, and is explicitly out of
scope for M_VisualComponents.

### 6.2 `<SourceRef>`, `<TransparencyDrawer>` — owned by M_Transparency

See [`transparency.md`](transparency.md). `IntergenSplitPanel` and
`ProblemsColumns` display `source_refs` as plain text in v1;
M_Transparency turns them into drawer anchors.

---

## 7. Responsive & accessibility policy

- Every visual is legible and complete with keyboard navigation only.
- `prefers-reduced-motion` disables all opacity / transform transitions
  (Tooltip included). Task `0074`.
- Minimum hit area 24×24 px on interactive markers.
- Color pairs meet WCAG AA contrast against `--bg` and `--bg-subtle`.
- Full WCAG audit lives in `M_Accessibility`; this spec covers only the
  component-level requirements.

---

## 8. Charting library decision

**v1 ships with no charting library.** Pure SVG covers the radar; DOM +
Tailwind covers everything else. Recharts / D3 is revisited only when
`TrajectoryChart` (or another time-series visual) is scoped, at which
point the choice is made in that milestone's spike.

---

## 9. Testing strategy

- **Smoke**: `npm run test:site-smoke` builds the site against
  `test-omega` and asserts each widget renders without throwing.
- **View-model**: derivation helpers (`positioning-shape`,
  `dimension-labels`, `model-color`) have Vitest unit tests. No
  snapshot tests — they rot.
- **Interaction**: hover tooltips are pure CSS and do not require JS
  tests; focus-visible behavior is asserted via React Testing Library
  on the interactive widgets (`DimensionTile`, `RiskHeatmap` row).
- **Accessibility**: `aria-label` presence asserted in unit tests.

---

## Change log

- **v1.1 (2026-04-20)** — Promoted to Stable by spike `0070`. Reconciled
  with implementation: RiskHeatmap is a per-risk expandable table (not
  2D scatter), new widgets (Tooltip, PositioningLegend,
  CounterfactualBlock, ConfidenceDots, GradeBadge) documented.
  TrajectoryChart deferred to a future data milestone. SourceRef /
  TransparencyDrawer moved to `transparency.md`.
- **v1.0** — Draft by M_Foundation.
