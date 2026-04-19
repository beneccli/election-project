/**
 * Zod schemas for all pipeline JSON artifacts.
 *
 * See docs/specs/candidates/repository-structure.md
 * See docs/specs/data-pipeline/source-gathering.md
 * See docs/specs/analysis/output-schema.md
 */
import { z } from "zod";

// ---------------------------------------------------------------------------
// Shared patterns
// ---------------------------------------------------------------------------

/** Kebab-case candidate ID: lowercase ASCII, hyphens allowed */
const candidateIdPattern = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

/** SHA256 hex string (64 lowercase hex chars) */
const sha256Pattern = /^[a-f0-9]{64}$/;

/** ISO date string YYYY-MM-DD */
const isoDateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

/** ISO-8601 datetime */
const isoDatetime = z.string().datetime({ offset: true }).or(
  z.string().datetime()
);

// ---------------------------------------------------------------------------
// CandidateMetadataSchema — candidates/<id>/metadata.json
// See docs/specs/candidates/repository-structure.md
// ---------------------------------------------------------------------------

export const CandidateMetadataSchema = z.object({
  id: z.string().regex(candidateIdPattern),
  display_name: z.string().min(1),
  party: z.string().min(1),
  party_id: z.string().min(1),
  photo_url: z.string().url().optional(),
  photo_credit: z.string().optional(),
  declared_candidate_date: isoDateString.optional(),
  official_website: z.string().url().optional(),
  created: isoDateString,
  updated: isoDateString,
});

export type CandidateMetadata = z.infer<typeof CandidateMetadataSchema>;

// ---------------------------------------------------------------------------
// SourceMetaSchema — sources-raw/*.meta.json
// See docs/specs/data-pipeline/source-gathering.md
// ---------------------------------------------------------------------------

export const SourceMetaSchema = z.object({
  origin_url: z.string().url(),
  accessed_at: isoDatetime,
  sha256: z.string().regex(sha256Pattern),
  notes: z.string().optional(),
  license: z.string().optional(),
});

export type SourceMeta = z.infer<typeof SourceMetaSchema>;

// ---------------------------------------------------------------------------
// VersionMetadataSchema — versions/<date>/metadata.json
// See docs/specs/candidates/repository-structure.md
// ---------------------------------------------------------------------------

const ModelRunEntrySchema = z.object({
  provider: z.string().min(1),
  exact_version: z.string().min(1),
  temperature: z.number().min(0).max(2),
  run_at: isoDatetime,
  tokens_in: z.number().int().nonnegative(),
  tokens_out: z.number().int().nonnegative(),
  cost_estimate_usd: z.number().nonnegative(),
  duration_ms: z.number().int().nonnegative().optional(),
  status: z.enum(["success", "failed"]),
});

export type ModelRunEntry = z.infer<typeof ModelRunEntrySchema>;

export const VersionMetadataSchema = z.object({
  candidate_id: z.string().regex(candidateIdPattern),
  version_date: isoDateString,
  schema_version: z.string().min(1),
  sources: z
    .object({
      consolidation_method: z.string().min(1),
      consolidation_prompt_sha256: z.string().regex(sha256Pattern).optional(),
      consolidation_prompt_version: z.string().optional(),
      sources_md_sha256: z.string().regex(sha256Pattern).optional(),
      reviewed_by: z.string().optional(),
      reviewed_at: isoDatetime.optional(),
    })
    .optional(),
  analysis: z
    .object({
      prompt_file: z.string().min(1),
      prompt_sha256: z.string().regex(sha256Pattern),
      prompt_version: z.string().min(1),
      models: z.record(z.string(), ModelRunEntrySchema),
    })
    .optional(),
  aggregation: z
    .object({
      prompt_file: z.string().min(1),
      prompt_sha256: z.string().regex(sha256Pattern),
      prompt_version: z.string().min(1),
      aggregator_model: z.object({
        provider: z.string().min(1),
        exact_version: z.string().min(1),
        run_at: isoDatetime,
      }),
      human_review_completed: z.boolean(),
      reviewer: z.string().optional(),
      reviewed_at: isoDatetime.optional(),
    })
    .optional(),
  total_cost_estimate_usd: z.number().nonnegative().optional(),
});

export type VersionMetadata = z.infer<typeof VersionMetadataSchema>;

// ---------------------------------------------------------------------------
// Placeholder schemas for analysis/aggregation (M_AnalysisPrompts, M_Aggregation)
// ---------------------------------------------------------------------------

/** Placeholder — real schema defined in M_AnalysisPrompts */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const AnalysisOutputSchema: z.ZodType<any> = z.any();

/** Placeholder — real schema defined in M_Aggregation */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const AggregatedOutputSchema: z.ZodType<any> = z.any();
