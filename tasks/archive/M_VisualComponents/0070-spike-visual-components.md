---
id: "0070"
title: "Spike: Finalize M_VisualComponents scope"
type: spike
status: active
priority: high
created: 2026-04-20
milestone: M_VisualComponents
spec: docs/specs/website/visual-components.md
context:
  - docs/specs/website/visual-components.md
  - docs/specs/website/nextjs-architecture.md
  - site/components/widgets/PositioningRadar.tsx
  - site/components/widgets/AxisAgreementBars.tsx
  - site/components/widgets/IntergenSplitPanel.tsx
  - site/components/widgets/RiskHeatmap.tsx
  - site/components/widgets/PositioningLegend.tsx
  - site/components/widgets/Tooltip.tsx
  - site/components/sections/SyntheseSection.tsx
  - site/components/sections/DomainesSection.tsx
depends_on: ["0050"]
---

## Goal

M_WebsiteCore and a subsequent review-pass delivered most of the signature
visual components already. This spike:

1. Audits each component in `docs/specs/website/visual-components.md` against
   what actually shipped in `site/components/widgets/`.
2. Reconciles the spec with the implementation (the draft described a 2D
   scatter `RiskHeatmap`; what shipped is a per-risk expandable table — a
   deliberate divergence documented in spike 0050).
3. Identifies and scopes the remaining polish items so M_VisualComponents
   can close cleanly.
4. Makes an explicit disposition on `<TrajectoryChart>`, whose data source
   (year-by-year values from `counterfactual`) does not exist in the current
   aggregated schema.

## Research Questions

1. Which spec components are fully implemented, and which have gaps?
2. Which "signature" behaviors still deserve implementation before this
   milestone is considered done (e.g. tooltip-style hover reveals that the
   draft spec called for)?
3. Is `TrajectoryChart` buildable with the current `aggregated.json` shape?
   If not, what would it cost to add — and should that live in a separate
   data milestone or be dropped entirely?
4. What does responsive/mobile behavior require? The radar is SVG at fixed
   size; the risk table already has horizontal scroll; the intergen panel
   already stacks at `md:` breakpoint. Anything else?
5. What is the animation / `prefers-reduced-motion` policy?
6. Where should the remaining tasks be broken — one per component, or one
   per cross-cutting concern (hover pass, mobile pass)?

## Audit (spec → implementation)

