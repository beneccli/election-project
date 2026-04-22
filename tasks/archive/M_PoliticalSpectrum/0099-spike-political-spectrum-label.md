---
id: "0099"
title: "Spike: Global political-spectrum label for each candidate"
type: spike
status: active
priority: high
created: 2026-04-22
milestone: M_PoliticalSpectrum
spec: docs/specs/analysis/political-spectrum-label.md
context:
  - Candidate Page.html
  - docs/specs/analysis/political-positioning.md
  - docs/specs/analysis/output-schema.md
  - docs/specs/analysis/aggregation.md
  - docs/specs/analysis/editorial-principles.md
  - prompts/analyze-candidate.md
  - prompts/aggregate-analyses.md
  - .github/prompts/analyze-candidate-via-copilot.prompt.md
  - .github/prompts/aggregate-analyses-via-copilot.prompt.md
  - scripts/lib/schema.ts
  - scripts/prepare-manual-analysis.ts
  - scripts/prepare-manual-aggregation.ts
  - site/components/chrome/Hero.tsx
  - site/lib/derived/
depends_on: []
---

## Goal

Add a **global political-spectrum label** — a single ordinal categorical
value on the canonical French L-R spectrum — to each candidate's
analysis, as an **additive** field alongside the existing 5-axis
positioning. The label powers the candidate-page header chip
(prototype `Candidate Page.html` line 701, e.g. `"Centre-gauche"` next
to the party badge) and gives readers a familiar, compact summary. It
**does not replace** the 5-axis analysis; it sits next to it and is
derived from it.

The spike must reconcile this against the existing spec
[`political-positioning.md`](../../docs/specs/analysis/political-positioning.md)
which explicitly warns that "Labels like 'far right' or 'far left' are
often applied lazily" and that "A 1D line destroys [multi-dimensional]
information." The chosen design must earn the label by **deriving it
from the axis evidence**, preserving the 5-axis detail as the primary
analytical surface, and supplying an escape hatch (`inclassable`) for
programs where the 1D line is genuinely inadequate.

## Research Questions

1. **Is a 1D spectrum label compatible with the "multi-dimensional
   reality" principle?**
   Answer: only if the label is (a) derived from the 5-axis evidence
   with an explicit `derived_from_axes` trace and `reasoning`
   paragraph, (b) presented as a communication aid alongside the radar
   (never replacing it), (c) allowed to return `inclassable` when the
   institutional / sovereignty axes are orthogonal to the L-R gradient.
   The spec documents this tension and the conditions that make the
   label acceptable.

2. **What are the canonical enum values?**
   Seven conventional French values plus one escape hatch:
   `extreme_gauche`, `gauche`, `centre_gauche`, `centre`,
   `centre_droit`, `droite`, `extreme_droite`, `inclassable`.
   ASCII snake_case in JSON; French display labels in site i18n.

3. **Where does the label live in the schema?**
   Sibling of the 5 axes: `positioning.overall_spectrum` (not
   top-level). This signals that the label is a projection **of** the
   positioning block, not a separate analytical output.

4. **Is the label ever averaged?**
   No. Aggregation rule mirrors positioning axes:
   `modal_label` (plurality across models; `null` when no unique
   mode) + `label_distribution` (counts) + `dissent[]` + `per_model[]`.
   `.strict()` Zod enforces no `score` or `mean` field. This is
   editorial principle §4 (dissent preserved) encoded structurally.

5. **How does `inclassable` interact with the modal computation?**
   `inclassable` is a regular enum value. If it is the plurality
   across models, `modal_label = "inclassable"` — that is itself an
   analytical finding. The site renders the chip as `— hors spectre`
   with a tooltip explaining why.

6. **Does `prepare-manual-aggregation.ts` need code changes?**
   No. It embeds `prompts/aggregate-analyses.md` verbatim (via
   `stripFrontmatter`). Updating the prompt file propagates to manual
   mode automatically. Same for `prepare-manual-analysis.ts` and
   `prompts/analyze-candidate.md`. The two Copilot-agent prompts
   (`.github/prompts/*-via-copilot.prompt.md`) reference the base
   prompts and pick up changes transparently; their sha256 sidecars
   are regenerated.

