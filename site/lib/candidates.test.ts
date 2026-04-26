// See docs/specs/website/nextjs-architecture.md §2
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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
 *
 * The copied root metadata has the `hidden` flag stripped so the fixture
 * represents a visible candidate; tests that need the hidden behaviour
 * either re-add the flag explicitly or rely on the real candidates dir.
 * See docs/specs/candidates/visibility.md.
 */
function buildTmpFixture(): { dir: string; omegaDir: string } {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "e27-loader-"));
  const omegaDir = path.join(dir, "test-omega");
  const currentDir = path.join(omegaDir, "current");
  fs.mkdirSync(currentDir, { recursive: true });

  const meta = JSON.parse(
    fs.readFileSync(path.join(REAL_OMEGA_DIR, "metadata.json"), "utf8"),
  );
  delete meta.hidden;
  fs.writeFileSync(
    path.join(omegaDir, "metadata.json"),
    JSON.stringify(meta, null, 2),
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
  it("excludes test-omega from the real candidates dir because it is hidden", () => {
    const entries = withCandidatesDir(REAL_CANDIDATES_DIR, () =>
      listCandidates(),
    );
    expect(entries.find((e) => e.id === "test-omega")).toBeUndefined();
  });

  it("returns test-omega when its `hidden` flag is removed (tmp fixture)", () => {
    const { dir } = buildTmpFixture();
    try {
      const entries = withCandidatesDir(dir, () => listCandidates());
      const omega = entries.find((e) => e.id === "test-omega");
      expect(omega).toBeDefined();
      expect(omega?.isFictional).toBe(true);
      expect(omega?.versionDate).toBe(REAL_OMEGA_VERSION);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("excludes a candidate whose metadata sets `hidden: true`", () => {
    const { dir, omegaDir } = buildTmpFixture();
    try {
      const metaPath = path.join(omegaDir, "metadata.json");
      const meta = JSON.parse(fs.readFileSync(metaPath, "utf8"));
      meta.hidden = true;
      fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2));
      const entries = withCandidatesDir(dir, () => listCandidates());
      expect(entries.find((e) => e.id === "test-omega")).toBeUndefined();
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("filters fictional candidates when EXCLUDE_FICTIONAL=1", () => {
    // Use a tmp fixture where test-omega is visible (no `hidden` flag) so
    // we exercise the `is_fictional` filter independently of `hidden`.
    const { dir } = buildTmpFixture();
    const prev = process.env.EXCLUDE_FICTIONAL;
    process.env.EXCLUDE_FICTIONAL = "1";
    try {
      const entries = withCandidatesDir(dir, () => listCandidates());
      expect(entries.find((e) => e.id === "test-omega")).toBeUndefined();
    } finally {
      if (prev === undefined) delete process.env.EXCLUDE_FICTIONAL;
      else process.env.EXCLUDE_FICTIONAL = prev;
      fs.rmSync(dir, { recursive: true, force: true });
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

describe("loadCandidate (locale-aware)", () => {
  let tmp = "";

  beforeEach(() => {
    tmp = buildTmpFixture().dir;
  });

  afterEach(() => {
    if (tmp) fs.rmSync(tmp, { recursive: true, force: true });
  });

  function readAgg(): unknown {
    return JSON.parse(
      fs.readFileSync(
        path.join(tmp, "test-omega", "current", "aggregated.json"),
        "utf8",
      ),
    );
  }

  function writeEnFile(payload: unknown): void {
    fs.writeFileSync(
      path.join(tmp, "test-omega", "current", "aggregated.en.json"),
      JSON.stringify(payload),
    );
  }

  it("defaults to fr with native_fr translation status", () => {
    const bundle = withCandidatesDir(tmp, () => loadCandidate("test-omega"));
    expect(bundle.translation).toEqual({ lang: "fr", status: "native_fr" });
  });

  it("returns native_fr when lang='fr' is explicit", () => {
    const bundle = withCandidatesDir(tmp, () =>
      loadCandidate("test-omega", "fr"),
    );
    expect(bundle.translation).toEqual({ lang: "fr", status: "native_fr" });
  });

  it("falls back to FR canonical with status='missing' when EN file absent", () => {
    const bundle = withCandidatesDir(tmp, () =>
      loadCandidate("test-omega", "en"),
    );
    expect(bundle.translation).toEqual({ lang: "en", status: "missing" });
    // Aggregated payload should be the FR canonical content.
    const fr = readAgg() as { candidate_id: string };
    expect(bundle.aggregated.candidate_id).toBe(fr.candidate_id);
  });

  it("returns the EN file with status='available' when present (parity-clean)", () => {
    // A perfect copy is parity-clean.
    writeEnFile(readAgg());
    const bundle = withCandidatesDir(tmp, () =>
      loadCandidate("test-omega", "en"),
    );
    expect(bundle.translation).toEqual({ lang: "en", status: "available" });
  });

  it("warns (not throws) when EN file has parity drift", () => {
    const fr = readAgg() as Record<string, unknown> & {
      coverage_warning: boolean;
    };
    // Toggle a non-translatable boolean leaf in a schema-valid way.
    const drifted = JSON.parse(JSON.stringify(fr)) as typeof fr;
    drifted.coverage_warning = !fr.coverage_warning;
    writeEnFile(drifted);

    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      const bundle = withCandidatesDir(tmp, () =>
        loadCandidate("test-omega", "en"),
      );
      expect(bundle.translation).toEqual({ lang: "en", status: "available" });
      expect(warnSpy).toHaveBeenCalled();
      const firstCall = warnSpy.mock.calls[0]?.[0] as string;
      expect(firstCall).toMatch(/parity drift/i);
    } finally {
      warnSpy.mockRestore();
    }
  });
});

describe("listCandidates availableLocales", () => {
  let tmp = "";

  beforeEach(() => {
    tmp = buildTmpFixture().dir;
  });

  afterEach(() => {
    if (tmp) fs.rmSync(tmp, { recursive: true, force: true });
  });

  it("returns ['fr'] when only the canonical aggregated.json is present", () => {
    const entries = withCandidatesDir(tmp, () => listCandidates());
    const omega = entries.find((e) => e.id === "test-omega");
    expect(omega?.availableLocales).toEqual(["fr"]);
  });

  it("includes 'en' when aggregated.en.json is present", () => {
    fs.writeFileSync(
      path.join(tmp, "test-omega", "current", "aggregated.en.json"),
      fs.readFileSync(
        path.join(tmp, "test-omega", "current", "aggregated.json"),
        "utf8",
      ),
    );
    const entries = withCandidatesDir(tmp, () => listCandidates());
    const omega = entries.find((e) => e.id === "test-omega");
    expect(omega?.availableLocales).toEqual(["fr", "en"]);
  });
});
