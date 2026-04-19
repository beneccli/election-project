import { describe, it, expect } from "vitest";
import {
  AnalysisOutputSchema,
  CandidateMetadataSchema,
  SourceMetaSchema,
  VersionMetadataSchema,
} from "./schema";
import { buildValidAnalysisOutput } from "./fixtures/analysis-output/builder";

// ---------------------------------------------------------------------------
// CandidateMetadataSchema
// ---------------------------------------------------------------------------

describe("schema CandidateMetadataSchema", () => {
  const validCandidate = {
    id: "jane-dupont",
    display_name: "Jane Dupont",
    party: "Parti Exemple",
    party_id: "PE",
    photo_url: "https://example.com/photo.jpg",
    photo_credit: "Source + license",
    declared_candidate_date: "2026-02-15",
    official_website: "https://example.com",
    created: "2026-04-19",
    updated: "2026-04-19",
  };

  it("schema_validates_valid_candidate_metadata", () => {
    const result = CandidateMetadataSchema.safeParse(validCandidate);
    expect(result.success).toBe(true);
  });

  it("schema_validates_minimal_candidate_metadata", () => {
    const minimal = {
      id: "pierre-moreau",
      display_name: "Pierre Moreau",
      party: "Parti Test",
      party_id: "PT",
      created: "2026-04-19",
      updated: "2026-04-19",
    };
    const result = CandidateMetadataSchema.safeParse(minimal);
    expect(result.success).toBe(true);
  });

  it("schema_validates_candidate_with_optional_fields_as_undefined", () => {
    const data = {
      ...validCandidate,
      photo_url: undefined,
      photo_credit: undefined,
      declared_candidate_date: undefined,
      official_website: undefined,
    };
    const result = CandidateMetadataSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it("schema_rejects_candidate_with_missing_id", () => {
    const { id: _, ...noId } = validCandidate;
    const result = CandidateMetadataSchema.safeParse(noId);
    expect(result.success).toBe(false);
  });

  it("schema_rejects_candidate_with_invalid_id_format", () => {
    const result = CandidateMetadataSchema.safeParse({
      ...validCandidate,
      id: "Jane Dupont", // not kebab-case
    });
    expect(result.success).toBe(false);
  });

  it("schema_rejects_candidate_with_uppercase_id", () => {
    const result = CandidateMetadataSchema.safeParse({
      ...validCandidate,
      id: "Jane-dupont",
    });
    expect(result.success).toBe(false);
  });

  it("schema_rejects_candidate_with_invalid_date", () => {
    const result = CandidateMetadataSchema.safeParse({
      ...validCandidate,
      created: "not-a-date",
    });
    expect(result.success).toBe(false);
  });

  it("schema_rejects_candidate_with_invalid_photo_url", () => {
    const result = CandidateMetadataSchema.safeParse({
      ...validCandidate,
      photo_url: "not a url",
    });
    expect(result.success).toBe(false);
  });

  it("schema_rejects_candidate_with_empty_display_name", () => {
    const result = CandidateMetadataSchema.safeParse({
      ...validCandidate,
      display_name: "",
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// SourceMetaSchema
// ---------------------------------------------------------------------------

describe("schema SourceMetaSchema", () => {
  const validSourceMeta = {
    origin_url: "https://example.com/manifesto.pdf",
    accessed_at: "2026-04-19T10:00:00Z",
    sha256:
      "a1b2c3d4e5f678901234567890abcdef1234567890abcdef1234567890abcdef",
    notes: "Retrieved from candidate's official site",
    license: "presumed fair use",
  };

  it("schema_validates_valid_source_meta", () => {
    const result = SourceMetaSchema.safeParse(validSourceMeta);
    expect(result.success).toBe(true);
  });

  it("schema_validates_minimal_source_meta", () => {
    const minimal = {
      origin_url: "https://example.com/doc.pdf",
      accessed_at: "2026-04-19T10:00:00Z",
      sha256:
        "0000000000000000000000000000000000000000000000000000000000000000",
    };
    const result = SourceMetaSchema.safeParse(minimal);
    expect(result.success).toBe(true);
  });

  it("schema_validates_source_meta_with_offset_datetime", () => {
    const data = {
      ...validSourceMeta,
      accessed_at: "2026-04-19T12:00:00+02:00",
    };
    const result = SourceMetaSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it("schema_rejects_source_meta_with_invalid_sha256", () => {
    const result = SourceMetaSchema.safeParse({
      ...validSourceMeta,
      sha256: "tooshort",
    });
    expect(result.success).toBe(false);
  });

  it("schema_rejects_source_meta_with_uppercase_sha256", () => {
    const result = SourceMetaSchema.safeParse({
      ...validSourceMeta,
      sha256:
        "A1B2C3D4E5F678901234567890ABCDEF1234567890ABCDEF1234567890ABCDEF",
    });
    expect(result.success).toBe(false);
  });

  it("schema_rejects_source_meta_with_invalid_url", () => {
    const result = SourceMetaSchema.safeParse({
      ...validSourceMeta,
      origin_url: "not-a-url",
    });
    expect(result.success).toBe(false);
  });

  it("schema_rejects_source_meta_with_missing_accessed_at", () => {
    const { accessed_at: _, ...noDate } = validSourceMeta;
    const result = SourceMetaSchema.safeParse(noDate);
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// VersionMetadataSchema
// ---------------------------------------------------------------------------

describe("schema VersionMetadataSchema", () => {
  const validVersionMetadata = {
    candidate_id: "jane-dupont",
    version_date: "2026-04-19",
    schema_version: "1.0",
    sources: {
      consolidation_method: "human_review_of_llm_draft",
      consolidation_prompt_sha256:
        "a1b2c3d4e5f678901234567890abcdef1234567890abcdef1234567890abcdef",
      consolidation_prompt_version: "1.0",
      sources_md_sha256:
        "b2c3d4e5f678901234567890abcdef1234567890abcdef1234567890abcdef12",
      reviewed_by: "human-reviewer",
      reviewed_at: "2026-04-19T14:00:00Z",
    },
    analysis: {
      prompt_file: "prompts/analyze-candidate.md",
      prompt_sha256:
        "c3d4e5f678901234567890abcdef1234567890abcdef1234567890abcdef1234",
      prompt_version: "1.0",
      models: {
        "claude-opus-4-7": {
          provider: "anthropic",
          exact_version: "claude-opus-4-7",
          temperature: 0,
          run_at: "2026-04-19T15:00:00Z",
          tokens_in: 42000,
          tokens_out: 8500,
          cost_estimate_usd: 1.23,
          duration_ms: 45000,
          status: "success" as const,
        },
      },
    },
    aggregation: {
      prompt_file: "prompts/aggregate-analyses.md",
      prompt_sha256:
        "d4e5f678901234567890abcdef1234567890abcdef1234567890abcdef123456",
      prompt_version: "1.0",
      aggregator_model: {
        provider: "anthropic",
        exact_version: "claude-opus-4-7",
        run_at: "2026-04-19T16:00:00Z",
      },
      human_review_completed: true,
      reviewer: "human-reviewer",
      reviewed_at: "2026-04-19T17:00:00Z",
    },
    total_cost_estimate_usd: 5.67,
  };

  it("schema_validates_full_version_metadata", () => {
    const result = VersionMetadataSchema.safeParse(validVersionMetadata);
    expect(result.success).toBe(true);
  });

  it("schema_validates_minimal_version_metadata", () => {
    const minimal = {
      candidate_id: "jane-dupont",
      version_date: "2026-04-19",
      schema_version: "1.0",
    };
    const result = VersionMetadataSchema.safeParse(minimal);
    expect(result.success).toBe(true);
  });

  it("schema_validates_version_metadata_with_only_sources", () => {
    const data = {
      candidate_id: "jane-dupont",
      version_date: "2026-04-19",
      schema_version: "1.0",
      sources: {
        consolidation_method: "manual",
      },
    };
    const result = VersionMetadataSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it("schema_validates_version_with_failed_model", () => {
    const data = {
      ...validVersionMetadata,
      analysis: {
        ...validVersionMetadata.analysis,
        models: {
          "claude-opus-4-7": {
            ...validVersionMetadata.analysis.models["claude-opus-4-7"],
            status: "failed" as const,
          },
        },
      },
    };
    const result = VersionMetadataSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it("schema_rejects_version_metadata_with_invalid_candidate_id", () => {
    const result = VersionMetadataSchema.safeParse({
      ...validVersionMetadata,
      candidate_id: "Invalid ID",
    });
    expect(result.success).toBe(false);
  });

  it("schema_rejects_version_metadata_with_invalid_date", () => {
    const result = VersionMetadataSchema.safeParse({
      ...validVersionMetadata,
      version_date: "19-04-2026", // wrong format
    });
    expect(result.success).toBe(false);
  });

  it("schema_rejects_version_metadata_with_invalid_model_status", () => {
    const result = VersionMetadataSchema.safeParse({
      ...validVersionMetadata,
      analysis: {
        ...validVersionMetadata.analysis,
        models: {
          "claude-opus-4-7": {
            ...validVersionMetadata.analysis.models["claude-opus-4-7"],
            status: "pending", // invalid enum
          },
        },
      },
    });
    expect(result.success).toBe(false);
  });

  it("schema_rejects_version_metadata_with_negative_tokens", () => {
    const result = VersionMetadataSchema.safeParse({
      ...validVersionMetadata,
      analysis: {
        ...validVersionMetadata.analysis,
        models: {
          "claude-opus-4-7": {
            ...validVersionMetadata.analysis.models["claude-opus-4-7"],
            tokens_in: -100,
          },
        },
      },
    });
    expect(result.success).toBe(false);
  });

  it("schema_rejects_version_metadata_with_invalid_prompt_sha256", () => {
    const result = VersionMetadataSchema.safeParse({
      ...validVersionMetadata,
      analysis: {
        ...validVersionMetadata.analysis,
        prompt_sha256: "not-a-hash",
      },
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// AnalysisOutputSchema
// See docs/specs/analysis/output-schema.md
// ---------------------------------------------------------------------------

describe("schema AnalysisOutputSchema", () => {
  it("analysis_schema_validates_fully_populated_fixture", () => {
    const result = AnalysisOutputSchema.safeParse(buildValidAnalysisOutput());
    expect(result.success).toBe(true);
  });

  it("analysis_schema_accepts_each_valid_grade", () => {
    for (const grade of ["A", "B", "C", "D", "F", "NOT_ADDRESSED"] as const) {
      const fixture = buildValidAnalysisOutput();
      fixture.dimensions.economic_fiscal.grade = grade;
      const result = AnalysisOutputSchema.safeParse(fixture);
      expect(result.success).toBe(true);
    }
  });

  it("analysis_schema_accepts_boundary_positioning_scores", () => {
    for (const score of [-5, -4, 0, 4, 5]) {
      const fixture = buildValidAnalysisOutput();
      fixture.positioning.economic.score = score;
      const result = AnalysisOutputSchema.safeParse(fixture);
      expect(result.success).toBe(true);
    }
  });

  it("analysis_schema_accepts_each_net_transfer_direction", () => {
    for (const dir of ["young_to_old", "old_to_young", "neutral", "mixed"] as const) {
      const fixture = buildValidAnalysisOutput();
      fixture.intergenerational.net_transfer_direction = dir;
      const result = AnalysisOutputSchema.safeParse(fixture);
      expect(result.success).toBe(true);
    }
  });

  it("analysis_schema_allows_empty_source_refs_on_problems_ignored", () => {
    // Absence findings are permitted to carry empty source_refs.
    // See docs/specs/analysis/editorial-principles.md (principle 2).
    const fixture = buildValidAnalysisOutput();
    fixture.dimensions.economic_fiscal.problems_ignored[0].source_refs = [];
    const result = AnalysisOutputSchema.safeParse(fixture);
    expect(result.success).toBe(true);
  });

  it("analysis_schema_rejects_missing_source_refs_on_problem_addressed", () => {
    const fixture = buildValidAnalysisOutput();
    fixture.dimensions.economic_fiscal.problems_addressed[0].source_refs = [];
    const result = AnalysisOutputSchema.safeParse(fixture);
    expect(result.success).toBe(false);
  });

  it("analysis_schema_rejects_positioning_score_above_range", () => {
    const fixture = buildValidAnalysisOutput();
    fixture.positioning.economic.score = 6;
    const result = AnalysisOutputSchema.safeParse(fixture);
    expect(result.success).toBe(false);
  });

  it("analysis_schema_rejects_positioning_score_below_range", () => {
    const fixture = buildValidAnalysisOutput();
    fixture.positioning.economic.score = -6;
    const result = AnalysisOutputSchema.safeParse(fixture);
    expect(result.success).toBe(false);
  });

  it("analysis_schema_rejects_non_integer_positioning_score", () => {
    const fixture = buildValidAnalysisOutput();
    fixture.positioning.economic.score = 2.5 as unknown as number;
    const result = AnalysisOutputSchema.safeParse(fixture);
    expect(result.success).toBe(false);
  });

  it("analysis_schema_rejects_invalid_grade", () => {
    const fixture = buildValidAnalysisOutput();
    (fixture.dimensions.economic_fiscal as { grade: string }).grade = "A+";
    const result = AnalysisOutputSchema.safeParse(fixture);
    expect(result.success).toBe(false);
  });

  it("analysis_schema_rejects_confidence_above_one", () => {
    const fixture = buildValidAnalysisOutput();
    fixture.positioning.economic.confidence = 1.5;
    const result = AnalysisOutputSchema.safeParse(fixture);
    expect(result.success).toBe(false);
  });

  it("analysis_schema_rejects_negative_confidence", () => {
    const fixture = buildValidAnalysisOutput();
    fixture.confidence_self_assessment = -0.1;
    const result = AnalysisOutputSchema.safeParse(fixture);
    expect(result.success).toBe(false);
  });

  it("analysis_schema_rejects_unknown_top_level_field", () => {
    const fixture = {
      ...buildValidAnalysisOutput(),
      rogue_field: "should not be accepted",
    };
    const result = AnalysisOutputSchema.safeParse(fixture);
    expect(result.success).toBe(false);
  });

  it("analysis_schema_rejects_missing_required_dimension_cluster", () => {
    const fixture = buildValidAnalysisOutput();
    delete (fixture.dimensions as Partial<typeof fixture.dimensions>)
      .environmental_long_term;
    const result = AnalysisOutputSchema.safeParse(fixture);
    expect(result.success).toBe(false);
  });

  it("analysis_schema_rejects_missing_positioning_axis", () => {
    const fixture = buildValidAnalysisOutput();
    delete (fixture.positioning as Partial<typeof fixture.positioning>).ecological;
    const result = AnalysisOutputSchema.safeParse(fixture);
    expect(result.success).toBe(false);
  });

  it("analysis_schema_rejects_empty_positioning_evidence", () => {
    const fixture = buildValidAnalysisOutput();
    fixture.positioning.economic.evidence = [];
    const result = AnalysisOutputSchema.safeParse(fixture);
    expect(result.success).toBe(false);
  });

  it("analysis_schema_rejects_invalid_candidate_id", () => {
    const fixture = buildValidAnalysisOutput();
    fixture.candidate_id = "Test Candidate";
    const result = AnalysisOutputSchema.safeParse(fixture);
    expect(result.success).toBe(false);
  });

  it("analysis_schema_rejects_invalid_prompt_sha256", () => {
    const fixture = buildValidAnalysisOutput();
    fixture.run_metadata.prompt_sha256 = "not-a-sha";
    const result = AnalysisOutputSchema.safeParse(fixture);
    expect(result.success).toBe(false);
  });
});
