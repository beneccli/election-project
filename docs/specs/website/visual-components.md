# Visual Components

> **Version:** 1.0
> **Status:** Draft — to be finalized by M_VisualComponents spike

---

## Overview

This spec describes the **signature visual components** that carry the editorial argument on the candidate page. These are the elements users screenshot, share, and remember — they have to be right.

Each component is a React component in `site/components/`. Technical choices (charting library, styling) are finalized in the spike; design constraints are here.

---

## Design constraints (apply to all components)

1. **Symmetric treatment.** The same component renders identically for every candidate. No candidate gets a special view.
2. **Information layered.** Top-level at-a-glance → hover/click reveals evidence and dissent.
3. **Color secondary to content.** A reader who cannot see color (or uses dark mode, or is printing) gets the same information from text, icons, and position.
4. **Measurement visible where possible.** Where `aggregated.json` contains a quantified claim, show the number, not an adjective.
5. **Dissent visible.** When models disagreed, the visual shows it — never a clean average hiding contested claims.

---

## `<PositioningRadar>`

### Purpose

At-a-glance visualization of a candidate's 5-axis positioning.

### Visual

```
                Économique
                    ▲
                    │
                  ╱─┼─╲
                ╱   │   ╲
  Écologique ◄─────┼─────► Social/culturel
                ╲   │   ╱
                  ╲─┼─╱
                    │
                    ▼
               Institutionnel
                    │
              Souveraineté
```

(A pentagon, one vertex per axis.)

### Required behavior

- Each axis renders the **consensus interval** as a shaded band (not a line).
- Within the band, the **modal value** is a marker.
- Axis labels visible at each vertex.
- Hover on any axis reveals:
  - Exact consensus interval and modal value
  - Per-model scores (dissent)
  - Anchor comparison narrative
- Click axis → scrolls to / opens the full `<PositioningAxisRow>` for that axis.

### Data source

`aggregated.json > positioning > <axis> > consensus_interval / modal_score / dissent`

### Never

- Never display a single "average score" — positioning is ordinal, see [`../analysis/political-positioning.md`](../analysis/political-positioning.md).
- Never hide the consensus interval's width. A wide band means real disagreement; that's information.

---

## `<PositioningAxisRow>`

### Purpose

The **canonical representation** of positioning on a single axis. The radar is a summary; this is the truth.

### Visual

```
Économique
market ◄──────────────────────────────────────► étatiste
     -5    -4    -3    -2    -1    0    +1    +2    +3    +4    +5
                   │╌╌╌╌╌╌╌╌╌╌╌╌╌│
                   [   Consensus interval    ]
                           ●
                    (Fillon 2017)  (Hollande 2012)  (Mélenchon 2022)
                         +3            -2                -4
```

### Required behavior

- Horizontal axis `-5` to `+5` with tick marks.
- Consensus interval as a shaded band.
- Modal value as a point within the band.
- **Anchor figures labeled at their positions** on the axis (consistent across all candidate pages).
- Dissenting model scores shown as hollow markers with model name.
- Hover a dissent marker → tooltip with reasoning.
- Below the axis: the `anchor_narrative` from `aggregated.json`.

### Anchors

The anchor set for each axis is shared across all candidates and defined in a project-level constants file (`site/lib/anchors.ts`, to be created in M_VisualComponents spike). This is **not a per-candidate setting**.

---

## `<IntergenerationalSplit>`

### Purpose

The signature visual of the intergenerational audit. Two columns comparing impact on a young cohort vs. an older cohort.

### Visual

