---
title: Political Spectrum Label
status: Stable
created: 2026-04-22
owners: editorial, pipeline
related:
  - political-positioning.md
  - output-schema.md
  - aggregation.md
  - editorial-principles.md
schema_version_introduced: "1.2"
---

# Political Spectrum Label

> **Companion to [`political-positioning.md`](political-positioning.md).**
> This spec adds a single categorical "overall spectrum" label on top of
> the existing 5-axis positioning. The label is **additive, derived, and
> never a replacement** for the axis analysis.

---

## 1. Problem statement

Readers use a familiar French political shorthand
("gauche / centre-gauche / centre / centre-droit / droite", with
"extrême-gauche" and "extrême-droite" at the ends). The current
positioning output — five integer axes in `[-5, +5]` — is
analytically richer but harder to glance at. The candidate-page
prototype (`Candidate Page.html` line 701) shows a small positioning
text next to the party badge, which the live site does not yet
produce because no spectrum field exists in the schema.

This spec defines the additive field, the derivation rule, the
aggregation rule, and the UI surface.

## 2. Editorial tension (non-negotiable)

[`political-positioning.md`](political-positioning.md) §"Label usage"
explicitly argues against lazy 1D labels:

> "Labels like 'far right' or 'far left' are often applied lazily —
> inherited from media convention rather than derived from evidence."
> "A 1D line destroys [multi-dimensional] information."

That argument is not repealed. It is the operating constraint for
this spec. The spectrum label is acceptable **only if** all of the
following hold:

1. **Evidence-derived, not convention-derived.** The label must be
   computed from the candidate's 5-axis evidence on this analysis.
   The prompt forbids anchoring the label on media reputation or
   party name.
2. **Trace preserved.** The per-model output carries
   `derived_from_axes` (a list of the axes that drove the
   placement) and a `reasoning` paragraph. An aggregator cannot
   promote a label that has no per-model support.
3. **Escape hatch.** `inclassable` ("hors spectre") is a
   first-class enum value. Programs that are orthogonal to L-R
   (e.g. institutional populism without a clear economic pole) are
   expected to land there. Forcing them onto the line would be a
   violation of the multi-dimensional-reality principle.
4. **Radar is authoritative.** The site renders the chip as a
   header affordance that scrolls to the `Positionnement` section.
   The site never displays the chip without the 5-axis detail on
   the same page.
5. **Never averaged.** The label is categorical. Aggregation uses
   modal plurality + distribution + dissent, identical to the
   ordinal-axis rule in `aggregation.md` §4.3. Arithmetic over
   enum values is undefined by construction and rejected by schema.
6. **Symmetric scrutiny.** Every analysis produces a label or
   `inclassable` with reasoning — never skipped.

If a future change threatens any of these, it is a spec revision,
not a drift.

## 3. Enum values

Exactly 8 values. ASCII snake_case in JSON.

| Value              | French display label | English display label | Notes |
|--------------------|----------------------|-----------------------|-------|
| `extreme_gauche`   | Extrême-gauche       | Far-left              | Anti-capitalist, post-EU, revolutionary vocabulary |
| `gauche`           | Gauche               | Left                  | Social-democratic, classical LFI / PS-left anchor |
| `centre_gauche`    | Centre-gauche        | Centre-left           | PS mainstream, Place publique / Glucksmann |
| `centre`           | Centre               | Centre                | Mainstream Macronism, MoDem |
| `centre_droit`     | Centre-droit         | Centre-right          | LR moderate, Horizons |
| `droite`           | Droite               | Right                 | LR 2022 mainstream, Fillon 2017 anchor |
| `extreme_droite`   | Extrême-droite       | Far-right             | RN, Reconquête; nationalist-authoritarian register |
| `inclassable`      | Hors spectre         | Unplaceable           | Program orthogonal to L-R (e.g. institutional-populist without economic pole); justified in reasoning |

Display labels live in `site/lib/i18n.ts`. The enum is the
schema; the label is decoration.

## 4. Derivation methodology (per-model)

The analyst model computes `overall_spectrum` **after** completing
the five axis placements. The rule is:

1. **Reuse axis evidence.** The analyst may not cite new sources
   for the spectrum label; every citation comes from the evidence
   already gathered for the five axes.
2. **Weight economic and social/cultural axes first** — these are
   the axes the French L-R spectrum historically tracks.
3. **Consult ecological and sovereignty axes as tiebreakers.**
   Example: economic ≈ +1 with strong ecologist score → `centre`
   or `centre_gauche` depending on social/cultural. Economic ≈ +1
   with strong sovereignty-nationalist score → candidate may be
   `droite` or `extreme_droite` despite moderate economics.
4. **Institutional axis is orthogonal.** A high illiberal score
   does not itself move the label left or right. It may, however,
   push the label to `extreme_*` **when combined** with
   correspondingly extreme economic/social placements.
