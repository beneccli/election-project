
## v1.1 migration (2026-04-20, task 0083)

Following the schema v1.1 update (tasks 0081/0082, milestone
`M_CandidatePagePolish`), the raw-outputs and aggregated JSON were
migrated in-place to add:

- `schema_version: "1.1"`
- `dimensions[*].headline` (≤140 chars per model)
- `dimensions[*].risk_profile` (4 fixed categories × `low<limited<moderate<high`)
- `intergenerational.horizon_matrix` (6 rows × 3 horizons × integer
  `impact_score` in `[-3, +3]`)
- Per-axis `positioning[*].per_model[]` on the aggregated output

**Method:** Option B (hand-authored synthetic content) from task 0083
hints. The Copilot-agent regeneration loop was not exercised because
`sources.md` was unchanged and deterministic per-model variation was
required to exercise the UI dissent paths. The new-field content cites
existing anchors in `sources.md`; no new raw sources were added.

**Dissent surface:** Risk-profile levels differ across models on
`economic_fiscal` (budgetary: M1 high / M2 moderate / M3 high) and
`environmental_long_term` (budgetary: M1 moderate / M2 moderate / M3
high). Horizon-matrix scores differ on several cells (notably
`public_debt.h_2027_2030`, `health.h_2038_2047`, and the `education` row)
to exercise the aggregated modal / interval / per-model UI rendering.

Prompt hashes (`analyze-candidate.md`, `aggregate-analyses.md`) and
`prompt_version` were refreshed in `metadata.json`;
`human_review_completed` stays `true` (re-reviewed as part of task 0083
archival).

## Flagged item resolutions