```
┌────────────────────────────────────┬────────────────────────────────────┐
│  À 25 ans (né en 2002)            │  À 65 ans (né en 1962)            │
├────────────────────────────────────┼────────────────────────────────────┤
│  Fiscal                           │  Fiscal                           │
│  ●●●○○  -€340/an net              │  ●●●●○  +€180/an net              │
├────────────────────────────────────┼────────────────────────────────────┤
│  Logement                         │  Retraite                         │
│  ●●○○○  Accession propriété :     │  ●●●●○  Taux de remplacement      │
│         22% → 18% (20 ans)        │         maintenu                   │
├────────────────────────────────────┼────────────────────────────────────┤
│  Retraite projetée                │  Santé                            │
│  ●●●○○  Taux remplacement         │  ●●●○○  Accès préservé           │
│         56% → 48% à 67 ans        │                                    │
├────────────────────────────────────┼────────────────────────────────────┤
│  Marché du travail                │                                    │
│  ●●○○○  Précarité accrue         │                                    │
├────────────────────────────────────┼────────────────────────────────────┤
│  Dette environnementale           │                                    │
│  ●●●○○  Trajectoire 2°C           │                                    │
├────────────────────────────────────┼────────────────────────────────────┤
│  "Cette génération supporte une   │  "Cette génération voit ses        │
│   hausse nette des contributions  │   droits acquis largement          │
│   combinée à un accès au logement │   préservés avec une charge        │
│   en baisse."                     │   fiscale stable."                 │
└────────────────────────────────────┴────────────────────────────────────┘
```

### Required behavior

- Two columns with identical visual weight.
- Every cell shows: sub-dimension label, confidence dots (●○○○○), quantified finding or qualitative description.
- Confidence is a 5-dot indicator: `●●●●●` = 1.0 confidence; `●○○○○` = 0.2 confidence.
- Hover a cell → reveals:
  - Full reasoning from `aggregated.json > intergenerational > impact_on_XXyo > <field>`
  - Source references (clickable into transparency drawer)
  - Agreement annotation (which models supported this)
- Narrative summary at bottom of each column.

### Editorial rules (enforced by design review, not code)

- Language in cells is **measurement**, not moral claim. See [`../analysis/intergenerational-audit.md`](../analysis/intergenerational-audit.md).
- No adjectives doing analytical work.
- Numbers where possible; "non quantifié" when the program does not specify.

### Never

- Never color one column red and the other green. Both get neutral treatment. The reader draws the conclusion.
- Never hide a cohort. Both columns always render, even if the program primarily affects one.

---

## `<DimensionTile>`

### Purpose

A single tile in the dimension scorecard grid on the candidate page.

### Visual

```
┌─────────────────────────┐
│ Économique & fiscal     │
│                         │
│        B-               │
│                         │
│ Consensus: 4/5 modèles  │
│ ▼ Voir détail           │
└─────────────────────────┘
```

### Required behavior

- Dimension label at top
- Large grade letter (A, B, C, D, F, or "Non abordé")
- Consensus annotation (how many models agreed on this grade)
- Click expands or navigates to the dimension deep-dive section
- Color coding **supplements** the letter (accessibility requirement: letter carries the signal, color is redundant reinforcement)

### Color mapping

| Grade | Color (supplementary) |
|-------|-----------------------|
| A | Green (success) |
| B | Green-yellow |
| C | Yellow |
| D | Orange |
| F | Red |
| Non abordé | Gray |

### Dissent marking

If models significantly disagree on the grade, the tile shows a small "⚠ Divergence" badge below the grade. Click → reveals per-model grades.

---

## `<ProblemsColumns>`

### Purpose

Three-column summary of problems addressed, ignored, and worsened by the candidate's program.

### Visual

```
┌────────────────────┬────────────────────┬────────────────────┐
│ ✓ Adressés         │ — Non adressés     │ ⚠ Aggravés        │
├────────────────────┼────────────────────┼────────────────────┤
│ • Déficit public   │ • Déserts médicaux │ • Accès au        │
│ • Retraite         │ • Natalité         │   logement jeunes │
│ • Industrie        │ • Fracture         │ • Dette publique  │
│ • Énergie nucl.    │   territoriale     │   à long terme    │
└────────────────────┴────────────────────┴────────────────────┘
```

### Required behavior

- Three equal columns
- Icons: ✓ / — / ⚠ (not color-only)
- Each item 5–10 words
- Click item → drawer with full reasoning + source refs + agreement

### Data source

`aggregated.json > dimensions > *` flattened into three flat lists.

**Important:** a problem that is both "addressed" (candidate has a proposal) but "worsened" (proposal makes it worse) appears in the worsened column only, with a note. This is editorial — we do not double-count for visual balance.

---

## `<RiskHeatmap>`

### Purpose

Visualize execution risks of the candidate's program on probability × severity axes.