7. **Is this a schema major or additive bump?**
   Additive. Precedent: `M_CandidatePagePolish` added `headline`,
   `risk_profile`, `horizon_matrix` as **v1.1 additive**. This spike
   bumps `schema_version` to `"1.2"` and marks `overall_spectrum` as
   an additive v1.2 field in the same spirit. Existing consumers that
   ignore it continue to work; consumers that need it (Hero chip)
   fail-soft when absent (render no chip, not a crash).

8. **Who assigns the label — analyst model or aggregator?**
   **Both.** Per-model `overall_spectrum` in every raw output (the
   analyst derives it from its own axis scores + evidence). The
   aggregator reports modal + distribution + dissent, with no
   independent "aggregator judgment" that could drift from the
   per-model positions. This is the same architecture as `modal_score`
   per axis.

9. **Does this re-open M_Aggregation or M_AnalysisPrompts?**
   No — we add to the prompts and the aggregator's rule set, which is
   an extension of existing patterns. No structural rework. New
   milestone `M_PoliticalSpectrum` depends on them but does not
   reopen.

10. **Does this touch the comparison page (M_Comparison just shipped)?**
    Optionally. A small follow-up task surfaces the chip in the
    `/comparer` candidate selector + sticky selected-header, reusing
    the same derivation helper as Hero. This is scoped into this
    milestone (task 0106), not a reopening of M_Comparison.

## Existing Context

- **Per-axis aggregation precedent:** `prompts/aggregate-analyses.md`
  §4.3 — "Positioning is ordinal — never average." `modal_score`,
  `consensus_interval`, `dissent[]`, `per_model[]`. The new
  `overall_spectrum` field mirrors this structure (categorical
  `modal_label` in place of `modal_score`; distribution in place of
  interval).
- **Schema guardrail:** `scripts/lib/schema.ts` uses `.strict()` on
  aggregated positioning to reject any `score`/`mean` key — same
  guardrail applies to the new spectrum object (no `numeric_value`,
  `score`, or `index` fields).
- **Prototype header:** `Candidate Page.html` line 150
  (`position: "Centre-gauche"`) + line 701 (rendered as a small text
  span next to the party badge). Site `Hero.tsx` currently has no
  equivalent; task 0105 wires it up.
- **Prompt transmission:** `prepare-manual-analysis.ts` and
  `prepare-manual-aggregation.ts` bundle `prompts/*.md` via
  `stripFrontmatter`; changes to the canonical prompt propagate to
  all modes (API, manual-webchat, copilot-agent). No code change in
  the `prepare-manual-*` scripts is required.
- **Derivation pattern:** `site/lib/derived/` already hosts pure
  helpers (`radar-geometry.ts`, `top-level-grade.ts`,
  `comparison-projection.ts`). A new `spectrum-label.ts` helper reads
  `aggregated.positioning.overall_spectrum` and returns
  `{ label, confidence, source: "model" | "absent" }` for the Hero
  chip.

## Editorial principles at stake

1. **Positioning by evidence, not convention.** The label's
   `reasoning` must cite the axis evidence that produced it. A model
   that writes "far right because the media says so" violates the
   prompt; reviewer rejects.
2. **Dissent preserved.** Aggregation never flattens `inclassable` or
   a dissenting model's label into a majority; `dissent[]` and
   `per_model[]` record every disagreement verbatim.
3. **Never averaged.** The label is categorical; arithmetic means are
   undefined by construction and rejected by schema.
4. **Symmetric scrutiny.** Every candidate, every model produces a
   label (or `inclassable` with reasoning). No skipping.
5. **The radar remains authoritative.** The chip is a communication
   aid. Clicking the chip scrolls to the `Positionnement` section;
   the site does not let the chip stand alone.
6. **Measurement over indictment.** Enum labels are descriptive
   French-political-tradition names; they carry no moral weight
   beyond that convention. The reasoning paragraph stays in
   measurement framing (no "extremist", "moderate as in reasonable",
   etc.).

