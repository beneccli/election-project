import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { aggregate } from "./aggregate.js";
import { MockProvider } from "./lib/mock-provider.js";
import { mkdtemp, rm, mkdir, writeFile, readFile, access } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import * as pathsMod from "./lib/paths.js";

vi.mock("./lib/paths.js", async () => {
  const actual = await vi.importActual<typeof pathsMod>("./lib/paths.js");
  return { ...actual };
});

const VALID_AGGREGATED = JSON.stringify({
  candidate_id: "test-candidate",
  model_count: 2,
  consensus_themes: [{ name: "Economy", summary: "Pro-growth", supporting_models: ["model-a", "model-b"] }],
  dissent_themes: [],
  flagged_claims: [],
});

describe("aggregate", () => {
  let tmpDir: string;
  let mockProvider: MockProvider;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), "aggregate-test-"));
    const rawDir = join(tmpDir, "raw-outputs");
    await mkdir(rawDir, { recursive: true });

    // Create sources.md
    await writeFile(join(tmpDir, "sources.md"), "# Sources\nTest content.", "utf-8");

    // Create raw outputs from 2 models
    await writeFile(
      join(rawDir, "claude-test.json"),
      JSON.stringify({ candidate_id: "test-candidate", themes: [] }),
      "utf-8",
    );
    await writeFile(
      join(rawDir, "gpt-test.json"),
      JSON.stringify({ candidate_id: "test-candidate", themes: [] }),
      "utf-8",
    );

    mockProvider = new MockProvider({
      id: "anthropic",
      modelVersion: "claude-opus-4-0-20250514",
      response: VALID_AGGREGATED,
    });

    vi.spyOn(pathsMod, "versionDir").mockReturnValue(tmpDir);
    vi.spyOn(pathsMod, "rawOutputsDir").mockReturnValue(join(tmpDir, "raw-outputs"));
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true });
    vi.restoreAllMocks();
  });

  it("aggregate_reads_raw_outputs_and_writes_draft", async () => {
    await aggregate({
      candidate: "test-candidate",
      version: "2026-04-19",
      provider: mockProvider,
    });

    const draft = JSON.parse(
      await readFile(join(tmpDir, "aggregated.draft.json"), "utf-8"),
    );
    expect(draft.candidate_id).toBe("test-candidate");
    expect(mockProvider.callCount).toBe(1);
  });

  it("aggregate_writes_aggregation_notes", async () => {
    await aggregate({
      candidate: "test-candidate",
      version: "2026-04-19",
      provider: mockProvider,
    });

    const notes = await readFile(join(tmpDir, "aggregation-notes.md"), "utf-8");
    expect(notes).toContain("claude-test");
    expect(notes).toContain("gpt-test");
  });

  it("aggregate_excludes_failed_files", async () => {
    await writeFile(
      join(tmpDir, "raw-outputs", "mistral-test.FAILED.json"),
      JSON.stringify({ error: "timeout" }),
      "utf-8",
    );

    await aggregate({
      candidate: "test-candidate",
      version: "2026-04-19",
      provider: mockProvider,
    });

    // Check that the LLM call only includes 2 models, not 3
    const call = mockProvider.calls[0];
    expect(call.params.sourceContent).toContain("claude-test");
    expect(call.params.sourceContent).toContain("gpt-test");
    expect(call.params.sourceContent).not.toContain("mistral-test");
  });

  it("aggregate_throws_with_zero_raw_outputs", async () => {
    // Remove all raw outputs
    const { rm: rmFile } = await import("node:fs/promises");
    await rmFile(join(tmpDir, "raw-outputs", "claude-test.json"));
    await rmFile(join(tmpDir, "raw-outputs", "gpt-test.json"));

    await expect(
      aggregate({
        candidate: "test-candidate",
        version: "2026-04-19",
        provider: mockProvider,
      }),
    ).rejects.toThrow("No successful raw outputs");
  });

  it("aggregate_warns_with_fewer_than_3_models", async () => {
    // Only 2 models — should warn but not fail
    await aggregate({
      candidate: "test-candidate",
      version: "2026-04-19",
      provider: mockProvider,
    });

    const notes = await readFile(join(tmpDir, "aggregation-notes.md"), "utf-8");
    expect(notes).toContain("⚠️ Warning");
  });

  it("aggregate_writes_draft_not_final", async () => {
    await aggregate({
      candidate: "test-candidate",
      version: "2026-04-19",
      provider: mockProvider,
    });

    // aggregated.draft.json should exist
    await access(join(tmpDir, "aggregated.draft.json"));

    // aggregated.json should NOT exist
    await expect(access(join(tmpDir, "aggregated.json"))).rejects.toThrow();
  });

  it("aggregate_records_metadata", async () => {
    await aggregate({
      candidate: "test-candidate",
      version: "2026-04-19",
      provider: mockProvider,
    });

    const metadata = JSON.parse(
      await readFile(join(tmpDir, "metadata.json"), "utf-8"),
    );
    expect(metadata.aggregation.prompt_sha256).toMatch(/^[a-f0-9]{64}$/);
    expect(metadata.aggregation.prompt_file).toBe("prompts/aggregate-analyses.md");
    expect(metadata.aggregation.human_review_completed).toBe(false);
    expect(metadata.aggregation.aggregator_model.provider).toBe("anthropic");
  });

  it("aggregate_skips_if_draft_exists_without_force", async () => {
    await writeFile(join(tmpDir, "aggregated.draft.json"), "{}", "utf-8");

    await aggregate({
      candidate: "test-candidate",
      version: "2026-04-19",
      provider: mockProvider,
    });

    expect(mockProvider.callCount).toBe(0);
  });

  it("aggregate_overwrites_draft_with_force", async () => {
    await writeFile(join(tmpDir, "aggregated.draft.json"), "{}", "utf-8");

    await aggregate({
      candidate: "test-candidate",
      version: "2026-04-19",
      provider: mockProvider,
      force: true,
    });

    expect(mockProvider.callCount).toBe(1);
  });
});