5. **When the axes pull in incompatible directions**
   (e.g. hard-statist economics + libertarian social-cultural +
   sovereigntist) **and no clear L-R plurality emerges,** emit
   `inclassable`. This is a valid analytical outcome, not an
   error.
6. **Never anchor on party name or media reputation.** The
   candidate's own self-description is admissible evidence only
   when concrete proposals support it.

### 4.1 Per-model schema shape

```ts
positioning: {
  economic: PositioningAxisSchema,
  social_cultural: PositioningAxisSchema,
  sovereignty: PositioningAxisSchema,
  institutional: PositioningAxisSchema,
  ecological: PositioningAxisSchema,
  overall_spectrum: {
    label: "extreme_gauche" | "gauche" | "centre_gauche" | "centre"
         | "centre_droit" | "droite" | "extreme_droite" | "inclassable",
    derived_from_axes: Array<"economic" | "social_cultural"
                            | "sovereignty" | "institutional"
                            | "ecological">,  // min 1
    evidence: EvidenceRef[],   // min 1 (reused from the axes)
    confidence: number,        // [0, 1]
    reasoning: string          // ≥ 60 chars, ≤ 600 chars; measurement framing
  }
}
```

`derived_from_axes` must be non-empty. Supplying an empty list is a
schema error: a label with no axis support is a bug.

## 5. Aggregation rule

Mirrors the per-axis rule in `aggregation.md` §4.3.

```ts
positioning.overall_spectrum: {
  modal_label: SpectrumLabel | null,     // plurality; null if no unique mode
  label_distribution: Partial<Record<SpectrumLabel, number>>,  // counts
  anchor_narrative: string,              // ≤ 600 chars
  confidence: number,                    // [0, 1]
  dissent: Array<{                       // every model whose label !== modal_label
    model: string,
    label: SpectrumLabel,
    reasoning: string
  }>,
  per_model: Array<{                     // every contributing model
    model: string,
    label: SpectrumLabel,
    reasoning: string
  }>,
  human_edit?: boolean                    // optional during human review
}
```

Rules:

- **No arithmetic.** `.strict()` Zod rejects any `score`, `mean`,
  `index`, or `numeric_value` key. This is the structural
  guardrail.
- **Modal plurality only.** When there is no unique plurality (all
  distinct, or tied modes), `modal_label = null`. The Hero chip
  renders as `— dissensus` with a tooltip when this happens.
- **`inclassable` is a regular value.** It can be the modal label
  and is rendered as `Hors spectre` with a tooltip.
- **Every model contributes.** `per_model[]` must list every raw
  output that entered the aggregation; a missing model is a
  validation error.
- **Dissent is the non-modal subset.** When `modal_label` is
  `null`, every model appears in `dissent[]` (no consensus to
  dissent against, but the list preserves positions).

### 5.1 `agreement_map.positioning_consensus` extension

`agreement_map.positioning_consensus` already exists per axis. Add
a sibling entry for the spectrum label:

```ts
agreement_map.positioning_consensus.overall_spectrum: {
  modal_label: SpectrumLabel | null,
  distribution: Partial<Record<SpectrumLabel, number>>,
  dissent_count: number
}
```

These numbers must equal the ones in
`positioning.overall_spectrum` — the aggregator prompt states they
"repeat the same numbers".

## 6. Prompt changes

### 6.1 `prompts/analyze-candidate.md` §9 (Political positioning)

After the five per-axis instructions, add a sub-section titled
**"9.6 Overall spectrum label"** covering:

- The 8-value enum (authoritative list above).
- The rule that it is derived from the axis evidence; no new
  evidence admitted.
- The `derived_from_axes` requirement.
- The `inclassable` escape hatch and the conditions that warrant
  it.
- A worked example showing how axis scores lead to a label, and a
  second example showing how mixed axes lead to `inclassable`.
- The confidence rule: label confidence ≤ the minimum confidence
  across the axes that drove the placement.
