import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { scaffoldCandidate } from "./scaffold-candidate";
import { mkdtemp, rm, readFile, access } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import * as pathsMod from "./lib/paths";

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
});