## Deliverables

1. **Spec:** `docs/specs/analysis/political-spectrum-label.md`
   (**Stable** on creation) — companion to `political-positioning.md`,
   not a replacement. Covers enum, derivation methodology,
   aggregation rule, schema placement, UI placement, editorial
   justification, and open questions.
2. **Backlog tasks** in `tasks/backlog/M_PoliticalSpectrum/`:
   - `0100` — Zod schema: add `overall_spectrum` to analysis +
     aggregated positioning (bump `schema_version` to `"1.2"`; keep
     `.strict()` guardrails)
   - `0101` — Update `prompts/analyze-candidate.md` §9 with spectrum
     derivation rules; regenerate sha256
   - `0102` — Update `prompts/aggregate-analyses.md` §4.3 with
     modal-label + dissent rule; regenerate sha256
   - `0103` — Cross-reference specs: amend
     `political-positioning.md`, `output-schema.md`,
     `aggregation.md` to link the new spec
   - `0104` — Regenerate `candidates/test-omega/current/` raw-outputs
     and aggregated.json with the new field; fix fixture-based tests
   - `0105` — `site/lib/derived/spectrum-label.ts` helper + Hero chip
     (prototype parity with `Candidate Page.html` line 701) + i18n
     French labels
   - `0106` — Surface the chip in `/comparer` candidate selector +
     sticky selected-header (reuses the derivation helper from 0105)
3. **ROADMAP.md** — add `M_PoliticalSpectrum` row under Phase 1
   (analysis-pipeline change, not a pure website change); flip
   `M_Comparison` to ✅ Done (stale since commits 0091–0098 landed).
4. **specs/README.md** — list the new spec under `analysis/`.

## Scope boundary (what this milestone does NOT cover)

- Replacing the 5-axis positioning. The label is additive and
  derived; the radar stays the canonical representation.
- Automatic relabeling of historical raw outputs. Pre-v1.2 outputs
  remain valid and historical; the spectrum field is absent and the
  Hero chip renders nothing for them.
- A dedicated "spectrum" section on the candidate page. The label is
  a header chip that scrolls to `Positionnement`; no new section.
- A site-wide "candidates by spectrum" sort / filter view. Defer to
  a future landing / methodology milestone if requested.
- Real candidate re-analysis using paid APIs. Fixture regeneration in
  0104 uses manual-bundle flow on `test-omega`; production candidates
  are re-analyzed when the milestone is rolled into the next
  candidate update.
- English translations of the enum display labels beyond the existing
  i18n tables. English labels (`far-left`, `left`, `centre-left`, …)
  land in 0105 with the existing i18n plumbing; no new translation
  infrastructure.

## Acceptance Criteria

- [ ] Spec `docs/specs/analysis/political-spectrum-label.md` created,
      linked from `specs/README.md`
- [ ] 7 tasks created in `tasks/backlog/M_PoliticalSpectrum/`
- [ ] Each task references the spec, has acceptance criteria, and an
      editorial-check bullet
- [ ] ROADMAP.md updated (new milestone row + M_Comparison flipped
      to ✅ Done)
- [ ] No circular dependencies; schema task (`0100`) precedes prompt
      and fixture tasks
- [ ] Editorial tension documented in spec §2 and §7; the
      `inclassable` escape hatch is part of the enum, not an
      afterthought

## Notes

- Enum value spelling: ASCII snake_case (`centre_gauche`, not
  `centre-gauche` or `Centre-gauche`). French display labels with
  accents and hyphens (`Centre-gauche`, `Extrême-gauche`) live in
  `site/lib/i18n.ts` so render is decoupled from schema.
- The spike deliberately does NOT merge the label into a "global
  politcal index number". Any such proposal is rejected on
  editorial-principle grounds (cardinal averaging of positioning).
- The chip renders **above** the candidate name in Hero, next to the
  party badge, matching `Candidate Page.html` line 701. It is visual
  text, not a grade, and does not take a `GradeBadge`.