### Visual

```
Severity
  High │             ⚫ Pension reform        ⚫ EU conflict
       │                 (blocked in parliament)
  Med  │  ⚫ Housing plan                    ⚫ Fiscal slippage
       │     (implementation delays)
  Low  │                     ⚫ Admin capacity
       │
       └──────────────────────────────────────────
           Low          Medium         High
                       Probability
```

### Required behavior

- 2D scatter: x = probability, y = severity
- Each risk from `aggregated.json > dimensions > * > execution_risks` plotted
- Point labels show the risk name (truncated for long names)
- Hover reveals: full reasoning, which dimension, which models flagged it
- Gridlines for low/med/high thresholds

### Accessibility

- Tabular view toggle for users who can't parse the scatter
- Points have distinct shapes + labels, not color-only differentiation

---

## `<TrajectoryChart>`

### Purpose

Show France's status-quo trajectory on a key metric with this candidate's projected deviation overlaid.

### Visual

```
% of GDP
  Debt
  trajectory        ┌─ Status quo (continuation)
    │  ╱╱╱╱╱╱     ╱
    │      ╱╱╱╱╱
    │   ╱╱         ┌─ Sous ce programme
    │ ╱
    │        ╌╌╌╌╌╌╌╌
    │   ╌╌╌╌╌         (central assumption)
    │╌╌
    └────────────────────────────────────►
    2026  2030  2035  2040  2045   year
```

### Required behavior

- Status quo trajectory as solid line
- Candidate's program trajectory as dashed line
- Both derived from `aggregated.json > counterfactual`
- Where the candidate's program does not materially change trajectory on this metric, lines overlap — itself a finding
- Hover reveals year-by-year values where available
- Confidence band around program line (models' disagreement = wider band)

### Usage

Multiple instances per candidate page for different metrics: debt, working-age population, energy mix, etc. Selection of metrics per page decided in M_VisualComponents spike.

---

## `<ConsensusBadge>`

### Purpose

Small annotation showing how many models supported a claim.

### Visual

```
[Consensus: 4/5]    [Divergence: 3/2]    [Minoritaire: 1/4]
```

### Required behavior

- Inline next to claims in dimension deep-dives
- Click → small tooltip or drawer with per-model positions

### Semantics

- "Consensus: N/M" — N of M models made this claim (N ≥ M-1)
- "Divergence: N/M" — models split
- "Minoritaire: N/M" — a minority view being shown for context

---

## `<SourceRef>`

### Purpose

Inline citation that opens the transparency drawer at the relevant `sources.md` section.

### Visual

Superscript number or small icon: `[Source]¹` or `[📄]`

### Required behavior

- Click → opens transparency drawer, scrolls to the cited section in `sources.md`
- Multiple citations from same claim collapse into a single anchor with list inside

---

## `<TransparencyDrawer>`

See [`transparency.md`](transparency.md) for full spec.

---

## General technical notes

### Charting library

Candidate: Recharts (React-native, good default styling) or D3 (more control, more work).
Decision: made in M_VisualComponents spike. Default leaning toward Recharts for v1, D3 for custom components like the Intergenerational Split Panel.

### Responsive behavior

- All components degrade gracefully to mobile (single column stacking for multi-column layouts)
- Radar becomes a vertical list of axes on narrow screens
- Heatmap becomes a sorted list on narrow screens

### State management

- Page-level data is static (from build-time props)
- Component-level state (hover, expand) is local React state
- No global state management needed (no Redux, Zustand, etc.)

---

## Open questions (for spike)

- Exact Recharts vs D3 decision
- Animation policy (minimal — but some transitions on expand/hover feel appropriate)
- Print stylesheet
- Dark mode color palette
- Exact chart dimensions / aspect ratios
- Whether `<IntergenerationalSplit>` should include a 45-year-old cohort in a third column

---

## Related Specs

- [`structure.md`](structure.md)
- [`transparency.md`](transparency.md)
- [`../analysis/political-positioning.md`](../analysis/political-positioning.md)
- [`../analysis/intergenerational-audit.md`](../analysis/intergenerational-audit.md)
- [`../analysis/editorial-principles.md`](../analysis/editorial-principles.md)
