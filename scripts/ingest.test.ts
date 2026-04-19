/**
 * Tests for ingest-raw-output and ingest-aggregated.
 */
import { describe, expect, test, beforeEach, afterEach, vi } from "vitest";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import * as pathsMod from "./lib/paths";
import { buildValidAnalysisOutput } from "./lib/fixtures/analysis-output/builder";
import { buildValidAggregatedOutput } from "./lib/fixtures/aggregated-output/builder";
import {
  ingestRawOutput,
  stripJsonFence,
} from "./ingest-raw-output";
import { ingestAggregated } from "./ingest-aggregated";

let tmpRoot: string;
let prevCwd: string;

async function scaffoldTempProject(candidate: string, version: string) {
  tmpRoot = await mkdtemp(join(tmpdir(), "ingest-test-"));

  const analyzePrompt = await readFile(
    join(prevCwd, "prompts/analyze-candidate.md"),
    "utf-8",
  );
  const aggregatePrompt = await readFile(
    join(prevCwd, "prompts/aggregate-analyses.md"),
    "utf-8",
  );
  await mkdir(join(tmpRoot, "prompts"), { recursive: true });
  await writeFile(join(tmpRoot, "prompts/analyze-candidate.md"), analyzePrompt);
  await writeFile(
    join(tmpRoot, "prompts/aggregate-analyses.md"),
    aggregatePrompt,
  );

  const verDir = join(tmpRoot, "candidates", candidate, "versions", version);
  await mkdir(join(verDir, "raw-outputs"), { recursive: true });

  vi.spyOn(pathsMod, "versionDir").mockImplementation((id, v) =>
    join(tmpRoot, "candidates", id, "versions", v),
  );
  vi.spyOn(pathsMod, "rawOutputsDir").mockImplementation((id, v) =>
    join(tmpRoot, "candidates", id, "versions", v, "raw-outputs"),
  );

  process.chdir(tmpRoot);
  return verDir;
}

async function writeJson(path: string, data: unknown) {
  await writeFile(path, JSON.stringify(data, null, 2), "utf-8");
}

beforeEach(() => {
  prevCwd = process.cwd();
});

afterEach(async () => {
  vi.restoreAllMocks();
  process.chdir(prevCwd);
  if (tmpRoot) {
    await rm(tmpRoot, { recursive: true, force: true });
    tmpRoot = "";
  }
});

describe("stripJsonFence", () => {
  test("strips_json_fence_wrapper", () => {
    const text = '```json\n{"a":1}\n```';
    expect(stripJsonFence(text)).toBe('{"a":1}');
  });

  test("strips_bare_fence_wrapper", () => {
    const text = '```\n{"a":1}\n```';
    expect(stripJsonFence(text)).toBe('{"a":1}');
  });

  test("passes_through_unfenced_content", () => {
    const text = '{"a":1}';
    expect(stripJsonFence(text)).toBe('{"a":1}');
  });

  test("leaves_inner_fences_alone", () => {
    const text = '{"a":"```inside```"}';
    expect(stripJsonFence(text)).toBe('{"a":"```inside```"}');
  });
});

