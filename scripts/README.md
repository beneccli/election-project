# Scripts — Pipeline Orchestration

This directory contains the TypeScript scripts that orchestrate the analysis pipeline. They are not yet implemented — this README documents the planned structure so the location is clearly defined.

Implementation happens during the `M_DataPipeline`, `M_AnalysisPrompts`, and `M_Aggregation` milestones.

---

## Planned files

```
scripts/
├── README.md           # This file
├── ingest.ts           # (optional) source file capture helper
├── consolidate.ts      # sources-raw/ → sources.md.draft
├── analyze.ts          # sources.md → raw-outputs/*.json (parallel)
├── aggregate.ts        # raw-outputs/* → aggregated.draft.json
├── review.ts           # human-review CLI for flagged items
├── publish.ts          # update `current` symlink, commit
├── diff.ts             # compare two versions of a candidate
├── config/
│   ├── models.ts       # configured LLM providers and versions
│   └── anchors.ts      # shared anchor figures for positioning axes
├── lib/
│   ├── schema.ts       # Zod schemas (authoritative)
│   ├── providers.ts    # LLM provider abstraction
│   ├── validate.ts     # schema validation helpers
│   ├── hash.ts         # SHA256 and related utilities
│   └── logger.ts       # structured logger
└── logs/               # runtime logs (gitignored)
```

---

## Running

All scripts run via `npm run`:

```bash
npm run consolidate -- --candidate <id> --version <date>
npm run analyze     -- --candidate <id> --version <date>
npm run aggregate   -- --candidate <id> --version <date>
npm run review      -- --candidate <id> --version <date>
npm run publish     -- --candidate <id> --version <date>
npm run diff        -- --candidate <id> --from <date> --to <date>
```

---

## Design constraints

- **Idempotent** where possible — re-running on an already-complete stage is a no-op unless `--force`
- **Parallel** where possible — `analyze.ts` fans out across models in parallel
- **Schema-validated** — every JSON artifact validated before disk write
- **Logged** — every LLM call logged with provider, version, tokens, cost estimate, duration
- **No hidden state** — all inputs are files in the repo; all outputs are files in the repo

---

## Related Docs

- [`../docs/specs/data-pipeline/overview.md`](../docs/specs/data-pipeline/overview.md) — pipeline architecture
- [`../docs/specs/data-pipeline/source-gathering.md`](../docs/specs/data-pipeline/source-gathering.md)
- [`../docs/specs/data-pipeline/update-workflow.md`](../docs/specs/data-pipeline/update-workflow.md)
- [`../docs/specs/analysis/output-schema.md`](../docs/specs/analysis/output-schema.md)
- [`../docs/specs/analysis/aggregation.md`](../docs/specs/analysis/aggregation.md)
