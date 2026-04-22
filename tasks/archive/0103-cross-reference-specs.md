---
id: "0103"
title: "Cross-reference specs: link political-spectrum-label.md from positioning, output-schema, aggregation"
type: task
status: open
priority: medium
created: 2026-04-22
milestone: M_PoliticalSpectrum
spec: docs/specs/analysis/political-spectrum-label.md
context:
  - docs/specs/analysis/political-positioning.md
  - docs/specs/analysis/output-schema.md
  - docs/specs/analysis/aggregation.md
  - docs/specs/README.md
depends_on:
  - "0100"
  - "0101"
  - "0102"
---

## Context

The three existing analysis specs must cross-reference the new
companion spec so readers of any of them land on the spectrum
design without spelunking. See spec §11.

## Objectives

1. `docs/specs/analysis/political-positioning.md`:
   - Amend the "Label usage" section to add a paragraph noting
     that a derived, evidence-based spectrum label now exists
     (see companion spec), with the explicit caveat that it
     does **not** override the 5-axis analysis.
   - Add `political-spectrum-label.md` to "Related Specs".
2. `docs/specs/analysis/output-schema.md`:
   - Document the `positioning.overall_spectrum` object shape
     (per-model) in the positioning section.
   - Document the aggregated shape under the "Aggregated output
     schema" subsection.
   - Bump the documented `schema_version` reference from `1.1`
     to `1.2`.
   - Add `political-spectrum-label.md` to "Related Specs".
3. `docs/specs/analysis/aggregation.md`:
   - Document the modal + distribution + dissent rule (§4.3.bis
     in the prompt).
   - Extend the `agreement_map.positioning_consensus`
     documentation with the `overall_spectrum` entry.
   - Cross-reference the spec.
4. `docs/specs/README.md`:
   - Add a bullet under `analysis/` linking
     `political-spectrum-label.md`.

## Acceptance Criteria

- [ ] Four spec files updated with cross-references matching the
      objectives above
- [ ] `specs/README.md` lists the new spec
- [ ] No spec silently contradicts
      `political-spectrum-label.md` §2 (editorial tension)
- [ ] `npm run lint` clean (markdown linter may be included)

## Editorial check

- [ ] `political-positioning.md` "Label usage" still warns
      against lazy media-convention labels; the amendment adds,
      does not retract
- [ ] `output-schema.md` documents the spectrum field as
      additive, not a replacement