describe("ingestRawOutput", () => {
  test("happy_path_manual_webchat", async () => {
    const verDir = await scaffoldTempProject("test-alpha", "2027-01-15");
    const inputPath = join(tmpRoot, "manual-output.json");
    await writeJson(inputPath, buildValidAnalysisOutput());

    const { rawOutputPath, metadataPath } = await ingestRawOutput({
      candidate: "test-alpha",
      version: "2027-01-15",
      model: "claude-opus-4-1",
      mode: "manual-webchat",
      attestedVersion: "claude-opus-4-1-20250514",
      attestedBy: "operator@example",
      file: inputPath,
    });

    expect(rawOutputPath).toBe(
      join(verDir, "raw-outputs", "claude-opus-4-1.json"),
    );
    const written = JSON.parse(await readFile(rawOutputPath, "utf-8"));
    expect(written).toMatchObject(buildValidAnalysisOutput());

    const meta = JSON.parse(await readFile(metadataPath, "utf-8"));
    expect(meta.analysis.prompt_sha256).toMatch(/^[a-f0-9]{64}$/);
    expect(meta.analysis.models["claude-opus-4-1"]).toMatchObject({
      execution_mode: "manual-webchat",
      attested_by: "operator@example",
      attested_model_version: "claude-opus-4-1-20250514",
      provider_metadata_available: false,
      provider: "manual",
      status: "success",
    });
  });

  test("happy_path_copilot_agent_with_already_written", async () => {
    const verDir = await scaffoldTempProject("test-beta", "2027-02-01");
    // Copilot has already written the raw-output file directly.
    const modelFile = join(verDir, "raw-outputs", "claude-opus-4-1.json");
    await writeJson(modelFile, buildValidAnalysisOutput());

    await ingestRawOutput({
      candidate: "test-beta",
      version: "2027-02-01",
      model: "claude-opus-4-1",
      mode: "copilot-agent",
      attestedVersion: "claude-opus-4-1",
      attestedBy: "copilot-session-123",
      file: modelFile,
      alreadyWritten: true,
    });

    const meta = JSON.parse(
      await readFile(join(verDir, "metadata.json"), "utf-8"),
    );
    expect(meta.analysis.models["claude-opus-4-1"]).toMatchObject({
      execution_mode: "copilot-agent",
      provider: "copilot",
      attested_by: "copilot-session-123",
    });
  });

  test("strips_fence_on_input", async () => {
    const verDir = await scaffoldTempProject("test-gamma", "2027-03-01");
    const inputPath = join(tmpRoot, "fenced.json");
    const json = JSON.stringify(buildValidAnalysisOutput(), null, 2);
    await writeFile(inputPath, "```json\n" + json + "\n```\n", "utf-8");

    await ingestRawOutput({
      candidate: "test-gamma",
      version: "2027-03-01",
      model: "gpt-5",
      mode: "manual-webchat",
      attestedVersion: "gpt-5-thinking",
      attestedBy: "op",
      file: inputPath,
    });

    const written = await readFile(
      join(verDir, "raw-outputs", "gpt-5.json"),
      "utf-8",
    );
    expect(JSON.parse(written)).toMatchObject(buildValidAnalysisOutput());
  });

  test("rejects_invalid_json_payload", async () => {
    await scaffoldTempProject("test-delta", "2027-04-01");
    const inputPath = join(tmpRoot, "invalid.json");
    await writeFile(inputPath, "{ not json", "utf-8");

    await expect(
      ingestRawOutput({
        candidate: "test-delta",
        version: "2027-04-01",
        model: "gpt-5",
        mode: "manual-webchat",
        attestedVersion: "x",
        attestedBy: "op",
        file: inputPath,
      }),
    ).rejects.toThrow(/not valid JSON/);
  });

  test("rejects_schema_violations", async () => {
    await scaffoldTempProject("test-epsilon", "2027-05-01");
    const inputPath = join(tmpRoot, "bad-schema.json");
    await writeJson(inputPath, { foo: "bar" });

    await expect(
      ingestRawOutput({
        candidate: "test-epsilon",
        version: "2027-05-01",
        model: "gpt-5",
        mode: "manual-webchat",
        attestedVersion: "x",
        attestedBy: "op",
        file: inputPath,
      }),
    ).rejects.toThrow(/Validation failed/);
  });

  test("refuses_overwrite_without_force", async () => {
    const verDir = await scaffoldTempProject("test-zeta", "2027-06-01");
    const existing = join(verDir, "raw-outputs", "gpt-5.json");
    await writeJson(existing, buildValidAnalysisOutput());

    const inputPath = join(tmpRoot, "new.json");
    await writeJson(inputPath, buildValidAnalysisOutput());

    await expect(
      ingestRawOutput({
        candidate: "test-zeta",
        version: "2027-06-01",
        model: "gpt-5",
        mode: "manual-webchat",
        attestedVersion: "x",
        attestedBy: "op",
        file: inputPath,
      }),
    ).rejects.toThrow(/already exists/);
  });

  test("overwrites_with_force", async () => {
    const verDir = await scaffoldTempProject("test-eta", "2027-07-01");
    const existing = join(verDir, "raw-outputs", "gpt-5.json");
    await writeJson(existing, buildValidAnalysisOutput());

    const inputPath = join(tmpRoot, "new.json");
    await writeJson(inputPath, buildValidAnalysisOutput());

    await expect(
      ingestRawOutput({
        candidate: "test-eta",
        version: "2027-07-01",
        model: "gpt-5",
        mode: "manual-webchat",
        attestedVersion: "x",
        attestedBy: "op",
        file: inputPath,
        force: true,
      }),
    ).resolves.toBeDefined();
  });

  test("rejects_prompt_sha_mismatch_across_ingests", async () => {
    const verDir = await scaffoldTempProject("test-theta", "2027-08-01");
    // Pre-seed metadata with a DIFFERENT prompt hash.
    const metadata = {
      candidate_id: "test-theta",
      version_date: "2027-08-01",
      schema_version: "1.0",
      analysis: {
        prompt_file: "prompts/analyze-candidate.md",
        prompt_sha256: "a".repeat(64),
        prompt_version: "0.1",
        models: {},
      },
    };
    await writeJson(join(verDir, "metadata.json"), metadata);

    const inputPath = join(tmpRoot, "out.json");
    await writeJson(inputPath, buildValidAnalysisOutput());

    await expect(
      ingestRawOutput({
        candidate: "test-theta",
        version: "2027-08-01",
        model: "gpt-5",
        mode: "manual-webchat",
        attestedVersion: "x",
        attestedBy: "op",
        file: inputPath,
      }),
    ).rejects.toThrow(/Prompt SHA256 mismatch/);
  });

  test("rejects_api_mode", async () => {
    await scaffoldTempProject("test-iota", "2027-09-01");
    const inputPath = join(tmpRoot, "out.json");
    await writeJson(inputPath, buildValidAnalysisOutput());

    await expect(
      ingestRawOutput({
        candidate: "test-iota",
        version: "2027-09-01",
        model: "gpt-5",
        // @ts-expect-error — testing runtime guard
        mode: "api",
        attestedVersion: "x",
        attestedBy: "op",
        file: inputPath,
      }),
    ).rejects.toThrow(/does not accept.*api/);
  });

  test("respects_custom_provider", async () => {
    const verDir = await scaffoldTempProject("test-kappa", "2027-10-01");
    const inputPath = join(tmpRoot, "out.json");
    await writeJson(inputPath, buildValidAnalysisOutput());

    await ingestRawOutput({
      candidate: "test-kappa",
      version: "2027-10-01",
      model: "gpt-5",
      mode: "manual-webchat",
      attestedVersion: "x",
      attestedBy: "op",
      file: inputPath,
      provider: "openai",
    });

    const meta = JSON.parse(
      await readFile(join(verDir, "metadata.json"), "utf-8"),
    );
    expect(meta.analysis.models["gpt-5"].provider).toBe("openai");
  });
});