| Spec item | Implementation | Status | Gap |
|---|---|---|---|
| `<PositioningRadar>` | `site/components/widgets/PositioningRadar.tsx` | ✅ Built | No axis-level hover (spec §"Hover on any axis") |
| `<PositioningAxisRow>` | `site/components/widgets/AxisAgreementBars.tsx` | ✅ Built, polished (Tooltip + model color) | Complete |
| `<PositioningLegend>` | `site/components/widgets/PositioningLegend.tsx` | ✅ Built (review pass) | Add to spec (wasn't in draft) |
| `<IntergenerationalSplit>` | `site/components/widgets/IntergenSplitPanel.tsx` | ✅ Built | No per-cell hover revealing full reasoning + `source_refs` |
| `<DimensionTile>` | in `site/components/sections/DomainesSection.tsx` | ✅ Built with `⚡ N` dissent count | No per-model grade reveal on hover/focus |
| `<ProblemsColumns>` | `DimensionDeepDive` in `DomainesSection.tsx` | ✅ Built | `source_refs` not surfaced (deferred to M_Transparency) |
| `<RiskHeatmap>` | `site/components/widgets/RiskHeatmap.tsx` | ✅ Built as per-risk expandable table | **Spec mismatch** — draft shows 2D scatter; deliberate divergence must be promoted into the spec |
| `<ConsensusBadge>` | ad-hoc (k/n pill in RiskHeatmap; "Soutenu par" pills elsewhere) | 🟡 Partial | No unified widget; acceptable for v1 — document as "implemented as inline pills" |
| `<CounterfactualBlock>` | in `SyntheseSection.tsx` (polished review pass) | ✅ Built | Add to spec (not in draft) |
| `<Tooltip>` | `site/components/widgets/Tooltip.tsx` | ✅ Built (review pass) | Add to spec (infrastructure widget) |
| `<ConfidenceDots>` | `site/components/widgets/ConfidenceDots.tsx` | ✅ Built | Add to spec |
| `<GradeBadge>` | `site/components/widgets/GradeBadge.tsx` | ✅ Built | Add to spec |
| `<SourceRef>` | not built | ❌ Deferred to M_Transparency |
| `<TransparencyDrawer>` | not built | ❌ Owned by `docs/specs/website/transparency.md` |
| `<TrajectoryChart>` | not built | ❌ Upstream data missing (no year-by-year series in `counterfactual`) |

## Editorial check

None of the remaining work touches prompts, aggregation, or candidate
asymmetry. The residual risks are:

- **Adding `source_refs` surfacing** to `IntergenSplitPanel` hover: must show
  the raw string (e.g. `[REF:social:42]`) without pretending it is a link
  yet. Navigation into `sources.md` is M_Transparency's responsibility.
  Keeping the text visible even before the drawer exists is consistent with
  the transparency principle.
- **Per-model grade reveal**: surfaces `dim.grade.dissent` map which is
  already in `aggregated.json`. No new data, no new editorial claim.
- **TrajectoryChart deferral**: declining to build a chart because the
  upstream data does not support it is the conservative, transparency-
  preserving choice. Inventing trajectory values (even via interpolation)
  would be fabrication. Explicitly deferred; no placeholder shipped.

## Decisions

1. **Spec reconciliation**: rewrite `docs/specs/website/visual-components.md`
   as v1.1 **Stable**. Document the per-risk RiskHeatmap as the canonical
   design (not the 2D scatter). Add the widgets that were built during
   M_WebsiteCore and the subsequent polish pass. Move `SourceRef` and
   `TransparencyDrawer` to `transparency.md` exclusively. Move
   `TrajectoryChart` to an explicit "Deferred — requires schema extension"
   section.

2. **No charting library** is adopted in v1. Pure SVG + DOM carry all the
   current visuals. Recharts/D3 is revisited only if `TrajectoryChart`
   (or any other time-series visual) is scoped into a future milestone.

3. **Remaining polish tasks** (4) cover the gaps from the audit:
   - `0071` — PositioningRadar axis-level hover interactivity
   - `0072` — IntergenSplitPanel per-cell hover reveal with `source_refs`
   - `0073` — DimensionTile per-model grade reveal
   - `0074` — Mobile responsive pass + `prefers-reduced-motion`

4. **TrajectoryChart is explicitly deferred** to a future data-oriented
   milestone (provisionally `M_TrajectoryData`, not yet scheduled). It
   requires a schema extension to carry year-by-year values in
   `aggregated.json > counterfactual`, which is an analysis-prompt change,
   not a visual change. Adding it to M_VisualComponents would couple the
   two and miss the milestone.

5. **`CounterfactualBlock`** (already built in `SyntheseSection.tsx`) is
   the qualitative stand-in for a trajectory chart: it reports
   `direction_of_change` + `confidence` + `dimensions_changed` without
   fabricating numbers. This is sufficient for launch.

## Deliverables

1. **Rewritten spec** — `docs/specs/website/visual-components.md` v1.1
   Stable (produced by this spike, not a follow-up task).
2. **Backlog tasks** — `tasks/backlog/M_VisualComponents/0071`–`0074`.
3. **ROADMAP update** — replace the "Spike produces" placeholder for
   M_VisualComponents with: status 🚧 In Progress, finalized specs,
   tasks 0071–0074, explicit TrajectoryChart deferral.

## Open questions

- None blocking. `TrajectoryChart` schema cost is a separate conversation
  owned by the next analysis-prompt revision.

## Acceptance Criteria

- [x] `docs/specs/website/visual-components.md` rewritten to match
      implementation (Stable, v1.1).
- [x] Tasks `0071`–`0074` created in `tasks/backlog/M_VisualComponents/`.
- [x] Each task references the spec and has clear acceptance criteria.
- [x] ROADMAP entry for M_VisualComponents updated.
- [x] TrajectoryChart disposition explicit and justified.
- [x] No editorial-principle regressions.
