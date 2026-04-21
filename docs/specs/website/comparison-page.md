# Comparison Page (`/comparer`)

> **Version:** 1.0
> **Status:** Stable (finalized by M_Comparison spike `0090`, 2026-04-22)
> **Milestone:** M_Comparison
> **Scope:** The `/comparer` route — a side-by-side comparison view of
> 2–4 candidates on the four analytical sections already produced for
> the candidate page.
> **Out of scope:** New analytical output, schema or prompt changes,
> voter-preference matching, composite overall scoring, landing page.

---

## 1. Problem statement

`docs/specs/website/structure.md` lists comparison as "the killer feature":
the individual candidate page is interesting, but the core value of the
project is confronting 2–4 programmes **on identical dimensions**.

A design prototype (`Comparison Page.html`) exists and is the visual
contract — same shell, tokens and widget grammar as the already-shipped
candidate page, with four analytical sections that are **multi-candidate
variants** of the ones on `/candidat/<id>`:

| Section | Candidate page component | Comparison page component |
|---|---|---|
| Positionnement politique | `<PositionnementSection>` (single radar, aggregation intervals) | `<ComparisonRadar>` (overlay) + axis dot-rows |
| Analyse par domaine | `<DomainesSection>` (list w/ deep-dive) | `<DomainesComparison>` (grades table) |
| Impact intergénérationnel | `<IntergenHorizonTable>` (6×3 matrix) | `<IntergenComparison>` (6×N collapsed to h_2038_2047) |
| Risques | `<RiskSummaryMatrix>` (per-candidate 6×4) | `<RisquesComparison>` (stacked per-candidate 6×4) |

No new analytical output is required — the comparison page is a pure
projection of fields that already exist in aggregated schema v1.1.

---

## 2. Design principles (recap)

Carried over verbatim from
[`editorial-principles.md`](../analysis/editorial-principles.md) and
enforced at every decision point below:

1. **Analysis, not advocacy.** No overall winner, no composite score,
   no voter-match quiz.
2. **Symmetric rendering.** Every selected candidate renders with
   identical components, typography, column widths, and hover
   affordances. Color slots are assigned by URL query order only; no
   candidate is "primary".
3. **Measurement over indictment.** Per-dimension differences are
   reported as grade spread (max − min) and, where the max is strictly
   unique, flagged with a neutral ↑ marker. There is no moralized
   framing around "leading" / "trailing".
4. **Dissent preserved.** Every comparison cell is a projection of an
   already-aggregated ordinal field. Per-model detail remains one click
   away on `/candidat/<id>`; the comparison view links out, never hides.
5. **No cardinal averaging.** Radar polygons plot modal integers;
   per-axis rows plot individual dots; grade deltas report spread, never
   mean. The single intergenerational cell per (domain × candidate) uses
   the `h_2038_2047` **modal** score — no cross-horizon arithmetic.

---

## 3. Editorial review of the prototype

Each prototype choice was audited against §2.

| Choice | Verdict | Safeguard |
|---|---|---|
| Radar overlay of N candidate polygons | ✅ Safe | Modal integers only; no inter-candidate arithmetic. |
| Per-axis dot row (N dots on a single line) | ✅ Safe | Each dot is that candidate's axis modal; spread label `±K` shows only when ≥ 2. |
| Per-dimension grade comparison table | ✅ Safe | Grades reflect coherence + evidence support, not ideology. |
| `⚡` spread indicator on domain row | ✅ Safe | Reports `max − min` ordinal spread; no composite. |
| `↑` unique-best-in-row marker | ⚠ Kept w/ guardrails | Only when `argmax` is strictly unique; no overall ranking; neutral glyph; FR label "Meilleure note sur ce domaine" on hover. |
| Per-candidate risk matrices stacked | ✅ Safe | Identical rendering for every candidate. |
| Sticky candidate chip header | ✅ Safe | Chip order = URL order = color slot. |
| "Sélectionnez jusqu'à 4 candidats" | ✅ Safe | Same minimum-2 guard as structure.md §"Comparison page". |
| Prototype's fake `ALL_CANDIDATES` data | ❌ Discard | Comparison page reads real aggregated data only. |

---

## 4. Data model

**No schema changes.** The comparison page derives every cell from
existing aggregated v1.1 fields.

### 4.1 Per-candidate comparison projection

A view-model, computed at build time from `aggregated.json`:

```ts
// site/lib/derived/comparison-projection.ts
interface ComparisonProjection {
  id: string;                        // candidate id
  displayName: string;               // from candidate metadata
  party: string;
  partyShort: string;                // e.g. "RD" — metadata-derived; TBD-1
  partyColor: string;                // metadata.party_color or fallback
  positionLabel: string;             // e.g. "Centre-gauche" — metadata or derived
  overallGrade: string;              // e.g. "B+"
  overallGradeSub: "+" | "-" | "";   // consensus-strength modifier

  /** One signed int in [-5, +5] per axis, in AXIS_KEYS order. */
  positioning: number[];             // length 5

  /** One grade per dimension id. */
  dimGrades: Record<DimensionId, string>;

  /** 4 RiskLevelIndex per dimension id, in CATEGORY_ORDER. */
  risks: Record<DimensionId, [RiskIdx, RiskIdx, RiskIdx, RiskIdx]>;

  /** One signed int in [-3, +3] per horizon row id (h_2038_2047 modal). */
  intergen: Record<HorizonRowKey, number>;
}
```

Derivation rules:

- `positioning[axis]` = `aggregated.positioning.axes[axis].modal` (integer,
  non-null). If null (rare — no model agreed to a common modal), render
  the dot on the row but omit from the radar polygon and add a small
  "—" marker (same pattern already used on the candidate page).
- `dimGrades[dim]` = `aggregated.dimensions[dim].overall.grade`.
- `risks[dim][k]` = `aggregated.dimensions[dim].risk_profile[category].modal_level`
  → index into `["low","limited","moderate","high","critical"]`.
- `intergen[row]` = `aggregated.intergenerational.horizon_matrix[row].cells.h_2038_2047.modal_score`.

### 4.2 Index of analyzable candidates

The picker lists every candidate returned by `listCandidates()` (already
exists). Each entry carries `isFictional` so the UI can grey out fiction
when `EXCLUDE_FICTIONAL !== "1"` but we still surface the marker.

A candidate whose `aggregated.json` fails to load or re-validate is
returned with `analyzable: false` and disabled in the picker. Same
error boundary as the candidate page.

TBD-1: `partyShort` and `positionLabel` are not yet in candidate
metadata. v1 derives them inline in `ComparisonProjection` from the
existing `party` string (short = uppercase initials) and leaves
`positionLabel` empty. A follow-up task under
`M_CandidateOnboarding` may formalize them.

---

## 5. Routing and state

- **Route:** `/comparer` (static; static export).
- **Query:** `?c=<id>&c=<id>…` — ordered list of candidate ids. Order
  determines color slot (blue, red, green, purple).
- **Persistence:** on mount, if the query is empty, hydrate from
  `localStorage["e27-compare"]` (array of ids). On change, write both
  the URL (via `router.replace`, shallow) and `localStorage`.
- **Guards:**
  - Max 4 selected; the 5th click is ignored, picker shows "maximum
    atteint".
  - Min 2 required to render the comparison body; below that, a small
    empty state is shown (same as prototype).
  - Unknown ids or non-analyzable candidates are dropped silently on
    hydration.
  - Fictional candidates are hidden unless `EXCLUDE_FICTIONAL !== "1"`
    (same rule as the landing page).
- **Static export compatibility:** the page is a single client island
  that receives the full `ComparisonProjection[]` at build time (pre-
  serialized from every analyzable candidate). Client code does not
  fetch from the filesystem.

---

## 6. Component inventory

All file paths are under `site/components/comparison/` unless noted.

### 6.1 `<ComparisonPage>` (server)

File: `site/app/comparer/page.tsx`

- Renders `NavBar`, comparison hero, the client-island
  `<ComparisonBody>`, and the transparency footer (shared with the
  candidate page).
- Computes the `ComparisonProjection[]` list at build time from
  `listCandidates()` → `loadCandidate()` → `deriveComparisonProjection()`.

### 6.2 `<ComparisonBody>` (client)

- Owns selected-ids state, syncs query string ↔ localStorage.
- Renders `<CandidateSelector>`, `<SelectedHeader>`, then the four
  sections. Below 2 selected, renders the empty state.

### 6.3 `<CandidateSelector>`

- Horizontal scrollable row of candidate tiles (prototype §Candidate
  selector).
- Each tile: party-color dot, `<GradeBadge size="sm">` when selected,
  candidate name (Cormorant Garamond 13/1.15, weight 700), position
  label.
- Disabled state for non-analyzable or max-reached.
- Active tile has a 3 px bottom bar in the slot color.

### 6.4 `<SelectedHeader>`

- Sticky under the NavBar (top: `var(--nav-h)`).
- Per selected candidate: colored dot (12 px), small grade badge,
  name + position. Separator rules between chips.
- Scrolls horizontally on narrow viewports.

### 6.5 `<PositioningComparison>`

- Left column: `<ComparisonRadar>` — SVG, same ring + axis grid as the
  candidate-page radar but overlays N translucent polygons (fill-opacity
  0.12, stroke 2 px, color = slot color). No median polygon (avoids
  implying an average).
- Right column: one row per axis. Each row has:
  - Label + pole labels (FR canonical).
  - A `var(--bg-subtle)` track spanning `[-5, +5]`, centre rule at 50 %.
  - N slot-colored dots positioned by that candidate's axis modal.
  - Spread label `⚡ ±K` (red) when `max − min ≥ 2`.
