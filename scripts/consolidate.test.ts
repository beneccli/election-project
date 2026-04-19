import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { consolidate } from "./consolidate";
import { MockProvider } from "./lib/mock-provider";
import { mkdtemp, rm, mkdir, writeFile, readFile, access } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import * as pathsMod from "./lib/paths";
import { vi } from "vitest";
import { hashString } from "./lib/hash";

// Mock the paths module to use temp directories
vi.mock("./lib/paths", async () => {
  const actual = await vi.importActual<typeof pathsMod>("./lib/paths");
  return { ...actual };
});

describe("consolidate", () => {
  let tmpDir: string;
  let mockProvider: MockProvider;

  const MOCK_RESPONSE = `# Test Candidate — Programme (au 2026-04-19)

> Consolidé à partir de : manifesto.txt

## Économie et finances
Le candidat propose une réforme fiscale. [Source: manifesto.txt]

## Social et démographie
Not addressed in available sources.
`;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), "consolidate-test-"));
    mockProvider = new MockProvider({
      id: "anthropic",
      modelVersion: "claude-opus-4-7",
      response: MOCK_RESPONSE,
    });
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true });
    vi.restoreAllMocks();
  });

  async function setupSourcesRaw(files: Record<string, string> = {}) {
    const srcRaw = join(tmpDir, "sources-raw");
    await mkdir(srcRaw, { recursive: true });
    for (const [name, content] of Object.entries(files)) {
      await writeFile(join(srcRaw, name), content, "utf-8");
    }
    return srcRaw;
  }

  function mockPaths() {
    vi.spyOn(pathsMod, "versionDir").mockReturnValue(tmpDir);
    vi.spyOn(pathsMod, "sourcesRawDir").mockReturnValue(
      join(tmpDir, "sources-raw"),
    );
  }

  it("consolidate_writes_draft_with_mock_provider", async () => {
    await setupSourcesRaw({ "manifesto.txt": "Le candidat propose..." });
    mockPaths();

    await consolidate({
      candidate: "test-candidate",
      version: "2026-04-19",
      provider: mockProvider,
    });

    const draft = await readFile(join(tmpDir, "sources.md.draft"), "utf-8");
    expect(draft).toContain("Programme");
    expect(mockProvider.callCount).toBe(1);
  });

  it("consolidate_does_not_create_sources_md_directly", async () => {
    await setupSourcesRaw({ "manifesto.txt": "content" });
    mockPaths();

    await consolidate({
      candidate: "test-candidate",
      version: "2026-04-19",
      provider: mockProvider,
    });

    // sources.md.draft should exist
    await access(join(tmpDir, "sources.md.draft"));

    // sources.md should NOT exist
    await expect(access(join(tmpDir, "sources.md"))).rejects.toThrow();
  });

  it("consolidate_throws_on_empty_sources_raw", async () => {
    await setupSourcesRaw({}); // empty directory
    mockPaths();

    await expect(
      consolidate({
        candidate: "test-candidate",
        version: "2026-04-19",
        provider: mockProvider,
      }),
    ).rejects.toThrow("empty");
  });

  it("consolidate_throws_on_missing_sources_raw", async () => {
    mockPaths();

    await expect(
      consolidate({
        candidate: "test-candidate",
        version: "2026-04-19",
        provider: mockProvider,
      }),
    ).rejects.toThrow("not found");
  });

  it("consolidate_records_prompt_sha256_in_metadata", async () => {
    await setupSourcesRaw({ "manifesto.txt": "content" });
    mockPaths();

    await consolidate({
      candidate: "test-candidate",
      version: "2026-04-19",
      provider: mockProvider,
    });

    const metadata = JSON.parse(
      await readFile(join(tmpDir, "metadata.json"), "utf-8"),
    );
    expect(metadata.sources.consolidation_prompt_sha256).toMatch(
      /^[a-f0-9]{64}$/,
    );

    // Verify it matches actual prompt hash
    const promptContent = await readFile(
      join(pathsMod.PROJECT_ROOT, "prompts", "consolidate-sources.md"),
      "utf-8",
    );
    expect(metadata.sources.consolidation_prompt_sha256).toBe(
      hashString(promptContent),
    );
  });

  it("consolidate_skips_if_draft_already_exists_without_force", async () => {
    await setupSourcesRaw({ "manifesto.txt": "content" });
    mockPaths();

    // Create existing draft
    await writeFile(join(tmpDir, "sources.md.draft"), "existing", "utf-8");

    await consolidate({
      candidate: "test-candidate",
      version: "2026-04-19",
      provider: mockProvider,
    });

    // Provider should NOT have been called
    expect(mockProvider.callCount).toBe(0);

    // Draft content should be unchanged
    const draft = await readFile(join(tmpDir, "sources.md.draft"), "utf-8");
    expect(draft).toBe("existing");
  });

  it("consolidate_overwrites_draft_with_force", async () => {
    await setupSourcesRaw({ "manifesto.txt": "content" });
    mockPaths();

    // Create existing draft
    await writeFile(join(tmpDir, "sources.md.draft"), "old content", "utf-8");

    await consolidate({
      candidate: "test-candidate",
      version: "2026-04-19",
      provider: mockProvider,
      force: true,
    });

    expect(mockProvider.callCount).toBe(1);
    const draft = await readFile(join(tmpDir, "sources.md.draft"), "utf-8");
    expect(draft).toContain("Programme");
  });

  it("consolidate_dry_run_does_not_call_provider", async () => {
    await setupSourcesRaw({ "manifesto.txt": "content" });
    mockPaths();

    await consolidate({
      candidate: "test-candidate",
      version: "2026-04-19",
      provider: mockProvider,
      dryRun: true,
    });

    expect(mockProvider.callCount).toBe(0);
    await expect(access(join(tmpDir, "sources.md.draft"))).rejects.toThrow();
  });
});
