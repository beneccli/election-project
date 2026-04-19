import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { scaffoldCandidate } from "./scaffold-candidate";
import { mkdtemp, rm, readFile, access } from "node:fs/promises";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import * as pathsMod from "./lib/paths";

const __dirname = dirname(fileURLToPath(import.meta.url));

vi.mock("./lib/paths", async () => {
  const actual = await vi.importActual<typeof pathsMod>("./lib/paths");
  return { ...actual };
});

describe("scaffold-candidate", () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), "scaffold-test-"));

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
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true });
    vi.restoreAllMocks();
  });

  it("scaffold_creates_directory_structure", async () => {
    await scaffoldCandidate({
      id: "jean-dupont",
      name: "Jean Dupont",
      party: "Parti Test",
      date: "2026-04-19",
    });

    const base = join(tmpDir, "candidates", "jean-dupont");
    await access(join(base, "metadata.json"));
    await access(join(base, "versions", "2026-04-19", "metadata.json"));
    await access(join(base, "versions", "2026-04-19", "sources-raw", ".gitkeep"));
    await access(join(base, "versions", "2026-04-19", "raw-outputs", ".gitkeep"));
  });

  it("scaffold_creates_valid_candidate_metadata", async () => {
    await scaffoldCandidate({
      id: "jean-dupont",
      name: "Jean Dupont",
      party: "Parti Test",
      partyId: "parti-test",
      date: "2026-04-19",
    });

    const meta = JSON.parse(
      await readFile(
        join(tmpDir, "candidates", "jean-dupont", "metadata.json"),
        "utf-8",
      ),
    );
    expect(meta.id).toBe("jean-dupont");
    expect(meta.display_name).toBe("Jean Dupont");
    expect(meta.party).toBe("Parti Test");
    expect(meta.party_id).toBe("parti-test");
  });

  it("scaffold_creates_valid_version_metadata", async () => {
    await scaffoldCandidate({
      id: "jean-dupont",
      name: "Jean Dupont",
      party: "Parti Test",
      date: "2026-04-19",
    });

    const meta = JSON.parse(
      await readFile(
        join(
          tmpDir,
          "candidates",
          "jean-dupont",
          "versions",
          "2026-04-19",
          "metadata.json",
        ),
        "utf-8",
      ),
    );
    expect(meta.candidate_id).toBe("jean-dupont");
    expect(meta.version_date).toBe("2026-04-19");
  });

  it("scaffold_rejects_invalid_id", async () => {
    await expect(
      scaffoldCandidate({
        id: "Invalid_ID",
        name: "Test",
        party: "Test",
        date: "2026-04-19",
      }),
    ).rejects.toThrow("Invalid candidate ID");
  });

  it("scaffold_refuses_existing_candidate", async () => {
    await scaffoldCandidate({
      id: "jean-dupont",
      name: "Jean Dupont",
      party: "Parti Test",
      date: "2026-04-19",
    });

    await expect(
      scaffoldCandidate({
        id: "jean-dupont",
        name: "Jean Dupont",
        party: "Parti Test",
        date: "2026-04-19",
      }),
    ).rejects.toThrow("already exists");
  });

  it("scaffold_rejects_is_fictional_without_test_prefix", async () => {
    await expect(
      scaffoldCandidate({
        id: "jean-dupont",
        name: "Jean Dupont",
        party: "Parti Test",
        date: "2026-04-19",
        isFictional: true,
      }),
    ).rejects.toThrow(/test-/);
  });

  it("scaffold_rejects_test_prefix_without_is_fictional", async () => {
    await expect(
      scaffoldCandidate({
        id: "test-jean",
        name: "Jean Test",
        party: "Parti Test",
        date: "2026-04-19",
      }),
    ).rejects.toThrow(/is-fictional/);
  });

  it("scaffold_creates_fictional_candidate_with_banner", async () => {
    await scaffoldCandidate({
      id: "test-jean",
      name: "Jean Test",
      party: "Parti Fictif",
      date: "2026-04-19",
      isFictional: true,
    });

    const meta = JSON.parse(
      await readFile(
        join(tmpDir, "candidates", "test-jean", "metadata.json"),
        "utf-8",
      ),
    );
    expect(meta.is_fictional).toBe(true);

    const draft = await readFile(
      join(
        tmpDir,
        "candidates",
        "test-jean",
        "versions",
        "2026-04-19",
        "sources.md.draft",
      ),
      "utf-8",
    );
    expect(draft).toContain("PROGRAMME FICTIF");
    expect(draft).toContain("Jean Test");
  });
});

