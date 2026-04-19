# Intergenerational Audit

> **Version:** 1.0
> **Status:** Stable (finalized by M_AnalysisPrompts spike `0020`, 2026-04-19)

---

## Overview

The intergenerational audit is a **cross-cutting, first-class section** of every candidate's analysis. It quantifies how the program distributes costs and benefits across age cohorts.

**It is measurement, not indictment.** This distinction is the most important one in this spec.

---

## Why a dedicated section

Intergenerational transfers — through pensions, debt issuance, housing markets, environmental debt, and public investment mix — are among the most consequential and least-discussed features of public policy. Most political discourse flattens them out.

A first-class intergenerational section:
1. Gives the reader a direct lens on this dimension for every candidate.
2. Forces the analysis to quantify where possible instead of editorializing.
3. Applies symmetrically — candidates who transfer in one direction and candidates who transfer in the other are both analyzed on the same axis, without moral charge.

---

## Editorial constraint: measurement over indictment

This is the strongest and most enforced editorial rule in this section.

### Allowed language

- "Under this program, net fiscal transfers flow from workers aged 20–40 to pensioners aged 65+, on the order of €X/person/year over a 20-year horizon."
- "Housing affordability for first-time buyers age 25–35 declines from A% to B% under central assumptions."
- "Pension replacement rate for a 25-year-old worker today, projected under this program's parameters, is X% (vs. current Y%)."
- "Debt service burden reaches X% of the budget by 2045, rising from Y% today."

### Disallowed language

- ❌ "sacrifices the youth"
- ❌ "steals from future generations"
- ❌ "abandons boomers"
- ❌ "betrays" / "rescues" / "saves"
- ❌ "catastrophic" / "devastating" / "generous" (as analytical verdicts)
- ❌ Any framing that assigns moral weight before the reader has seen the quantities

Why: readers with different values will read the same quantitative finding and reach different verdicts, and this is **correct**. Our job is the finding.

---

## Required measurements

For every candidate, where possible from the source material:

### 1. Net fiscal transfer direction and magnitude

- **Direction:** `young_to_old` | `old_to_young` | `neutral` | `mixed`
- **Magnitude:** quantified where program math is explicit enough; otherwise qualitative with explicit confidence caveat
- **Units:** €/person/year or % of GDP where possible

### 2. Debt issuance burden

- Projected public debt trajectory under central assumptions
- Interest burden as % of budget over a 20-year horizon
- Who services the debt (implicitly: working-age population at time of service)

### 3. Housing access for under-35s

- Homeownership probability projection
- Rent-to-income trajectory
- Supply-side measures and their expected effect on access

### 4. Pension math for a 25-year-old today

- Expected retirement age under program parameters
- Contribution years required
- Projected replacement rate at retirement
- Comparison to current system

### 5. Environmental debt

- Climate targets' realism
- Cost of transition distributed across cohorts
- Biodiversity / water / land use debt accumulating or declining

### 6. Public investment mix

- Share of spending going to **future-oriented** categories (R&D, education, infrastructure, climate adaptation)
- Share going to **current consumption** (pensions, current administrative spending)
- Trajectory of this ratio under the program

---

## Output structure

From [`output-schema.md`](output-schema.md):

```json
"intergenerational": {
  "net_transfer_direction": "young_to_old | old_to_young | neutral | mixed",
  "magnitude_estimate": {
    "value": "string",
    "units": "string",
    "confidence": 0.5,
    "caveats": "string"
  },
  "impact_on_25yo_in_2027": { ... },
  "impact_on_65yo_in_2027": { ... },
  "reasoning": "string",
  "source_refs": [...],
  "confidence": 0.6
}
```

Both `impact_on_25yo` and `impact_on_65yo` are mandatory. A candidate's program must be analyzed from both perspectives, symmetrically.

---

## Symmetric cohort analysis

This is the enforcement mechanism for symmetric scrutiny in this specific section:

- **Every candidate** analyzed for impact on a 25-year-old.
- **Every candidate** analyzed for impact on a 65-year-old.
- **Same sub-dimensions** in both (fiscal, housing/pension-where-relevant, labor market, environmental debt, etc.).
- **Same time horizon** (2027-2047 as central, with shorter-horizon notes).

A candidate whose program is generous to retirees and costly to young workers is evaluated in exactly the same structure as a candidate whose program is the reverse. The site reports both directions of transfer with identical visual treatment.

---

## Website treatment

See [`../website/visual-components.md`](../website/visual-components.md) for the **Intergenerational Split Panel** — the signature visual component for this section.

Key elements:
- Two-column split (25-year-old | 65-year-old)
- Quantified where possible (numbers in €/% directly displayed)
- Hover reveals source evidence and confidence
- Consistent visual treatment across all candidates

This section is **not buried** at the bottom of the candidate page. It appears early — prominent but not first (after the summary and positioning, before the full dimension grid).

---

## Confidence handling

Many of these measurements require projection with assumptions. Every quantitative claim carries:

- A confidence score in `[0, 1]`
- Explicit caveats about the assumptions used
- Citation to which part of `sources.md` supports the claim (or a note that the program does not provide enough detail to quantify)

When a program is insufficiently detailed to quantify:

- **Don't make up numbers.**
- Report qualitatively with low confidence.
- Note "program does not specify" as itself a finding.

---

## The "what about the status quo" comparison

Every intergenerational finding is compared to the **status quo trajectory** (the counterfactual of doing nothing / continuing current trends). This matters because:

- France's current pension / debt / housing trajectory is itself an intergenerational transfer pattern.
- A program that changes nothing is not neutral — it locks in the current pattern.
- A program that partially addresses a problem is better judged against the baseline than against a utopia.

See the `counterfactual` field in [`output-schema.md`](output-schema.md).

---

## Resolved decisions (spike `0020`)

- **Central horizon: 2027–2047** (20 years post-election). Shorter-horizon claims (2027–2032) are permitted as secondary framing; longer-horizon claims require explicit confidence caveats.
- **Primary lenses: 25-year-old and 65-year-old in 2027.** Impact on a 45-year-old may be added by the model where it materially clarifies the distributional picture, but is optional.
- **Insufficient program math → qualitative finding with low confidence.** Never invented numbers. "Program does not specify" is itself a finding.
- **Inflation / exchange-rate normalization:** all monetary claims in constant 2027 euros unless explicitly labelled nominal. Long-horizon projections carry assumption caveats in `magnitude_estimate.caveats`.

### Deferred

- Formal macro model integration (AMECO / INSEE projections) — v1 relies on the program's own figures plus model reasoning with explicit caveats.

---

## Related Specs

- [`editorial-principles.md`](editorial-principles.md)
- [`dimensions.md`](dimensions.md)
- [`output-schema.md`](output-schema.md)
- [`analysis-prompt.md`](analysis-prompt.md)
- [`../website/visual-components.md`](../website/visual-components.md)
