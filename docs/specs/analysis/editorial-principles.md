# Editorial Principles

> **Version:** 1.0
> **Status:** Stable (non-negotiable)

---

## Overview

These are the non-negotiable editorial principles of the Élection 2027 project. They are baked into the prompts, schemas, aggregation logic, and website copy.

**If a change would compromise any of these, it is not a refactor — it is a new project.** Open a spike to discuss before any such change.

---

## The Five Principles

### 1. Analysis, not advocacy

**What it means:** The site reports tradeoffs. Readers form verdicts.

**In practice:**
- Output language describes mechanisms, consequences, and measurements.
- Output language does not use moral verbs (*sacrifice*, *steal*, *betray*, *save*, *rescue*).
- A program that is fiscally sound but shifts costs to future generations is described as "shifts approximately €X/year in net transfers from cohort A to cohort B" — not "sacrifices the youth".

**Why:** Advocacy disguised as analysis is worse than honest advocacy — it borrows credibility it hasn't earned, and readers who disagree with the hidden stance reject the whole project. Our value is that voters of any political persuasion can use this site and trust the methodology.

**Test:** Replace the candidate's name with any other candidate in any sentence of output. If the sentence only makes sense against one candidate, it's advocacy. If it's a general analytical frame applied to whoever is being analyzed, it's analysis.

---

### 2. Symmetric scrutiny

**What it means:** Every candidate analyzed on identical dimensions with identical rigor.

**In practice:**
- The list of analytical dimensions (see [`dimensions.md`](dimensions.md)) is fixed. Every candidate is analyzed on all of them.
- If a candidate does not address a dimension, "does not address" is the analytical finding. We do not skip the dimension for that candidate.
- Prompts are identical per-candidate except for the source material. No per-candidate prompt tweaks.
- A critical finding against candidate A must be applied to candidate B if the same evidence exists. "Candidate A's fiscal plan doesn't add up" requires checking whether candidate B's plan adds up on the same criteria.

**Why:** Asymmetric scrutiny is the most common failure mode in political commentary. It is also the easiest to detect and reject. Symmetric scrutiny is the minimum bar for credibility.

**Test:** For any finding or critique in the output, check whether the same analytical move was attempted on every candidate. If not, the analysis has a gap.

---

### 3. Measurement over indictment

**What it means:** Where possible, claims are stated in concrete units, not moral language.

**In practice:**
- "€X per capita per year" not "massive transfer"
- "Homeownership probability for age 30 declines from A% to B% over 20 years under this program" not "crushes young people's dreams"
- "Debt-to-GDP trajectory reaches X% by 2045 under central assumptions" not "fiscal catastrophe"
- Confidence intervals on numeric claims (where the source permits)

**Why:** Numbers compress better, travel across political divides better, and remain useful to readers who disagree with our priors.

**Test:** Does the output contain adjectives and adverbs doing analytical work? Replace them with quantities where possible. If it can't be quantified from the source, say so explicitly.

---

### 4. Dissent preserved

**What it means:** When frontier models disagree in their analysis, we show the disagreement. We do not average it into consensus.

**In practice:**
- Every aggregated claim has an `agreement_map` showing which models supported it, which dissented, and (where relevant) a brief summary of the dissenting view.
- Positioning scores are never arithmetic-mean averaged — they are ordinal, not cardinal. See [`political-positioning.md`](political-positioning.md).
- Factual convergence (models agreeing on budget math) is labeled high-confidence.
- Value-laden divergence (models differing on whether a policy is fair) is labeled as such and shown to the reader.

**Why:** Five frontier models "agreeing" because you averaged their disagreement is worse than one model with an honest confidence interval. Users should be able to see where AI analysis is robust and where it is contested.

**Test:** Pick any aggregated claim at random. Can the reader find the per-model positions and the dissenting reasoning? If not, the aggregation has hidden signal.

---

### 5. Radical transparency

**What it means:** Every artifact used to produce a claim is public and accessible.

**In practice:**
- `sources.md` (the human-reviewed consolidation) is public.
- `sources-raw/` (original PDFs, speech transcripts) is public.
- `raw-outputs/` (each model's independent analysis) is public.
- `aggregated.json` + `aggregation-notes.md` are public.
- The exact prompt used is public (and its SHA256 hash is recorded in each run's metadata).
- Model versions used are pinned and recorded.
- Code is open source.
- Methodology page explains every decision.

**Why:** Every other outlet asks "trust us". We ask "check us". Transparency is the only defense against legitimate accusations of bias, because the accuser can examine every artifact themselves.

**Test:** Can a skeptical reader reproduce our pipeline and find the same claim? If not, transparency is incomplete.

---

## Derived rules for implementation

The following implementation rules follow mechanically from the five principles:

### On prompts

- Prompts are versioned artifacts. Editing a prompt's wording creates a new analysis version, not an update to an existing one.
- Prompt files have SHA256 hashes recorded in each run's metadata.
- Prompts must not contain candidate-specific instructions.

### On schemas

- Every analytical claim has a sibling `source_refs` field pointing into `sources.md`.
- Every analytical claim has a confidence score in `[0, 1]`.
- Aggregated claims have an `agreement_map` structure.
- Positioning axes use ordinal or interval-labelled values, never arithmetic means across models.

### On aggregation

- Disagreement is preserved in structure, not in prose hedging.
- A claim made by one model but unsupported by `sources.md` is flagged for human review, not auto-published.
- Contradictions between models are surfaced, not hidden.

### On website copy

- No adjectives doing analytical work where a number exists.
- No moral verbs.
- Every claim on-screen has a clickable path to its source evidence.
- The same dimensions and visual treatment apply to every candidate page.

---

## What this project is *not*

- Not a voting guide.
- Not an endorsement platform.
- Not a fact-checking site (we check programs against themselves and their math, not individual debate claims).
- Not a policy-preference aggregator that tells you which candidate matches your views.
- Not a neutral "both sides" platform that refuses judgments — we state findings clearly, we just don't editorialize on top of them.

---

## Related Specs

- [`dimensions.md`](dimensions.md) — the fixed list of analytical dimensions
- [`analysis-prompt.md`](analysis-prompt.md) — how these principles encode in the prompt
- [`output-schema.md`](output-schema.md) — how they encode in the JSON schema
- [`aggregation.md`](aggregation.md) — dissent preservation mechanics
- [`political-positioning.md`](political-positioning.md) — ordinal, not cardinal
- [`intergenerational-audit.md`](intergenerational-audit.md) — measurement, not indictment
