# Specifications

> **Status:** Foundation — specs seeded from design discussion, refined by spikes

This directory contains **permanent design documents** for the Élection 2027 project. Specs describe *what* and *why*. Tasks in `tasks/` describe *when* and *how much*.

Code references specs, not tasks.

---

## Organization

```
specs/
├── analysis/           # Editorial principles, prompts, output schema
│   ├── editorial-principles.md     # Non-negotiable editorial stance          [Stable]
│   ├── dimensions.md               # Analytical dimensions covered            [Stable]
│   ├── analysis-prompt.md          # Design of the per-model analysis prompt  [Stable]
│   ├── output-schema.md            # JSON schema for analysis output          [Stable]
│   ├── aggregation.md              # How per-model outputs merge              [Stable]
│   ├── political-positioning.md    # 5-axis methodology                      [Stable]
│   └── intergenerational-audit.md  # Measurement-not-indictment approach     [Stable]
│
├── candidates/         # Candidate data layout
│   └── repository-structure.md     # Per-candidate folder + versioning        [Stable]
│
├── data-pipeline/      # Ingestion and orchestration
│   ├── overview.md                 # End-to-end pipeline                      [Stable]
│   ├── source-gathering.md         # Primary-source fetching + consolidation  [Stable]
│   ├── analysis-modes.md           # API / web-chat / Copilot execution modes [Stable]
│   └── update-workflow.md          # "One week later" flow                    [Draft]
│
└── website/            # Site structure and components
    ├── structure.md                # Page architecture                        [Stable]
    ├── nextjs-architecture.md      # Next.js package, loader, derivations     [Stable]
    ├── visual-components.md        # Signature charts/widgets                 [Stable]
    ├── candidate-page-polish.md    # Screenshot-worthy section redesigns      [Stable]
    ├── comparison-page.md          # /comparer side-by-side view              [Stable]
    └── transparency.md             # Transparency drawer                      [Stable]
```

---

## Reading Order

For first contact with the project:

1. [`analysis/editorial-principles.md`](analysis/editorial-principles.md) — the non-negotiables
2. [`data-pipeline/overview.md`](data-pipeline/overview.md) — how data flows
3. [`candidates/repository-structure.md`](candidates/repository-structure.md) — what per-candidate data looks like
4. [`analysis/output-schema.md`](analysis/output-schema.md) — the core JSON structure
5. [`website/structure.md`](website/structure.md) — how the data becomes pages

---

## Spec Format

Each spec includes:
- **Version** and **Status** header
- **Overview** section
- **Design decisions** with rationale
- **Related Specs** cross-references

### Status Values

| Status | Meaning |
|--------|---------|
| Draft | Work in progress |
| Stable | Reviewed, implementation matches |
| Deprecated | Superseded |

---

## Contributing

1. New specs come from **spikes** — create one in `tasks/active/` first
2. Place spec in appropriate subdirectory
3. Link from this README
4. Cross-reference related specs
5. Specs must not contradict [`analysis/editorial-principles.md`](analysis/editorial-principles.md)
