/**
 * End-to-end pipeline integration test with mock LLMs.
 * See docs/specs/data-pipeline/overview.md
 *
 * Exercises: scaffold → consolidate → analyze → aggregate → publish
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { mkdtemp, rm, writeFile, readFile, readdir, readlink, rename } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { MockProvider } from "./lib/mock-provider";
import { scaffoldCandidate } from "./scaffold-candidate";
import { consolidate } from "./consolidate";
import { analyze } from "./analyze";
import { aggregate } from "./aggregate";
import { publish } from "./publish";
import * as pathsMod from "./lib/paths";
import { vi } from "vitest";

vi.mock("./lib/paths", async () => {
  const actual = await vi.importActual<typeof pathsMod>("./lib/paths");
  return { ...actual };
});

vi.mock("./config/models", async () => {
  const actual = await vi.importActual<typeof import("./config/models")>("./config/models");
  return {
    ...actual,
    DEFAULT_MODELS: [
      { model: "claude-test", provider: "anthropic", temperature: 0, maxTokens: 4096 },
      { model: "gpt-test", provider: "openai", temperature: 0, maxTokens: 4096 },
      { model: "broken-model", provider: "broken", temperature: 0, maxTokens: 4096 },
    ],
  };
});

const CANDIDATE_ID = "test-candidate";
const VERSION = "2026-04-19";

const CONSOLIDATION_RESPONSE = `# Test Candidate — Programme (au 2026-04-19)

> Consolidé à partir de : manifesto.txt

## Économie
Réforme fiscale proposée. [Source: manifesto.txt]
`;

const ANALYSIS_RESPONSE = JSON.stringify({
  candidate_id: CANDIDATE_ID,
  summary: "Test analysis",
  themes: [{ name: "Economy", position: "Pro-growth", source_refs: ["manifesto.txt"] }],
});

const AGGREGATED_RESPONSE = JSON.stringify({
  candidate_id: CANDIDATE_ID,
  model_count: 2,
  consensus_themes: [{ name: "Economy", summary: "Pro-growth", supporting_models: ["claude-test", "gpt-test"] }],
  dissent_themes: [],
  flagged_claims: [],
});

describe("Pipeline Integration", () => {
  let tmpDir: string;
  let candDir: string;
  let verDir: string;

  beforeAll(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), "pipeline-e2e-"));
    candDir = join(tmpDir, "candidates", CANDIDATE_ID);
    verDir = join(candDir, "versions", VERSION);

    // Mock paths to use temp dir
    vi.spyOn(pathsMod, "candidateDir").mockImplementation(
      (id: string) => join(tmpDir, "candidates", id),
    );
    vi.spyOn(pathsMod, "versionDir").mockImplementation(
      (id: string, version: string) =>
        join(tmpDir, "candidates", id, "versions", version),
    );
    vi.spyOn(pathsMod, "sourcesRawDir").mockImplementation(
      (id: string, version: string) =>
        join(tmpDir, "candidates", id, "versions", version, "sources-raw"),
    );
    vi.spyOn(pathsMod, "rawOutputsDir").mockImplementation(
      (id: string, version: string) =>
        join(tmpDir, "candidates", id, "versions", version, "raw-outputs"),
    );
  });

  afterAll(async () => {
    vi.restoreAllMocks();
    await rm(tmpDir, { recursive: true });
  });

  it("step_1_scaffold_creates_structure", async () => {
    await scaffoldCandidate({
      id: CANDIDATE_ID,
      name: "Test Candidate",
      party: "Test Party",
      partyId: "test-party",
      date: VERSION,
    });

    const meta = JSON.parse(await readFile(join(candDir, "metadata.json"), "utf-8"));
    expect(meta.id).toBe(CANDIDATE_ID);

    const verMeta = JSON.parse(await readFile(join(verDir, "metadata.json"), "utf-8"));
    expect(verMeta.candidate_id).toBe(CANDIDATE_ID);
  });

  it("step_2_add_source_fixtures", async () => {
    // Simulate adding source files to sources-raw/
    const srcRaw = join(verDir, "sources-raw");
    await writeFile(
      join(srcRaw, "manifesto.txt"),
      "Le candidat propose une réforme fiscale et un investissement dans l'éducation.",
      "utf-8",
    );
  });

  it("step_3_consolidate_produces_draft", async () => {
    const provider = new MockProvider({
      id: "anthropic",
      modelVersion: "claude-opus-4-0-20250514",
      response: CONSOLIDATION_RESPONSE,
    });

    await consolidate({
      candidate: CANDIDATE_ID,
      version: VERSION,
      provider,
    });

    const draft = await readFile(join(verDir, "sources.md.draft"), "utf-8");
    expect(draft).toContain("Économie");
  });

  it("step_3b_consolidate_refuses_empty_sources_raw", async () => {
    // Create a separate empty candidate to test
    const emptyDir = join(tmpDir, "candidates", "empty-test", "versions", "2026-01-01");
    const { mkdir } = await import("node:fs/promises");
    await mkdir(join(emptyDir, "sources-raw"), { recursive: true });

    vi.spyOn(pathsMod, "versionDir").mockReturnValueOnce(emptyDir);
    vi.spyOn(pathsMod, "sourcesRawDir").mockReturnValueOnce(join(emptyDir, "sources-raw"));

    const provider = new MockProvider({ id: "anthropic", response: "" });
    await expect(
      consolidate({ candidate: "empty-test", version: "2026-01-01", provider }),
    ).rejects.toThrow("empty");
  });

  it("step_4_simulate_human_review_of_sources", async () => {
    // Human reviews draft → renames to sources.md
    await rename(join(verDir, "sources.md.draft"), join(verDir, "sources.md"));
    const sources = await readFile(join(verDir, "sources.md"), "utf-8");
    expect(sources).toContain("Économie");
  });

  it("step_5_analyze_refuses_without_sources_md", async () => {
    // Temporarily rename sources.md to test gate
    await rename(join(verDir, "sources.md"), join(verDir, "sources.md.bak"));

    const providers = {
      anthropic: new MockProvider({ id: "anthropic", response: ANALYSIS_RESPONSE }),
      openai: new MockProvider({ id: "openai", response: ANALYSIS_RESPONSE }),
      broken: new MockProvider({ id: "broken", response: ANALYSIS_RESPONSE }),
    };

    await expect(
      analyze({ candidate: CANDIDATE_ID, version: VERSION, providers }),
    ).rejects.toThrow("sources.md not found");

    // Restore
    await rename(join(verDir, "sources.md.bak"), join(verDir, "sources.md"));
  });

  it("step_6_analyze_runs_models_and_handles_failure", async () => {
    const providers = {
      anthropic: new MockProvider({
        id: "anthropic",
        modelVersion: "claude-test",
        response: ANALYSIS_RESPONSE,
      }),
      openai: new MockProvider({
        id: "openai",
        modelVersion: "gpt-test",
        response: ANALYSIS_RESPONSE,
      }),
      broken: new MockProvider({
        id: "broken",
        error: new Error("Malformed JSON from model"),
      }),
    };

    const results = await analyze({
      candidate: CANDIDATE_ID,
      version: VERSION,
      providers,
    });

    expect(results).toHaveLength(3);
    const succeeded = results.filter((r) => r.status === "success");
    const failed = results.filter((r) => r.status === "failed");
    expect(succeeded).toHaveLength(2);
    expect(failed).toHaveLength(1);
    expect(failed[0].model).toBe("broken-model");

    // Check raw outputs
    const files = await readdir(join(verDir, "raw-outputs"));
    expect(files).toContain("claude-test.json");
    expect(files).toContain("gpt-test.json");
    expect(files).toContain("broken-model.FAILED.json");
  });

  it("step_7_analyze_is_idempotent", async () => {
    const anthropicMock = new MockProvider({
      id: "anthropic",
      modelVersion: "claude-test",
      response: ANALYSIS_RESPONSE,
    });
    const openaiMock = new MockProvider({
      id: "openai",
      modelVersion: "gpt-test",
      response: ANALYSIS_RESPONSE,
    });

    await analyze({
      candidate: CANDIDATE_ID,
      version: VERSION,
      providers: {
        anthropic: anthropicMock,
        openai: openaiMock,
        broken: new MockProvider({ id: "broken", error: new Error("fail") }),
      },
    });

    // Existing outputs should be skipped (except broken which has .FAILED not .json)
    expect(anthropicMock.callCount).toBe(0);
    expect(openaiMock.callCount).toBe(0);
  });

  it("step_8_aggregate_produces_draft", async () => {
    const provider = new MockProvider({
      id: "anthropic",
      modelVersion: "claude-opus-4-0-20250514",
      response: AGGREGATED_RESPONSE,
    });

    await aggregate({
      candidate: CANDIDATE_ID,
      version: VERSION,
      provider,
    });

    const draft = JSON.parse(
      await readFile(join(verDir, "aggregated.draft.json"), "utf-8"),
    );
    expect(draft.candidate_id).toBe(CANDIDATE_ID);
    expect(draft.consensus_themes).toHaveLength(1);

    const notes = await readFile(join(verDir, "aggregation-notes.md"), "utf-8");
    expect(notes).toContain("claude-test");
  });

  it("step_9_publish_refuses_without_human_review", async () => {
    await expect(
      publish({ candidate: CANDIDATE_ID, version: VERSION }),
    ).rejects.toThrow("aggregated.json not found");
  });

  it("step_10_simulate_human_review_and_publish", async () => {
    // Simulate human review: rename draft → final
    await rename(
      join(verDir, "aggregated.draft.json"),
      join(verDir, "aggregated.json"),
    );

    // Set human_review_completed in metadata
    const meta = JSON.parse(await readFile(join(verDir, "metadata.json"), "utf-8"));
    meta.aggregation.human_review_completed = true;
    await writeFile(join(verDir, "metadata.json"), JSON.stringify(meta), "utf-8");

    await publish({ candidate: CANDIDATE_ID, version: VERSION });

    const target = await readlink(join(candDir, "current"));
    expect(target).toBe(`versions/${VERSION}`);
  });

  it("step_11_metadata_records_all_runs", async () => {
    const meta = JSON.parse(await readFile(join(verDir, "metadata.json"), "utf-8"));

    // Sources consolidation
    expect(meta.sources.consolidation_prompt_sha256).toMatch(/^[a-f0-9]{64}$/);

    // Analysis
    expect(meta.analysis.prompt_sha256).toMatch(/^[a-f0-9]{64}$/);
    expect(meta.analysis.models["claude-test"]).toBeDefined();
    expect(meta.analysis.models["gpt-test"]).toBeDefined();

    // Aggregation
    expect(meta.aggregation.prompt_sha256).toMatch(/^[a-f0-9]{64}$/);
    expect(meta.aggregation.human_review_completed).toBe(true);
  });
});
