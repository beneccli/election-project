import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { analyze } from "./analyze";
import { MockProvider } from "./lib/mock-provider";
import { buildValidAnalysisOutput } from "./lib/fixtures/analysis-output";
import { mkdtemp, rm, mkdir, writeFile, readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import * as pathsMod from "./lib/paths";


vi.mock("./lib/paths", async () => {
  const actual = await vi.importActual<typeof pathsMod>("./lib/paths");
  return { ...actual };
});

// Mock DEFAULT_MODELS to use only 2 models for faster tests
vi.mock("./config/models", async () => {
  const actual = await vi.importActual<typeof import("./config/models")>("./config/models");
  return {
    ...actual,
    DEFAULT_MODELS: [
      { model: "claude-test", provider: "anthropic", temperature: 0, maxTokens: 4096 },
      { model: "gpt-test", provider: "openai", temperature: 0, maxTokens: 4096 },
    ],
  };
});

const VALID_JSON_RESPONSE = JSON.stringify(buildValidAnalysisOutput());

describe("analyze", () => {
  let tmpDir: string;
  let anthropicMock: MockProvider;
  let openaiMock: MockProvider;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), "analyze-test-"));
    await mkdir(join(tmpDir, "raw-outputs"), { recursive: true });
    // Create sources.md (human-reviewed)
    await writeFile(join(tmpDir, "sources.md"), "# Test sources\nContent here.", "utf-8");

    anthropicMock = new MockProvider({
      id: "anthropic",
      modelVersion: "claude-test",
      response: VALID_JSON_RESPONSE,
    });
    openaiMock = new MockProvider({
      id: "openai",
      modelVersion: "gpt-test",
      response: VALID_JSON_RESPONSE,
    });

    vi.spyOn(pathsMod, "versionDir").mockReturnValue(tmpDir);
    vi.spyOn(pathsMod, "rawOutputsDir").mockReturnValue(join(tmpDir, "raw-outputs"));
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true });
    vi.restoreAllMocks();
  });

  function providers() {
    return { anthropic: anthropicMock, openai: openaiMock };
  }

  it("analyze_runs_all_models_in_parallel", async () => {
    const results = await analyze({
      candidate: "test-candidate",
      version: "2026-04-19",
      providers: providers(),
    });

    expect(results).toHaveLength(2);
    expect(results.every((r) => r.status === "success")).toBe(true);
    expect(anthropicMock.callCount).toBe(1);
    expect(openaiMock.callCount).toBe(1);
  });

  it("analyze_writes_raw_output_files", async () => {
    await analyze({
      candidate: "test-candidate",
      version: "2026-04-19",
      providers: providers(),
    });

    const files = await readdir(join(tmpDir, "raw-outputs"));
    expect(files).toContain("claude-test.json");
    expect(files).toContain("gpt-test.json");

    const content = JSON.parse(
      await readFile(join(tmpDir, "raw-outputs", "claude-test.json"), "utf-8"),
    );
    expect(content.candidate_id).toBe("test-candidate");
  });

  it("analyze_skips_existing_outputs_without_force", async () => {
    await writeFile(
      join(tmpDir, "raw-outputs", "claude-test.json"),
      "{}",
      "utf-8",
    );

    const results = await analyze({
      candidate: "test-candidate",
      version: "2026-04-19",
      providers: providers(),
    });

    // Anthropic skipped, OpenAI ran
    expect(anthropicMock.callCount).toBe(0);
    expect(openaiMock.callCount).toBe(1);
    expect(results.every((r) => r.status === "success")).toBe(true);
  });

  it("analyze_reruns_existing_with_force", async () => {
    await writeFile(
      join(tmpDir, "raw-outputs", "claude-test.json"),
      "{}",
      "utf-8",
    );

    await analyze({
      candidate: "test-candidate",
      version: "2026-04-19",
      providers: providers(),
      force: true,
    });

    expect(anthropicMock.callCount).toBe(1);
    expect(openaiMock.callCount).toBe(1);
  });

  it("analyze_writes_failed_file_on_persistent_failure", async () => {
    const failingMock = new MockProvider({
      id: "anthropic",
      error: new Error("API timeout"),
    });

    const results = await analyze({
      candidate: "test-candidate",
      version: "2026-04-19",
      providers: { anthropic: failingMock, openai: openaiMock },
    });

    const failed = results.find((r) => r.model === "claude-test");
    expect(failed?.status).toBe("failed");

    const failedFile = JSON.parse(
      await readFile(join(tmpDir, "raw-outputs", "claude-test.FAILED.json"), "utf-8"),
    );
    expect(failedFile.error).toContain("API timeout");
    expect(failedFile.retries).toBe(2);
  });

  it("analyze_retries_on_validation_failure", async () => {
    // First two calls return invalid JSON, third returns valid
    let callCount = 0;
    const retryMock = new MockProvider({ id: "anthropic" });
    vi.spyOn(retryMock, "call").mockImplementation(async (_params) => {
      callCount++;
      if (callCount <= 2) {
        return { content: "not json", model: "claude-test", tokensIn: 100, tokensOut: 50, costEstimateUsd: 0.01, durationMs: 100 };
      }
      return { content: VALID_JSON_RESPONSE, model: "claude-test", tokensIn: 100, tokensOut: 50, costEstimateUsd: 0.01, durationMs: 100 };
    });

    const results = await analyze({
      candidate: "test-candidate",
      version: "2026-04-19",
      providers: { anthropic: retryMock, openai: openaiMock },
    });

    const anthropicResult = results.find((r) => r.model === "claude-test");
    expect(anthropicResult?.status).toBe("success");
    expect(callCount).toBe(3); // 1 initial + 2 retries
  });

  it("analyze_throws_if_sources_md_missing", async () => {
    const { rm: rmFile } = await import("node:fs/promises");
    await rmFile(join(tmpDir, "sources.md"));

    await expect(
      analyze({
        candidate: "test-candidate",
        version: "2026-04-19",
        providers: providers(),
      }),
    ).rejects.toThrow("sources.md not found");
  });

  it("analyze_records_metadata_with_prompt_sha256", async () => {
    await analyze({
      candidate: "test-candidate",
      version: "2026-04-19",
      providers: providers(),
    });

    const metadata = JSON.parse(
      await readFile(join(tmpDir, "metadata.json"), "utf-8"),
    );
    expect(metadata.analysis.prompt_sha256).toMatch(/^[a-f0-9]{64}$/);
    expect(metadata.analysis.prompt_file).toBe("prompts/analyze-candidate.md");
    expect(metadata.analysis.models["claude-test"]).toBeDefined();
    expect(metadata.analysis.models["claude-test"].status).toBe("success");
    expect(metadata.analysis.models["gpt-test"].status).toBe("success");
  });

  it("analyze_filters_models_with_models_option", async () => {
    const results = await analyze({
      candidate: "test-candidate",
      version: "2026-04-19",
      providers: providers(),
      models: ["claude-test"],
    });

    expect(results).toHaveLength(1);
    expect(results[0].model).toBe("claude-test");
    expect(anthropicMock.callCount).toBe(1);
    expect(openaiMock.callCount).toBe(0);
  });
});