- Client-only (interactive tooltip, no SSR concerns).

### 6.6 `<DomainesComparison>`

- Table: rows = `DIMENSION_IDS` (fixed order, FR labels), columns =
  selected candidates + a trailing "Écart" column (shown only when
  ≥ 2 candidates).
- Cell: `<GradeBadge size="sm">` from `dimGrades[dim]`. When the max
  value on the row is strictly unique and that cell holds it, a small
  neutral `↑` marker follows the badge. Hover title:
  "Meilleure note de la sélection" / "Top grade in this selection".
- Écart cell: `max − min` grade-value delta. Red when ≥ 3, amber when 2.
- Column header: 3 px color bar above the candidate's first name
  (`name.split(" ")[0]`).

### 6.7 `<IntergenComparison>`

- Table: rows = `HORIZON_ROW_KEYS` (pensions, public_debt, climate,
  health, education, housing), columns = candidates.
- Cell: horizontal bar + signed integer in `[-3, +3]`
  (`intergen[row]`). Bar color: green scale for positive, red scale for
  negative, grey for 0. Width = `max(|score|·12, 2) px`.
- Intro paragraph (FR/EN) explains the scale and the 2047 horizon —
  quotes the existing copy from the prototype, unchanged.
- **Transparency ref:** each row links to the candidate page's full
  horizon-matrix anchor (`#horizon-<row>`). No per-horizon detail is
  inlined; no cross-horizon averaging is performed.

### 6.8 `<RisquesComparison>`

- One block per selected candidate (stacked, not side-by-side): colored
  bar + candidate name header, then a 6×4 matrix identical in shape to
  `RiskSummaryMatrix` on the candidate page but rendered inline (no
  drawer).
- Cell: colored pill (5 levels — same OKLCH ramp as prototype), label
  "Faible/Limité/Modéré/Élevé/Critique" (FR) or English equivalents.
- Order: URL / selection order = render order.

---

## 7. Integration with existing site

- **Shared chrome:** `<NavBar>` from `site/components/chrome/NavBar.tsx`
  (already used by the candidate page). Add an active-route mode that
  shows "Comparaison" / "Comparison" in the subtitle slot.
- **Shared primitives:** `<GradeBadge>`, OKLCH tokens, `<LangContext>`,
  `useLang()`. No new tokens.
- **Transparency footer:** the comparison page shows a simplified
  footer linking to the methodology + the list of candidates currently
  compared (each → their transparency drawer). No raw-outputs drawer on
  this page.
- **Landing page CTA:** "Comparer plusieurs candidats" on `/` routes to
  `/comparer?c=<id1>&c=<id2>` with the two most recently updated
  analyzable candidates pre-selected.
- **Candidate page CTA:** the candidate page gains a small
  "Comparer à un autre candidat →" link that opens `/comparer?c=<this>`
  with one slot pre-filled.

---

## 8. Test strategy

- **Unit:** `deriveComparisonProjection` against the `test-omega`
  fixture. Additional small fictional fixtures (existing
  `lib/manifests/` helpers) used for 2–4 candidate scenarios.
- **Component:** `<ComparisonRadar>` renders N polygons, axis labels in
  both languages. `<DomainesComparison>` marks unique-max only, never
  ties. `<IntergenComparison>` pulls from `h_2038_2047.modal_score`
  (regression test: injecting different h_2027_2030 values must not
  change the rendered cell).
- **Route:** `/comparer` page test — URL round-trip, localStorage
  hydration, max-4 guard, empty state below 2.
- **Editorial regression:** a test asserts the page does **not** render
  any of `["gagnant","winner","meilleur candidat","classement général","score global"]`.
- **Build smoke:** `pnpm --filter site build` succeeds with `test-omega`
  as the sole candidate (1-candidate case → picker works, comparison
  body stays in empty state).

---

## 9. Success metrics

- Prototype `Comparison Page.html` and implemented `/comparer` are
  visually indistinguishable at 1280×900 with 4 candidates selected
  (allowing for post-implementation fine-tuning by the user).
- Lighthouse static-page LCP < 1.5 s on throttled Fast 3G, 4 candidates.
- Zero `any` types in the new comparison code.
- 100 % of rendered numeric values traceable to an aggregated ordinal
  field (no derived composite).

---

## 10. Open questions

- **OG / share image for comparison URLs.** Deferred; tracked under a
  future `M_Sharing` milestone.
- **Deep-link from comparison cell to candidate-page section.** v1
  implements `#` anchors only; a richer interaction (split-pane with
  the candidate page) is out of scope.
- **Mobile.** Prototype is desktop-first. v1 ships with horizontal
  scroll for the tables and the selector; a redesigned mobile comparison
  is deferred to `M_Accessibility`.
