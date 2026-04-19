# Political Positioning Methodology

> **Version:** 1.0
> **Status:** Stable (finalized by M_AnalysisPrompts spike `0020`, 2026-04-19)

---

## Overview

Political positioning on the Élection 2027 site uses a **5-axis multi-dimensional model** rather than a single left-right line, and scores are **ordinal**, not cardinal.

This spec defines the axes, the placement methodology, and the aggregation rules that flow from "positioning is ordinal."

---

## Why this matters

Labels like "far right" or "far left" are often applied lazily — inherited from media convention rather than derived from evidence. This project's credibility depends on:

- **Positioning by evidence, not convention.** The case for classifying a candidate a particular way must rest on specific measures, voting records, coalition behavior, and programmatic positions — not on how the press typically describes them.
- **Multi-dimensional reality.** A candidate can be economically statist and socially conservative, economically liberal and ecologically radical, etc. A 1D line destroys this information.
- **Methodological symmetry.** Whatever rigor we apply to one candidate we apply to every candidate. The method for classifying Candidate A cannot differ from the method for Candidate B.

---

## The Five Axes

### 1. Economic axis

**Poles:** Market-oriented ↔ State-interventionist

Range: `-5` (heavy state intervention, nationalization, price controls) to `+5` (minimal state, deregulation, privatization).

Evidence signals:
- Proposed role of public sector (nationalization, privatization)
- Tax structure (level of redistribution)
- Labor market approach (code du travail, minimum wage, union role)
- Industrial policy (dirigiste vs. market-led)
- Welfare state expansion or contraction

### 2. Social/cultural axis

**Poles:** Progressive ↔ Conservative

Range: `-5` (socially progressive — expansive on individual rights, secularism as neutral accommodation, open cultural posture) to `+5` (socially conservative — traditional values, restrictive on individual rights, strong cultural identity emphasis).

Evidence signals:
- Position on family structure, reproductive rights
- Secularism as neutrality vs. secularism as restriction
- Approach to immigration from a cultural perspective
- Education content (history, civics)
- Minority rights

### 3. Sovereignty axis

**Poles:** EU-federalist ↔ Nationalist

Range: `-5` (EU-federalist — pooling of sovereignty, support for EU treaties deepening integration) to `+5` (nationalist — sovereignty reassertion, skepticism or hostility to EU integration, national priority).

Evidence signals:
- Position on EU treaties, Eurobonds, fiscal union
- Migration policy at EU level
- National preference policies
- Trade policy
- NATO and European defense positioning

### 4. Institutional axis

**Poles:** Liberal-democratic ↔ Illiberal/populist

Range: `-5` (strong liberal-democratic commitments — independent judiciary, press freedom protections, checks and balances) to `+5` (illiberal tendencies — weakening independent institutions, executive expansion, majoritarian populism).

Evidence signals:
- Position on judicial independence
- Position on press and speech
- Referendum/plebiscite frequency proposed
- Executive powers expansion
- Treatment of parliamentary and administrative checks
- Party history and coalition behavior

This axis is **orthogonal** to left-right. Both left-populist and right-populist programs can score high on the illiberal pole.

### 5. Ecological axis

**Poles:** Productivist ↔ Ecologist

Range: `-5` (strongly productivist — growth prioritized, skeptical of climate constraints) to `+5` (strongly ecologist — transition prioritized, willingness to accept growth tradeoffs).

Evidence signals:
- Climate targets and realism
- Nuclear position (France-specific — complex signal)
- Transition funding mechanisms
- Agriculture and food systems
- Biodiversity, water, artificialization of land

---

## Placement methodology

For each axis, each model is instructed to:

1. **Gather evidence** — direct quotes from `sources.md` and specific proposals
2. **Compare to anchors** — public figures and parties used as reference points ("more statist than Hollande, less than Mélenchon")
3. **Place on integer `[-5, +5]`**
4. **Justify** with a reasoning paragraph
5. **Self-assign confidence** in `[0, 1]`

The prompt explicitly separates:
- **Rhetoric** (what the candidate says) from
- **Proposals** (what their concrete measures would do)

Scoring is based on **proposals**, with rhetoric noted as additional context.

---

## Canonical anchor sets

Anchors are **fixed across all candidate analyses** to enable comparability. Four anchors per axis, each a concrete public figure or party with an example score. These example scores are reference points — the candidate's own placement is derived from evidence, not inferred by proximity alone.

### Economic axis anchors

| Score | Anchor | Note |
|------:|--------|------|
| `-4` | Mélenchon (LFI 2022 program) | Strongly interventionist |
| `-2` | Hollande (2012 program) | Moderate left |
| `+1` | Macron (2017 program) | Centrist-liberal |
| `+3` | Fillon (2017 program) | Market-oriented right |

### Social/cultural axis anchors