// ---------------------------------------------------------------------------
// CLI-level smoke test. Spawns the actual script as a subprocess to catch
// bugs the programmatic test cannot (unwired action handler, broken argv
// parsing under pnpm-style `--` forwarding, required-option wiring).
// ---------------------------------------------------------------------------
describe("scaffold-candidate CLI", () => {
  let cliTmpDir: string;

  beforeEach(async () => {
    cliTmpDir = await mkdtemp(join(tmpdir(), "scaffold-cli-"));
  });

  afterEach(async () => {
    await rm(cliTmpDir, { recursive: true, force: true });
  });

  const scriptPath = join(__dirname, "scaffold-candidate.ts");

  function runCli(args: string[]): { status: number; stdout: string; stderr: string } {
    const result = spawnSync("npx", ["tsx", scriptPath, ...args], {
      cwd: cliTmpDir,
      encoding: "utf-8",
      env: {
        ...process.env,
        NO_COLOR: "1",
        ELECTION_PROJECT_ROOT: cliTmpDir,
      },
    });
    return {
      status: result.status ?? -1,
      stdout: result.stdout ?? "",
      stderr: result.stderr ?? "",
    };
  }

  it("cli_runs_action_and_scaffolds_candidate", async () => {
    const res = runCli([
      "--id",
      "marie-dupont",
      "--name",
      "Marie Dupont",
      "--party",
      "Parti Test",
      "--date",
      "2027-01-01",
    ]);

    expect(res.status, `stderr: ${res.stderr}`).toBe(0);
    expect(res.stderr).not.toMatch(/not yet wired/i);

    const metaPath = join(
      cliTmpDir,
      "candidates",
      "marie-dupont",
      "metadata.json",
    );
    const meta = JSON.parse(await readFile(metaPath, "utf-8"));
    expect(meta.display_name).toBe("Marie Dupont");
  }, 30_000);

  it("cli_strips_leading_double_dash_pnpm_style", async () => {
    // pnpm forwards a literal `--` to the child script. Commander treats
    // `--` as end-of-options, so without normalizeArgv this invocation
    // would fail with "required option '--id <id>' not specified".
    const res = runCli([
      "--",
      "--id",
      "pierre-martin",
      "--name",
      "Pierre Martin",
      "--party",
      "Parti Test",
      "--date",
      "2027-01-01",
    ]);

    expect(res.status, `stderr: ${res.stderr}`).toBe(0);
    const metaPath = join(
      cliTmpDir,
      "candidates",
      "pierre-martin",
      "metadata.json",
    );
    const meta = JSON.parse(await readFile(metaPath, "utf-8"));
    expect(meta.display_name).toBe("Pierre Martin");
  }, 30_000);

  it("cli_accepts_is_fictional_flag_end_to_end", async () => {
    const res = runCli([
      "--",
      "--id",
      "test-omega",
      "--name",
      "Omega Synthétique",
      "--party",
      "Parti Placeholder",
      "--party-id",
      "test-omega",
      "--date",
      "2027-11-01",
      "--is-fictional",
    ]);

    expect(res.status, `stderr: ${res.stderr}`).toBe(0);
    const metaPath = join(
      cliTmpDir,
      "candidates",
      "test-omega",
      "metadata.json",
    );
    const meta = JSON.parse(await readFile(metaPath, "utf-8"));
    expect(meta.is_fictional).toBe(true);
  }, 30_000);
});
