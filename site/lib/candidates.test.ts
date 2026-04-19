// See docs/specs/website/nextjs-architecture.md §2
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  CandidateDataError,
  listCandidates,
  loadCandidate,
} from "./candidates";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REAL_CANDIDATES_DIR = path.resolve(HERE, "..", "..", "candidates");
const REAL_OMEGA_DIR = path.join(REAL_CANDIDATES_DIR, "test-omega");
const REAL_OMEGA_VERSION = "2027-11-01";

function withCandidatesDir<T>(dir: string, fn: () => T): T {
  const prev = process.env.CANDIDATES_DIR;
  process.env.CANDIDATES_DIR = dir;
  try {
    return fn();
  } finally {
    if (prev === undefined) delete process.env.CANDIDATES_DIR;
    else process.env.CANDIDATES_DIR = prev;
  }
}

/**
 * Build a minimal tmp candidates/ tree containing a `test-omega` entry whose
 * `current/` directory holds the aggregated.json + metadata.json required
 * by the loader. Deliberately does NOT copy the full real tree so
 * destructive mutations stay safely scoped inside the tmp dir.
 */
function buildTmpFixture(): { dir: string; omegaDir: string } {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "e27-loader-"));
  const omegaDir = path.join(dir, "test-omega");
  const currentDir = path.join(omegaDir, "current");
  fs.mkdirSync(currentDir, { recursive: true });

  fs.copyFileSync(
    path.join(REAL_OMEGA_DIR, "metadata.json"),
    path.join(omegaDir, "metadata.json"),
  );
  for (const name of ["aggregated.json", "metadata.json"]) {
    fs.copyFileSync(
      path.join(REAL_OMEGA_DIR, "current", name),
      path.join(currentDir, name),
    );
  }
  return { dir, omegaDir };
}

describe("listCandidates", () => {
  it("returns test-omega from the real candidates directory", () => {
    const entries = withCandidatesDir(REAL_CANDIDATES_DIR, () =>
      listCandidates(),
    );
    const ids = entries.map((e) => e.id);
    expect(ids).toContain("test-omega");
    const omega = entries.find((e) => e.id === "test-omega");
    expect(omega?.isFictional).toBe(true);
    expect(omega?.displayName.length).toBeGreaterThan(0);
    expect(omega?.versionDate).toBe(REAL_OMEGA_VERSION);
  });

  it("filters fictional candidates when EXCLUDE_FICTIONAL=1", () => {
    const prev = process.env.EXCLUDE_FICTIONAL;
    process.env.EXCLUDE_FICTIONAL = "1";
    try {
      const entries = withCandidatesDir(REAL_CANDIDATES_DIR, () =>
        listCandidates(),
      );
      expect(entries.find((e) => e.id === "test-omega")).toBeUndefined();
    } finally {
      if (prev === undefined) delete process.env.EXCLUDE_FICTIONAL;
      else process.env.EXCLUDE_FICTIONAL = prev;
    }
  });

  it("skips directories with no current/aggregated.json", () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "e27-loader-"));
    fs.mkdirSync(path.join(tmp, "empty-cand"));
    fs.writeFileSync(
      path.join(tmp, "empty-cand", "metadata.json"),
      JSON.stringify({
        id: "empty-cand",
        display_name: "Empty",
        party: "Neutre",
        party_id: "neutre",
        created: "2027-01-01",
        updated: "2027-01-01",
      }),
    );
    try {
      const entries = withCandidatesDir(tmp, () => listCandidates());
      expect(entries).toHaveLength(0);
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });
});

describe("loadCandidate", () => {
  let tmp = "";

  beforeEach(() => {
    tmp = buildTmpFixture().dir;
  });

  afterEach(() => {
    if (tmp) fs.rmSync(tmp, { recursive: true, force: true });
  });

  it("returns a valid bundle for test-omega", () => {
    const bundle = withCandidatesDir(tmp, () => loadCandidate("test-omega"));
    expect(bundle.meta.id).toBe("test-omega");
    expect(bundle.aggregated.candidate_id).toBe("test-omega");
    expect(bundle.rawSummaries.length).toBeGreaterThan(0);
    expect(bundle.versionMeta.candidate_id).toBe("test-omega");
  });

  it("throws CandidateDataError when aggregated.json is missing", () => {
    const aggPath = path.join(tmp, "test-omega", "current", "aggregated.json");
    fs.rmSync(aggPath, { force: true });
    expect(() =>
      withCandidatesDir(tmp, () => loadCandidate("test-omega")),
    ).toThrow(CandidateDataError);
  });

  it("throws with zodIssues on schema drift", () => {
    const aggPath = path.join(tmp, "test-omega", "current", "aggregated.json");
    const raw = JSON.parse(fs.readFileSync(aggPath, "utf8"));
    raw.candidate_id = 42; // wrong type
    fs.writeFileSync(aggPath, JSON.stringify(raw));
    try {
      withCandidatesDir(tmp, () => loadCandidate("test-omega"));
      expect.fail("expected CandidateDataError");
    } catch (err) {
      expect(err).toBeInstanceOf(CandidateDataError);
      const e = err as CandidateDataError;
      expect(e.zodIssues).toBeDefined();
      expect(e.zodIssues!.length).toBeGreaterThan(0);
    }
  });
});
