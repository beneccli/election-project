/**
 * Tests for manual-mode bundle generators.
 */
import { describe, expect, test, beforeEach, afterEach, vi } from "vitest";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { hashString } from "./lib/hash";
import * as pathsMod from "./lib/paths";
import {
  buildBundle,
  prepareManualAnalysis,
  stripFrontmatter,
} from "./prepare-manual-analysis";
import {
  buildAggregationBundle,
  prepareManualAggregation,
} from "./prepare-manual-aggregation";

let tmpRoot: string;
let prevCwd: string;

/**
 * Scaffold a minimal candidate version inside a tempdir, spy on path
 * helpers so scripts write into the tempdir, and chdir in so relative
 * `prompts/` resolution works.
 */
async function scaffoldTempProject(opts: {
  candidate: string;
  version: string;
  withRawOutputs?: Record<string, unknown>;
  sources?: string;
}): Promise<string> {
  tmpRoot = await mkdtemp(join(tmpdir(), "prepare-manual-"));

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

  const tmpVersionDir = (id: string, version: string) =>
    join(tmpRoot, "candidates", id, "versions", version);

  await mkdir(tmpVersionDir(opts.candidate, opts.version), { recursive: true });
  await writeFile(
    join(tmpVersionDir(opts.candidate, opts.version), "sources.md"),
    opts.sources ?? "# Test sources\n\nA minimal program.\n",
  );

  if (opts.withRawOutputs) {
    const rawDir = join(
      tmpVersionDir(opts.candidate, opts.version),
      "raw-outputs",
    );
    await mkdir(rawDir, { recursive: true });
    for (const [name, content] of Object.entries(opts.withRawOutputs)) {
      await writeFile(join(rawDir, name), JSON.stringify(content, null, 2));
    }
  }

  vi.spyOn(pathsMod, "versionDir").mockImplementation(tmpVersionDir);
  vi.spyOn(pathsMod, "rawOutputsDir").mockImplementation((id, version) =>
    join(tmpVersionDir(id, version), "raw-outputs"),
  );

  process.chdir(tmpRoot);
  return tmpRoot;
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

describe("stripFrontmatter", () => {
  test("strips_single_leading_yaml_block", () => {
    const input = "---\ntitle: x\nversion: 1\n---\n# Body\n\nline\n";
    expect(stripFrontmatter(input)).toBe("# Body\n\nline\n");
  });

  test("passes_through_when_no_frontmatter", () => {
    const input = "# Body\n\nline\n";
    expect(stripFrontmatter(input)).toBe(input);
  });

  test("only_strips_first_block", () => {
    const input = "---\na: 1\n---\nmid\n---\nb: 2\n---\nend\n";
    expect(stripFrontmatter(input)).toBe("mid\n---\nb: 2\n---\nend\n");
  });
});

describe("buildBundle (analysis)", () => {
  test("includes_sha256_prompt_body_and_sources_verbatim", () => {
    const promptBody = "# Analyze\n\nInstructions here.\n";
    const sourcesMd = "# Sources\n\nCandidate program.\n";
    const promptSha256 = hashString("---\nx: 1\n---\n" + promptBody);
    const bundle = buildBundle({
      candidate: "test-a",
      version: "2027-01-15",
      promptPath: "prompts/analyze-candidate.md",
      promptBody,
      promptSha256,
      sourcesMd,
      generatedAt: "2027-01-15T10:00:00.000Z",
    });

    expect(bundle).toContain(`Prompt SHA256: ${promptSha256}`);
    expect(bundle).toContain("Candidate: test-a");
    expect(bundle).toContain("Version: 2027-01-15");
    expect(bundle).toContain("Mode: manual-webchat");
    expect(bundle).toContain(promptBody);
    expect(bundle).toContain(sourcesMd);
    expect(bundle).toContain("return JSON only");
  });
});

describe("prepareManualAnalysis", () => {
  test("writes_bundle_files_with_matching_sha256", async () => {
    await scaffoldTempProject({
      candidate: "test-alpha",
      version: "2027-01-15",
      sources: "# Sources alpha\n\nContent.\n",
    });

    const { bundlePath, promptSha256 } = await prepareManualAnalysis({
      candidate: "test-alpha",
      version: "2027-01-15",
    });

    const bundle = await readFile(bundlePath, "utf-8");
    const promptOnDisk = await readFile(
      "prompts/analyze-candidate.md",
      "utf-8",
    );
    expect(promptSha256).toBe(hashString(promptOnDisk));
    expect(bundle).toContain(promptSha256);
    expect(bundle).toContain("# Sources alpha");

    const manualDir = join(
      tmpRoot,
      "candidates/test-alpha/versions/2027-01-15/_manual",
    );
    const sourcesCopy = await readFile(
      join(manualDir, "sources.md"),
      "utf-8",
    );
    expect(sourcesCopy).toContain("# Sources alpha");
    const readme = await readFile(join(manualDir, "README.md"), "utf-8");
    expect(readme).toContain("test-alpha");
    expect(readme).toContain("2027-01-15");
    expect(readme).toContain(promptSha256);
    const expected = await readFile(
      join(manualDir, "expected-filenames.txt"),
      "utf-8",
    );
    expect(expected).toContain("claude-opus");
  });

  test("refuses_overwrite_without_force", async () => {
    await scaffoldTempProject({
      candidate: "test-beta",
      version: "2027-02-01",
    });

    await prepareManualAnalysis({
      candidate: "test-beta",
      version: "2027-02-01",
    });

    await expect(
      prepareManualAnalysis({
        candidate: "test-beta",
        version: "2027-02-01",
      }),
    ).rejects.toThrow(/_manual\/ already exists/);
  });

  test("overwrites_with_force", async () => {
    await scaffoldTempProject({
      candidate: "test-gamma",
      version: "2027-03-01",
    });

    await prepareManualAnalysis({
      candidate: "test-gamma",
      version: "2027-03-01",
    });
    await expect(
      prepareManualAnalysis({
        candidate: "test-gamma",
        version: "2027-03-01",
        force: true,
      }),
    ).resolves.toBeDefined();
  });

  test("throws_when_sources_missing", async () => {
    await scaffoldTempProject({
      candidate: "test-delta",
      version: "2027-04-01",
    });
    await rm(
      join(tmpRoot, "candidates/test-delta/versions/2027-04-01/sources.md"),
    );

    await expect(
      prepareManualAnalysis({
        candidate: "test-delta",
        version: "2027-04-01",
      }),
    ).rejects.toThrow(/sources\.md not found/);
  });
});

describe("buildAggregationBundle", () => {
  test("includes_all_raw_outputs_and_sha256", () => {
    const bundle = buildAggregationBundle({
      candidate: "test-x",
      version: "2027-05-01",
      promptPath: "prompts/aggregate-analyses.md",
      promptBody: "# Aggregate\n",
      promptSha256: "deadbeef",
      sourcesMd: "# S\n",
      rawOutputs: [
        { filename: "claude.json", content: '{"a":1}' },
        { filename: "gpt.json", content: '{"b":2}' },
      ],
      generatedAt: "2027-05-01T00:00:00.000Z",
    });

    expect(bundle).toContain("Prompt SHA256: deadbeef");
    expect(bundle).toContain("Raw outputs included: 2");
    expect(bundle).toContain("RAW OUTPUT — claude.json");
    expect(bundle).toContain('{"a":1}');
    expect(bundle).toContain("RAW OUTPUT — gpt.json");
    expect(bundle).toContain('{"b":2}');
  });
});

describe("prepareManualAggregation", () => {
  test("bundles_existing_raw_outputs", async () => {
    await scaffoldTempProject({
      candidate: "test-epsilon",
      version: "2027-06-01",
      withRawOutputs: {
        "claude.json": { dummy: "claude" },
        "gpt.json": { dummy: "gpt" },
      },
    });

    const { bundlePath, promptSha256, rawOutputCount } =
      await prepareManualAggregation({
        candidate: "test-epsilon",
        version: "2027-06-01",
      });

    expect(rawOutputCount).toBe(2);
    const bundle = await readFile(bundlePath, "utf-8");
    expect(bundle).toContain(promptSha256);
    expect(bundle).toContain('"dummy": "claude"');
    expect(bundle).toContain('"dummy": "gpt"');

    const dir = join(
      tmpRoot,
      "candidates/test-epsilon/versions/2027-06-01/_manual-aggregation",
    );
    const readme = await readFile(join(dir, "README.md"), "utf-8");
    expect(readme).toContain("test-epsilon");
    expect(readme).toContain(promptSha256);
  });

  test("throws_when_raw_outputs_missing", async () => {
    await scaffoldTempProject({
      candidate: "test-zeta",
      version: "2027-07-01",
    });
    await expect(
      prepareManualAggregation({
        candidate: "test-zeta",
        version: "2027-07-01",
      }),
    ).rejects.toThrow(/raw-outputs\//);
  });

  test("throws_when_raw_outputs_empty", async () => {
    await scaffoldTempProject({
      candidate: "test-eta",
      version: "2027-08-01",
    });
    await mkdir(
      join(tmpRoot, "candidates/test-eta/versions/2027-08-01/raw-outputs"),
      { recursive: true },
    );
    await expect(
      prepareManualAggregation({
        candidate: "test-eta",
        version: "2027-08-01",
      }),
    ).rejects.toThrow(/No JSON files/);
  });

  test("refuses_overwrite_without_force", async () => {
    await scaffoldTempProject({
      candidate: "test-theta",
      version: "2027-09-01",
      withRawOutputs: { "claude.json": { dummy: "claude" } },
    });

    await prepareManualAggregation({
      candidate: "test-theta",
      version: "2027-09-01",
    });
    await expect(
      prepareManualAggregation({
        candidate: "test-theta",
        version: "2027-09-01",
      }),
    ).rejects.toThrow(/_manual-aggregation\/ already exists/);
  });
});
