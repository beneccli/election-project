import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { publish } from "./publish";
import { mkdtemp, rm, mkdir, writeFile, readFile, readlink, lstat } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import * as pathsMod from "./lib/paths";
import { buildValidAggregatedOutput } from "./lib/fixtures/aggregated-output/builder";

vi.mock("./lib/paths", async () => {
  const actual = await vi.importActual<typeof pathsMod>("./lib/paths");
  return { ...actual };
});

describe("publish", () => {
  let tmpDir: string;
  let candDir: string;
  let verDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), "publish-test-"));
    candDir = join(tmpDir, "candidates", "test-candidate");
    verDir = join(candDir, "versions", "2026-04-19");
    await mkdir(verDir, { recursive: true });

    // Create required artifacts
    await writeFile(join(verDir, "sources.md"), "# Sources", "utf-8");
    await writeFile(
      join(verDir, "aggregated.json"),
      JSON.stringify(buildValidAggregatedOutput()),
      "utf-8",
    );
    await writeFile(
      join(verDir, "metadata.json"),
      JSON.stringify({
        candidate_id: "test-candidate",
        version_date: "2026-04-19",
        schema_version: "1.0",
        aggregation: {
          prompt_file: "prompts/aggregate-analyses.md",
          prompt_sha256: "a".repeat(64),
          prompt_version: "0.1",
          aggregator_model: {
            provider: "anthropic",
            exact_version: "claude-opus-4-0-20250514",
            run_at: new Date().toISOString(),
          },
          human_review_completed: true,
        },
      }),
      "utf-8",
    );

    // Create candidate metadata
    await writeFile(
      join(candDir, "metadata.json"),
      JSON.stringify({
        id: "test-candidate",
        display_name: "Test Candidate",
        party: "Test Party",
        party_id: "test-party",
        created: "2026-04-19",
        updated: "2026-04-19",
      }),
      "utf-8",
    );

    vi.spyOn(pathsMod, "versionDir").mockReturnValue(verDir);
    vi.spyOn(pathsMod, "candidateDir").mockReturnValue(candDir);
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true });
    vi.restoreAllMocks();
  });

  it("publish_creates_symlink", async () => {
    await publish({ candidate: "test-candidate", version: "2026-04-19" });

    const target = await readlink(join(candDir, "current"));
    expect(target).toBe("versions/2026-04-19");
  });

  it("publish_refuses_without_aggregated_json", async () => {
    const { rm: rmFile } = await import("node:fs/promises");
    await rmFile(join(verDir, "aggregated.json"));

    await expect(
      publish({ candidate: "test-candidate", version: "2026-04-19" }),
    ).rejects.toThrow("aggregated.json not found");
  });

  it("publish_refuses_without_human_review", async () => {
    const meta = JSON.parse(await readFile(join(verDir, "metadata.json"), "utf-8"));
    meta.aggregation.human_review_completed = false;
    await writeFile(join(verDir, "metadata.json"), JSON.stringify(meta), "utf-8");

    await expect(
      publish({ candidate: "test-candidate", version: "2026-04-19" }),
    ).rejects.toThrow("human_review_completed");
  });

  it("publish_refuses_without_sources_md", async () => {
    const { rm: rmFile } = await import("node:fs/promises");
    await rmFile(join(verDir, "sources.md"));

    await expect(
      publish({ candidate: "test-candidate", version: "2026-04-19" }),
    ).rejects.toThrow("sources.md not found");
  });

  it("publish_dry_run_does_not_create_symlink", async () => {
    await publish({
      candidate: "test-candidate",
      version: "2026-04-19",
      dryRun: true,
    });

    await expect(lstat(join(candDir, "current"))).rejects.toThrow();
  });

  it("publish_updates_candidate_metadata_updated_field", async () => {
    await publish({ candidate: "test-candidate", version: "2026-04-19" });

    const candMeta = JSON.parse(
      await readFile(join(candDir, "metadata.json"), "utf-8"),
    );
    expect(candMeta.updated).toBe("2026-04-19");
  });
});