describe("ingestAggregated", () => {
  test("happy_path_writes_draft_and_metadata", async () => {
    const verDir = await scaffoldTempProject("test-alpha", "2027-01-15");
    const inputPath = join(tmpRoot, "agg.json");
    await writeJson(inputPath, buildValidAggregatedOutput());

    const { draftPath, metadataPath } = await ingestAggregated({
      candidate: "test-alpha",
      version: "2027-01-15",
      mode: "manual-webchat",
      attestedVersion: "gpt-5-thinking",
      attestedBy: "op",
      file: inputPath,
    });

    expect(draftPath).toBe(join(verDir, "aggregated.draft.json"));
    const meta = JSON.parse(await readFile(metadataPath, "utf-8"));
    expect(meta.aggregation.aggregator_model).toMatchObject({
      execution_mode: "manual-webchat",
      attested_by: "op",
      attested_model_version: "gpt-5-thinking",
      provider_metadata_available: false,
      provider: "manual",
    });
    expect(meta.aggregation.human_review_completed).toBe(false);
  });

  test("rejects_schema_violations", async () => {
    await scaffoldTempProject("test-beta", "2027-02-01");
    const inputPath = join(tmpRoot, "bad.json");
    await writeJson(inputPath, { not: "aggregated" });

    await expect(
      ingestAggregated({
        candidate: "test-beta",
        version: "2027-02-01",
        mode: "manual-webchat",
        attestedVersion: "x",
        attestedBy: "op",
        file: inputPath,
      }),
    ).rejects.toThrow(/Validation failed/);
  });

  test("refuses_overwrite_without_force", async () => {
    const verDir = await scaffoldTempProject("test-gamma", "2027-03-01");
    const draftPath = join(verDir, "aggregated.draft.json");
    await writeJson(draftPath, buildValidAggregatedOutput());
    const inputPath = join(tmpRoot, "new.json");
    await writeJson(inputPath, buildValidAggregatedOutput());

    await expect(
      ingestAggregated({
        candidate: "test-gamma",
        version: "2027-03-01",
        mode: "manual-webchat",
        attestedVersion: "x",
        attestedBy: "op",
        file: inputPath,
      }),
    ).rejects.toThrow(/already exists/);
  });

  test("rejects_aggregation_prompt_sha_mismatch", async () => {
    const verDir = await scaffoldTempProject("test-delta", "2027-04-01");
    const metadata = {
      candidate_id: "test-delta",
      version_date: "2027-04-01",
      schema_version: "1.0",
      aggregation: {
        prompt_file: "prompts/aggregate-analyses.md",
        prompt_sha256: "b".repeat(64),
        prompt_version: "0.1",
        aggregator_model: {
          provider: "manual",
          exact_version: "x",
          run_at: "2027-04-01T00:00:00Z",
          execution_mode: "manual-webchat",
          attested_by: "op",
          attested_model_version: "x",
          provider_metadata_available: false,
        },
        human_review_completed: false,
      },
    };
    await writeJson(join(verDir, "metadata.json"), metadata);

    const inputPath = join(tmpRoot, "agg.json");
    await writeJson(inputPath, buildValidAggregatedOutput());

    await expect(
      ingestAggregated({
        candidate: "test-delta",
        version: "2027-04-01",
        mode: "manual-webchat",
        attestedVersion: "x",
        attestedBy: "op",
        file: inputPath,
      }),
    ).rejects.toThrow(/Aggregation prompt SHA256 mismatch/);
  });

  test("copilot_agent_mode_with_already_written", async () => {
    const verDir = await scaffoldTempProject("test-epsilon", "2027-05-01");
    const draftPath = join(verDir, "aggregated.draft.json");
    await writeJson(draftPath, buildValidAggregatedOutput());

    await ingestAggregated({
      candidate: "test-epsilon",
      version: "2027-05-01",
      mode: "copilot-agent",
      attestedVersion: "claude-opus",
      attestedBy: "copilot",
      file: draftPath,
      alreadyWritten: true,
    });

    const meta = JSON.parse(
      await readFile(join(verDir, "metadata.json"), "utf-8"),
    );
    expect(meta.aggregation.aggregator_model.provider).toBe("copilot");
    expect(meta.aggregation.aggregator_model.execution_mode).toBe(
      "copilot-agent",
    );
  });
});