- The measurement-framing reminder: the `reasoning` describes the
  placement mechanism ("anti-capitalist vocabulary + revolutionary
  institutional proposals + radical ecologism → `extreme_gauche`
  band despite moderate social/cultural axis"). It is not
  "left-leaning is bad / good".

### 6.2 `prompts/aggregate-analyses.md` §4.3 (Positioning is ordinal)

Add **"4.3.bis Overall spectrum label — modal + distribution +
dissent"** covering:

- The same modal-plurality rule as per-axis, applied to the
  categorical label.
- `label_distribution` (counts per enum value across models).
- `modal_label = null` when no unique plurality (tied or all
  distinct).
- `dissent[]` lists every model whose label differs from
  `modal_label` (or every model if `modal_label = null`).
- `per_model[]` is exhaustive.
- **Never promote a label no model emitted.** The aggregator
  cannot assign `centre_gauche` when no raw output said
  `centre_gauche`.
- `anchor_narrative` distils the per-model reasoning; it does not
  introduce new evidence.

### 6.3 Copilot-agent prompts

`.github/prompts/analyze-candidate-via-copilot.prompt.md` and
`.github/prompts/aggregate-analyses-via-copilot.prompt.md` already
load the canonical prompts verbatim (Step 1). No code change in
those wrappers. Re-generation of
`prompts/analyze-candidate.sha256.txt` and
`prompts/aggregate-analyses.sha256.txt` is scoped to tasks 0101
and 0102 respectively.

### 6.4 Manual-bundle scripts

`scripts/prepare-manual-analysis.ts` and
`scripts/prepare-manual-aggregation.ts` bundle `prompts/*.md`
verbatim via `stripFrontmatter`. No code change required.

## 7. Schema version

Bump `schema_version` from `"1.1"` to `"1.2"`. This is an additive
change: pre-v1.2 raw outputs and aggregated files remain valid
history; the spectrum field is absent for them, and the Hero chip
fails soft (renders nothing).

## 8. UI placement

### 8.1 Hero chip (`site/components/chrome/Hero.tsx`)

Per prototype `Candidate Page.html` line 701: a small text span
**next to the party badge**, same row, using the French display
label.

Render contract:

- Input: `aggregated.positioning.overall_spectrum.modal_label`
  (via a new pure helper `site/lib/derived/spectrum-label.ts`).
- When `modal_label` is a regular value → display the French
  label (e.g. "Centre-gauche") with a tooltip listing the
  per-model distribution.
- When `modal_label === "inclassable"` → display "Hors spectre"
  with a tooltip explaining the orthogonality.
- When `modal_label === null` → display "Positionnement partagé"
  (i18n) with a tooltip listing the split.
- When the field is absent (pre-v1.2 aggregated) → render
  nothing. No chip, no placeholder.
- Click / keyboard-activate scrolls to
  `#positionnement` (the existing section).

### 8.2 Optional: comparison page surfaces

`/comparer` selector cards and the sticky selected-header show the
label as a small text under the candidate name. Same helper, same
fallback behavior. This is task 0106.

### 8.3 Not in this milestone

- No "filter candidates by spectrum" view.
- No landing-page spectrum bar.
- No per-axis spectrum chips on the radar.

## 9. Test strategy

1. **Schema unit tests** — round-trip a v1.2 example through
   `AnalysisOutputSchema` and `AggregatedOutputSchema`; assert
   `.strict()` rejects an extra `score` / `mean` / `index` key on
   `overall_spectrum`.
2. **Prompt contract test** — extend the existing prompt-contract
   tests (`scripts/lib/prompt-contract.*.test.ts`) to assert the
   canonical prompt mentions all 8 enum values and the
   `derived_from_axes` requirement.
3. **Fixture regression** — the
   `candidates/test-omega/current/aggregated.json` fixture is
   regenerated in task 0104; integration test
   (`scripts/pipeline.integration.test.ts`) updated to expect the
   new field.
4. **Derivation helper test** —
   `site/lib/derived/spectrum-label.test.ts` covers: present
   regular value → French label; `null` → "partagé"; `inclassable`
   → "Hors spectre"; absent field → `null` return.
5. **Hero snapshot / render test** — chip appears / does not
   appear per the four branches.
6. **Editorial lint** — extend the banned-vocabulary scan used by
   `site/app/comparer/comparison-editorial.test.tsx` to include
   the new derivation code path, ensuring the UI does not narrate
   the label with advocacy verbs.

## 10. Open questions

(None block the implementation; all are resolved for v1.2.)

- **Q. Should confidence be propagated from axes automatically?**
  A. No — the prompt sets a ceiling (`≤ min(confidences of driving
  axes)`), but the model emits its own value within that ceiling.
- **Q. Can the aggregator override a model's `inclassable` when
  5/6 models emit a clean label?**
  A. No. Aggregator never rewrites per-model positions; it
  computes modal + dissent. The `inclassable` model lives in
  `dissent[]`.
- **Q. Do we publish the distribution on the candidate page?**
  A. Yes, in the tooltip of the chip and in the existing
  `Positionnement` section's dissent drawer.

## 11. Related specs

- [`political-positioning.md`](political-positioning.md) — the
  primary 5-axis methodology. This spec is its companion.
- [`output-schema.md`](output-schema.md) — adds `overall_spectrum`
  block documentation in task 0103.
- [`aggregation.md`](aggregation.md) — adds §4.3.bis documentation
  in task 0103.
- [`editorial-principles.md`](editorial-principles.md) —
  principles 1, 2, 4, 5 directly constrain this spec.
- [`../website/candidate-page-polish.md`](../website/candidate-page-polish.md)
  — additive-schema precedent (v1.1 → v1.2).
