/**
 * End-to-end pipeline integration test with mock LLMs.
 *
 * See docs/specs/data-pipeline/overview.md and docs/specs/analysis/aggregation.md.
 *
 * Exercises the full scaffold → consolidate → analyze → aggregate → review → publish
 * chain using real schema fixtures and the scripted MockProvider. Covers five paths:
 *
 *   1. Happy path — three analyses, aggregator returns valid-full fixture, review
 *      approves every flagged item, publish succeeds.
 *   2. Coverage-warning path — only one analysis survives, aggregator returns the
 *      valid-single-model fixture (`coverage_warning: true`).
 *   3. Schema-drift path — aggregator returns malformed JSON three times, retry
 *      loop exhausts, `aggregated.FAILED.json` carries the ZodError issues and no
 *      draft is produced.
 *   4. Publish-gate path — draft present but `human_review_completed: false` →
 *      publish() refuses.
 *   5. Skipped-items path — review() leaves items skipped → no aggregated.json,
 *      metadata stays `human_review_completed: false`.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  mkdtemp,
  rm,
  writeFile,
  readFile,
  readdir,
  rename,
  access,
  mkdir,
} from "node:fs/promises";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { MockProvider } from "./lib/mock-provider";
import { scaffoldCandidate } from "./scaffold-candidate";
import { consolidate } from "./consolidate";
import { analyze } from "./analyze";
import { aggregate } from "./aggregate";
import { review, type Prompter, type ReviewChoice, type FlaggedItem } from "./review";
import { publish } from "./publish";
import * as pathsMod from "./lib/paths";

const __dirname = dirname(fileURLToPath(import.meta.url));
const loadFixture = (rel: string): Record<string, unknown> =>
  JSON.parse(readFileSync(join(__dirname, rel), "utf8"));

const analysisFixture = loadFixture(
  "lib/fixtures/analysis-output/valid-full.json",
) as { model: { provider: string; version: string } } & Record<string, unknown>;
const aggregatedFullFixture = loadFixture(
  "lib/fixtures/aggregated-output/valid-full.json",
);
const aggregatedSingleModelFixture = loadFixture(
  "lib/fixtures/aggregated-output/valid-single-model.json",
);

// ---------------------------------------------------------------------------
// Test plumbing
// ---------------------------------------------------------------------------

vi.mock("./lib/paths", async () => {
  const actual = await vi.importActual<typeof pathsMod>("./lib/paths");
  return { ...actual };
});

vi.mock("./config/models", async () => {
  const actual = await vi.importActual<typeof import("./config/models")>(
    "./config/models",
  );
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
Nationalisation des autoroutes. [Source: manifesto.txt]
`;

/** Shape the real analysis fixture for a specific model string. */
function analysisResponseFor(modelVersion: string): string {
  const out = {
    ...analysisFixture,
    model: {
      provider: analysisFixture.model.provider,
      version: modelVersion,
    },
  };
  return JSON.stringify(out);
}

/** ScriptedPrompter drives review() without a TTY or $EDITOR. */
class ScriptedPrompter implements Prompter {
  constructor(
    private readonly choices: ReviewChoice[],
    private readonly editText = "edited-claim-text",
  ) {}
  private i = 0;
  public asked: FlaggedItem[] = [];
  async ask(item: FlaggedItem): Promise<ReviewChoice> {
    this.asked.push(item);
    const c = this.choices[this.i++];
    if (!c) throw new Error("ScriptedPrompter ran out of choices");
    return c;
  }
  async edit(): Promise<string> {
    return this.editText;
  }
}