| Score | Anchor | Note |
|------:|--------|------|
| `-3` | EELV (2022 platform) | Progressive on rights, inclusive laicity |
| `-1` | Macron (2017 program) | Liberal-progressive centrist |
| `+2` | LR (2022 platform) | Traditional-conservative mainstream |
| `+4` | Zemmour (Reconquête 2022) | Strong cultural-identity emphasis |

### Sovereignty axis anchors

| Score | Anchor | Note |
|------:|--------|------|
| `-3` | Glucksmann / Place publique | EU-federalist |
| `-1` | Macron (2017 program) | Pro-integration pragmatist |
| `+2` | LR (2022 platform) | Sovereigntist conservative |
| `+4` | RN (2022 program) | Strong national-sovereignty stance |

### Institutional axis anchors

| Score | Anchor | Note |
|------:|--------|------|
| `-3` | Classical liberal-democratic baseline (Fifth Republic consensus pre-2017) | Strong institutional checks |
| `-1` | Macron (2017 program) | Executive-forward but within institutional norms |
| `+2` | LFI (referendum-heavy proposals, executive bypass framing) | Majoritarian populist tendencies |
| `+3` | RN (judicial and media reform proposals) | Illiberal tendencies on specific institutions |

*This axis is orthogonal to left–right; both left-populist and right-populist programs can score high on the illiberal pole.*

### Ecological axis anchors

| Score | Anchor | Note |
|------:|--------|------|
| `-3` | RN (2022 program on climate) | Productivist, skeptical of transition constraints |
| `-1` | LR (2022 platform) | Moderate, growth-prioritized |
| `+1` | Macron (2017 program) | Mainstream transition commitments |
| `+4` | EELV (2022 platform) | Strongly ecologist, transition-prioritized |

Anchors may evolve between versions of the positioning spec. When they do, it is a **breaking change** to analysis comparability and must be versioned with a new `schema_version` on positioning outputs.

---

## Aggregation (why it must be ordinal)

Different models have different implicit scales. A `+2` from Model A may be a `+3` from Model B describing the same program. **Arithmetic mean across models produces nonsense.**

Instead:

### Consensus interval

The aggregated output reports the range of scores across models, plus the modal value if clear.

```json
"economic": {
  "consensus_interval": [-4, -2],
  "modal_score": -3,
  ...
}
```

### Anchor narrative synthesis

The aggregator distills a combined anchor narrative from the models' anchor comparisons, weighted toward claims supported by evidence quotes.

### Dissent preservation

Models that placed outside the consensus interval have their positions and reasoning recorded in `dissent[]`.

### Never a single number

The website never displays a single positioning score as an authoritative value. It displays:
- An interval on the axis (visual band)
- The modal value (if meaningful) as a marker
- A click-to-see-dissent affordance

---

## Visual representation on the website

The candidate page shows a **5-axis radar chart** with:
- Consensus interval rendered as a band (not a single line)
- Modal value rendered as a point within the band
- Hover/click reveals per-model positions and reasoning
- Anchor figures labeled on each axis

See [`../website/visual-components.md`](../website/visual-components.md).

Additionally, a **horizontal axis view** shows each axis separately with full anchor labels — this is the canonical representation, the radar is a summary.

---

## Label usage

The site does **not** use inherited labels ("far right", "far left", "centrist") as primary characterizations. When such labels appear, they are:

- Used as reference (e.g., "the candidate's positions place them on the institutional axis at a range typically associated with illiberal populism")
- Justified with the specific axis placements and evidence that lead to the label
- Never used as a replacement for the axis-by-axis analysis

This is the implementation of the "RN is not far-right because the media says so — it is [or is not] because of specific evidence" principle.

---

## Resolved decisions (spike `0020`)

- **4 anchors per axis**, fixed across all candidate analyses (see section above).
- **Integer scores only** in `[-5, +5]`. No half-integers. Uncertainty is carried by the `confidence` field, not by score granularity.
- **Institutional axis is not sub-divided** in v1 (no split into independent-judiciary / press-freedom / checks). May be revisited if candidates cluster in ways that obscure signal.
- **Candidates without legislative records:** rely on program text plus rhetoric, with `confidence ≤ 0.6` on each axis unless the program explicitly supports the placement with concrete measures.
- **Rhetoric vs. proposals:** scoring is based on **proposals**. Rhetoric is noted as additional context in the `reasoning` field but does not drive placement.

### Deferred

- Sub-axis breakdown of the institutional axis — revisit if needed after first real run.

---

## Related Specs

- [`editorial-principles.md`](editorial-principles.md)
- [`dimensions.md`](dimensions.md)
- [`analysis-prompt.md`](analysis-prompt.md)
- [`output-schema.md`](output-schema.md)
- [`aggregation.md`](aggregation.md)
- [`../website/visual-components.md`](../website/visual-components.md)
