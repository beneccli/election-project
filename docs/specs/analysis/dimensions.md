# Analytical Dimensions

> **Version:** 1.0
> **Status:** Stable (finalized by M_AnalysisPrompts spike `0020`, 2026-04-19)

---

## Overview

Every candidate is analyzed on **the same fixed list of dimensions**. This list is the implementation of the **symmetric scrutiny** editorial principle.

A candidate that does not address a dimension receives a "not addressed" finding — we do not skip the dimension.

---

## Design rationale

A common mistake in political analysis is to score candidates on the dimensions that candidate emphasizes. This flatters candidates who choose their battlefield. Symmetric scrutiny demands that we fix the battlefield first and evaluate all candidates on all of it.

The dimensions are grouped into clusters for display purposes. Every cluster is mandatory.

---

## The Dimension Clusters

### 1. Economic & Fiscal

Sub-dimensions:
- **Public finances** — debt trajectory, deficit, interest burden as % of budget, CJT (Conseil des prélèvements obligatoires) tax wedge
- **Tax structure** — distribution (who pays), marginal rates, capital vs. labor, competitiveness vs. EU peers
- **Growth model** — productivity, investment, industrial policy, reindustrialization
- **Labor market** — unemployment, youth unemployment specifically, underemployment, labor code
- **Pensions** — system sustainability, replacement rate by birth cohort, parameters proposed
- **Housing** — supply, zoning, rent controls, access for under-35s
- **EU fiscal framework** — what's actually feasible within Eurozone rules

### 2. Social & Demographic

Sub-dimensions:
- **Healthcare** — access, medical deserts, hospital capacity, wait times
- **Education** — PISA trajectory, higher education funding, vocational training
- **Family policy** — birthrate trajectory, childcare, parental leave
- **Inequality** — regional, class, generational
- **Social cohesion** — integration, laïcité, community tensions

### 3. Security & Sovereignty

Sub-dimensions:
- **Internal security** — crime trends, police resources, judicial backlog
- **Immigration** — volumes, composition, integration, asylum system
- **Defense** — NATO, nuclear deterrent, European defense autonomy
- **Energy sovereignty** — nuclear policy (France-critical), renewables mix, gas dependency
- **Food & industrial sovereignty** — strategic sectors

### 4. Institutional & Democratic

Sub-dimensions:
- **Institutional reform** — Fifth Republic proposals, referendums, electoral system
- **Centralization vs. decentralization**
- **EU relationship** — federalism vs. sovereigntism, treaty changes
- **State capacity** — can the administration execute what's proposed?

### 5. Environmental & Long-term

Sub-dimensions:
- **Climate** — targets, realism, cost distribution, transition strategy
- **Biodiversity & water** — increasingly pressing in France
- **Agriculture** — transition path, sovereignty, farmer income
- **Infrastructure** — rail, energy grid, digital

### 6. Intergenerational (cross-cutting, always prominent)

See [`intergenerational-audit.md`](intergenerational-audit.md) for the full measurement framework.

Sub-dimensions:
- **Net fiscal transfer** — direction and magnitude (€/person/year) between cohorts
- **Debt issuance** — who services it?
- **Housing access** — under-35 homeownership trajectory
- **Pension math for a 25-year-old today** — replacement rate, retirement age, contribution years
- **Environmental debt**
- **Public investment mix** — future-oriented (R&D, education, infrastructure) vs. current consumption

---

## Per-Dimension Required Output

For each dimension, the analysis produces (see [`output-schema.md`](output-schema.md)):

- **Grade** (ordinal: A, B, C, D, F — or "not addressed")
- **Problems addressed** (list with strength rating in `[0, 1]`)
- **Problems ignored** (list — what in this dimension is left out?)
- **Problems worsened** (list — where does the program make things worse?)
- **Execution risks** (list with probability × severity)
- **Key measures** (list — concrete policy proposals)
- **Source refs** (citations into `sources.md`)
- **Confidence** (self-assessment in `[0, 1]`)

---

## Display grouping on the website

See [`../website/structure.md`](../website/structure.md). Dimensions render as a tile grid on the candidate page, with the intergenerational section elevated to first-class prominence (not buried among others).

---

## Resolved decisions (spike `0020`)

- **Six clusters kept as listed** (Economic & Fiscal, Social & Demographic, Security & Sovereignty, Institutional & Democratic, Environmental & Long-term, Intergenerational cross-cutting). Splitting "Economic & Fiscal" was considered and rejected for v1: sub-dimension nesting already provides the granularity, and splitting would force website layout changes out of scope for M_AnalysisPrompts.
- **Agriculture stays under Environmental & Long-term** (sub-dimension) in v1.
- **Media & speech** are part of the Institutional & Democratic cluster (under "press and speech" signals), not a separate cluster.
- **Voting record is evidence** when the candidate's program does not state a position on a dimension, at a lower confidence level. The finding is not "not addressed" in that case — it is "addressed via prior conduct" with confidence discount.

### Deferred

Revisions to cluster boundaries may be revisited after the first real candidate run (M_FirstCandidate) if a dimension is systematically ambiguous across candidates.

---

## Related Specs

- [`editorial-principles.md`](editorial-principles.md)
- [`analysis-prompt.md`](analysis-prompt.md)
- [`output-schema.md`](output-schema.md)
- [`intergenerational-audit.md`](intergenerational-audit.md)
- [`../website/structure.md`](../website/structure.md)