async function exists(p: string): Promise<boolean> {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

/**
 * Bootstrap a fresh candidate workspace in a tmpdir: scaffold, seed
 * sources-raw, run consolidate, rename draft → sources.md. Returns the
 * working paths. Shared by every path test.
 */
async function bootstrapCandidate(): Promise<{
  tmpDir: string;
  candDir: string;
  verDir: string;
}> {
  const tmpDir = await mkdtemp(join(tmpdir(), "pipeline-e2e-"));
  const candDir = join(tmpDir, "candidates", CANDIDATE_ID);
  const verDir = join(candDir, "versions", VERSION);

  vi.spyOn(pathsMod, "candidateDir").mockImplementation((id: string) =>
    join(tmpDir, "candidates", id),
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

  await scaffoldCandidate({
    id: CANDIDATE_ID,
    name: "Test Candidate",
    party: "Test Party",
    partyId: "test-party",
    date: VERSION,
  });

  await writeFile(
    join(verDir, "sources-raw", "manifesto.txt"),
    "Le candidat propose une nationalisation des autoroutes et une réforme fiscale.",
    "utf-8",
  );

  await consolidate({
    candidate: CANDIDATE_ID,
    version: VERSION,
    provider: new MockProvider({
      id: "anthropic",
      modelVersion: "claude-opus-4-0-20250514",
      response: CONSOLIDATION_RESPONSE,
    }),
  });
  await rename(join(verDir, "sources.md.draft"), join(verDir, "sources.md"));

  return { tmpDir, candDir, verDir };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Pipeline integration — end-to-end", () => {
  let tmpDir: string;
  let verDir: string;
  let candDir: string;

  beforeEach(async () => {
    ({ tmpDir, candDir, verDir } = await bootstrapCandidate());
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await rm(tmpDir, { recursive: true, force: true });
  });

  // -------------------------------------------------------------------------
  // Path 1 — Happy path
  // -------------------------------------------------------------------------

  it("happy_path_full_pipeline_produces_published_version", async () => {
    // Analyze: two succeed, one fails (broken-model).
    await analyze({
      candidate: CANDIDATE_ID,
      version: VERSION,
      providers: {
        anthropic: new MockProvider({
          id: "anthropic",
          modelVersion: "claude-test",
          response: analysisResponseFor("claude-test"),
        }),
        openai: new MockProvider({
          id: "openai",
          modelVersion: "gpt-test",
          response: analysisResponseFor("gpt-test"),
        }),
        broken: new MockProvider({
          id: "broken",
          error: new Error("provider down"),
        }),
      },
    });

    const rawOutputs = await readdir(join(verDir, "raw-outputs"));
    expect(rawOutputs).toContain("claude-test.json");
    expect(rawOutputs).toContain("gpt-test.json");
    expect(rawOutputs).toContain("broken-model.FAILED.json");

    // Aggregate with the full fixture — includes one flagged item.
    await aggregate({
      candidate: CANDIDATE_ID,
      version: VERSION,
      provider: new MockProvider({
        id: "anthropic",
        modelVersion: "claude-opus-4-0-20250514",
        response: JSON.stringify(aggregatedFullFixture),
      }),
    });

    expect(await exists(join(verDir, "aggregated.draft.json"))).toBe(true);
    expect(await exists(join(verDir, "aggregation-notes.md"))).toBe(true);

    // Review: approve the single flagged item.
    const prompter = new ScriptedPrompter(["a"]);
    const summary = await review({
      candidate: CANDIDATE_ID,
      version: VERSION,
      reviewer: "tester",
      prompter,
    });

    expect(summary.finalWritten).toBe(true);
    expect(summary.quitEarly).toBe(false);
    expect(prompter.asked).toHaveLength(1);
    expect(await exists(join(verDir, "aggregated.json"))).toBe(true);

    const finalMeta = JSON.parse(
      await readFile(join(verDir, "metadata.json"), "utf-8"),
    );
    expect(finalMeta.aggregation.human_review_completed).toBe(true);
    expect(finalMeta.aggregation.prompt_sha256).toMatch(/^[a-f0-9]{64}$/);

    // Publish: symlink + currentVersion file updated.
    await publish({ candidate: CANDIDATE_ID, version: VERSION });

    // `current` exists in candDir (either symlink or plain file, depending
    // on fallback logic).
    const candidateEntries = await readdir(candDir);
    expect(candidateEntries).toContain("current");
  });

  // -------------------------------------------------------------------------
  // Path 2 — Coverage warning (single successful model)
  // -------------------------------------------------------------------------

  it("coverage_warning_path_aggregates_from_single_model", async () => {
    // Only anthropic succeeds; openai and broken both fail.
    await analyze({
      candidate: CANDIDATE_ID,
      version: VERSION,
      providers: {
        anthropic: new MockProvider({
          id: "anthropic",
          modelVersion: "claude-test",
          response: analysisResponseFor("claude-test"),
        }),
        openai: new MockProvider({
          id: "openai",
          error: new Error("rate limited"),
        }),
        broken: new MockProvider({
          id: "broken",
          error: new Error("provider down"),
        }),
      },
    });

    const rawOutputs = await readdir(join(verDir, "raw-outputs"));
    expect(rawOutputs).toContain("claude-test.json");
    expect(rawOutputs).toContain("gpt-test.FAILED.json");
    expect(rawOutputs).toContain("broken-model.FAILED.json");

    await aggregate({
      candidate: CANDIDATE_ID,
      version: VERSION,
      provider: new MockProvider({
        id: "anthropic",
        modelVersion: "claude-opus-4-0-20250514",
        response: JSON.stringify(aggregatedSingleModelFixture),
      }),
    });

    const draft = JSON.parse(
      await readFile(join(verDir, "aggregated.draft.json"), "utf-8"),
    );
    expect(draft.coverage_warning).toBe(true);
    expect(draft.source_models).toHaveLength(1);

    const notes = await readFile(
      join(verDir, "aggregation-notes.md"),
      "utf-8",
    );
    // Only one raw output was available — notes must surface the warning.
    expect(notes).toMatch(/Warning|Only 1 model/);
  });

  // -------------------------------------------------------------------------
  // Path 3 — Schema drift (retry exhausted)
  // -------------------------------------------------------------------------

  it("schema_drift_path_writes_aggregated_failed_json_after_retries", async () => {
    await analyze({
      candidate: CANDIDATE_ID,
      version: VERSION,
      providers: {
        anthropic: new MockProvider({
          id: "anthropic",
          modelVersion: "claude-test",
          response: analysisResponseFor("claude-test"),
        }),
        openai: new MockProvider({
          id: "openai",
          modelVersion: "gpt-test",
          response: analysisResponseFor("gpt-test"),
        }),
        broken: new MockProvider({ id: "broken", error: new Error("x") }),
      },
    });

    // Aggregator returns something that parses as JSON but fails schema.
    const malformed = JSON.stringify({ not: "an aggregated output" });
    const provider = new MockProvider({
      id: "anthropic",
      modelVersion: "claude-opus-4-0-20250514",
      responses: [malformed, malformed, malformed],
    });

    await expect(
      aggregate({ candidate: CANDIDATE_ID, version: VERSION, provider }),
    ).rejects.toThrow();

    // Provider was called MAX_RETRIES + 1 = 3 times.
    expect(provider.callCount).toBe(3);

    // aggregated.FAILED.json exists and carries ZodError issues.
    const failedPath = join(verDir, "aggregated.FAILED.json");
    expect(await exists(failedPath)).toBe(true);
    const failed = JSON.parse(await readFile(failedPath, "utf-8"));
    expect(failed.candidate_id).toBe(CANDIDATE_ID);
    expect(failed.version_date).toBe(VERSION);
    expect(failed.attempts).toBe(3);
    expect(Array.isArray(failed.issues)).toBe(true);
    expect(failed.issues.length).toBeGreaterThan(0);

    // Draft must NOT exist.
    expect(await exists(join(verDir, "aggregated.draft.json"))).toBe(false);
  });

  // -------------------------------------------------------------------------
  // Path 4 — Publish gate
  // -------------------------------------------------------------------------

  it("publish_gate_refuses_when_human_review_not_completed", async () => {
    await analyze({
      candidate: CANDIDATE_ID,
      version: VERSION,
      providers: {
        anthropic: new MockProvider({
          id: "anthropic",
          modelVersion: "claude-test",
          response: analysisResponseFor("claude-test"),
        }),
        openai: new MockProvider({
          id: "openai",
          modelVersion: "gpt-test",
          response: analysisResponseFor("gpt-test"),
        }),
        broken: new MockProvider({ id: "broken", error: new Error("x") }),
      },
    });

    await aggregate({
      candidate: CANDIDATE_ID,
      version: VERSION,
      provider: new MockProvider({
        id: "anthropic",
        modelVersion: "claude-opus-4-0-20250514",
        response: JSON.stringify(aggregatedFullFixture),
      }),
    });

    // Promote draft → final but leave human_review_completed at false.
    await rename(
      join(verDir, "aggregated.draft.json"),
      join(verDir, "aggregated.json"),
    );

    await expect(
      publish({ candidate: CANDIDATE_ID, version: VERSION }),
    ).rejects.toThrow(/human_review_completed/);
  });

  // -------------------------------------------------------------------------
  // Path 5 — Skipped items block final write
  // -------------------------------------------------------------------------

  it("skipped_items_path_blocks_final_and_keeps_metadata_unreviewed", async () => {
    await analyze({
      candidate: CANDIDATE_ID,
      version: VERSION,
      providers: {
        anthropic: new MockProvider({
          id: "anthropic",
          modelVersion: "claude-test",
          response: analysisResponseFor("claude-test"),
        }),
        openai: new MockProvider({
          id: "openai",
          modelVersion: "gpt-test",
          response: analysisResponseFor("gpt-test"),
        }),
        broken: new MockProvider({ id: "broken", error: new Error("x") }),
      },
    });

    await aggregate({
      candidate: CANDIDATE_ID,
      version: VERSION,
      provider: new MockProvider({
        id: "anthropic",
        modelVersion: "claude-opus-4-0-20250514",
        response: JSON.stringify(aggregatedFullFixture),
      }),
    });

    // Skip the only flagged item.
    const prompter = new ScriptedPrompter(["s"]);
    const summary = await review({
      candidate: CANDIDATE_ID,
      version: VERSION,
      reviewer: "tester",
      prompter,
    });

    expect(summary.finalWritten).toBe(false);
    expect(summary.counts.skipped).toBe(1);
    expect(await exists(join(verDir, "aggregated.json"))).toBe(false);

    const meta = JSON.parse(
      await readFile(join(verDir, "metadata.json"), "utf-8"),
    );
    expect(meta.aggregation.human_review_completed).toBe(false);

    // Publish is correctly blocked as well.
    await expect(
      publish({ candidate: CANDIDATE_ID, version: VERSION }),
    ).rejects.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Bonus: consolidate gate (kept from prior integration test, still relevant)
// ---------------------------------------------------------------------------

describe("Pipeline integration — pre-conditions", () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), "pipeline-pre-"));
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await rm(tmpDir, { recursive: true, force: true });
  });

  it("consolidate_refuses_empty_sources_raw", async () => {
    const emptyDir = join(tmpDir, "candidates", "empty-test", "versions", "2026-01-01");
    await mkdir(join(emptyDir, "sources-raw"), { recursive: true });

    vi.spyOn(pathsMod, "versionDir").mockReturnValue(emptyDir);
    vi.spyOn(pathsMod, "sourcesRawDir").mockReturnValue(
      join(emptyDir, "sources-raw"),
    );

    const provider = new MockProvider({ id: "anthropic", response: "" });
    await expect(
      consolidate({ candidate: "empty-test", version: "2026-01-01", provider }),
    ).rejects.toThrow(/empty/);
  });
});
