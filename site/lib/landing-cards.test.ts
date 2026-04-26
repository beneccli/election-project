// See docs/specs/website/landing-page.md §3.1, §4.2, §4.3
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  deriveFamilyBucket,
  listLandingCards,
  sortLandingCards,
  type LandingCard,
} from "./landing-cards";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OMEGA_ROOT = path.resolve(HERE, "..", "..", "candidates", "test-omega");

describe("deriveFamilyBucket", () => {
  it("honors the ecologie override above everything else", () => {
    expect(deriveFamilyBucket("present", "droite", "ecologie")).toBe("ecologie");
    expect(deriveFamilyBucket("split", null, "ecologie")).toBe("ecologie");
    expect(deriveFamilyBucket("absent", null, "ecologie")).toBe("ecologie");
  });

  it("maps the three left enum values to 'gauche'", () => {
    expect(deriveFamilyBucket("present", "extreme_gauche", undefined)).toBe("gauche");
    expect(deriveFamilyBucket("present", "gauche", undefined)).toBe("gauche");
    expect(deriveFamilyBucket("present", "centre_gauche", undefined)).toBe("gauche");
  });

  it("maps centre to 'centre'", () => {
    expect(deriveFamilyBucket("present", "centre", undefined)).toBe("centre");
  });

  it("maps the three right enum values to 'droite'", () => {
    expect(deriveFamilyBucket("present", "centre_droit", undefined)).toBe("droite");
    expect(deriveFamilyBucket("present", "droite", undefined)).toBe("droite");
    expect(deriveFamilyBucket("present", "extreme_droite", undefined)).toBe("droite");
  });

  it("returns null for split / inclassable / absent without override", () => {
    expect(deriveFamilyBucket("split", null, undefined)).toBeNull();
    expect(deriveFamilyBucket("inclassable", "inclassable", undefined)).toBeNull();
    expect(deriveFamilyBucket("absent", null, undefined)).toBeNull();
  });
});

describe("sortLandingCards", () => {
  const base = {
    party: "X",
    partyShort: "X",
    partyColor: "",
    family: null,
    isFictional: false,
    availableLocales: ["fr"],
    translation: { lang: "fr", status: "native_fr" },
  } as const;

  it("orders by updatedAt desc then displayName asc", () => {
    const cards: LandingCard[] = [
      {
        ...base,
        id: "a",
        status: "pending",
        displayName: "Zoe",
        declaredDate: null,
        updatedAt: "2026-01-01",
      } as LandingCard,
      {
        ...base,
        id: "b",
        status: "pending",
        displayName: "Alice",
        declaredDate: null,
        updatedAt: "2026-02-01",
      } as LandingCard,
      {
        ...base,
        id: "c",
        status: "pending",
        displayName: "Bob",
        declaredDate: null,
        updatedAt: "2026-02-01",
      } as LandingCard,
    ];
    const sorted = sortLandingCards(cards).map((c) => c.id);
    expect(sorted).toEqual(["b", "c", "a"]);
  });
});

describe("listLandingCards (filesystem)", () => {
  let tmpDir: string;
  const OLD_ENV = process.env.CANDIDATES_DIR;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "landing-cards-"));
    process.env.CANDIDATES_DIR = tmpDir;
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    if (OLD_ENV === undefined) delete process.env.CANDIDATES_DIR;
    else process.env.CANDIDATES_DIR = OLD_ENV;
  });

  function makePending(id: string, displayName: string, updated: string): void {
    const dir = path.join(tmpDir, id);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(
      path.join(dir, "metadata.json"),
      JSON.stringify({
        id,
        display_name: displayName,
        party: "Parti Test",
        party_id: "test",
        created: "2025-01-01",
        updated,
      }),
    );
  }

  function copyAnalyzed(id: string, updated: string): void {
    const dir = path.join(tmpDir, id);
    fs.mkdirSync(path.join(dir, "current"), { recursive: true });
    // Root metadata with the desired updated timestamp
    fs.writeFileSync(
      path.join(dir, "metadata.json"),
      JSON.stringify({
        id,
        display_name: "Omega Copy",
        party: "Parti Synthétique",
        party_id: "synth",
        created: "2025-01-01",
        updated,
        is_fictional: true,
      }),
    );
    // Copy current/* from test-omega (aggregated.json + per-version metadata.json)
    for (const entry of fs.readdirSync(path.join(OMEGA_ROOT, "current"))) {
      const src = path.join(OMEGA_ROOT, "current", entry);
      const dst = path.join(dir, "current", entry);
      const stat = fs.statSync(src);
      if (stat.isDirectory()) {
        fs.cpSync(src, dst, { recursive: true });
      } else {
        fs.copyFileSync(src, dst);
      }
    }
  }

  it("returns an empty list when the candidates dir is empty", () => {
    expect(listLandingCards()).toEqual([]);
  });

  it("emits pending rows for candidates without aggregated.json", () => {
    makePending("alpha", "Alpha", "2026-03-01");
    makePending("bravo", "Bravo", "2026-04-01");
    const cards = listLandingCards();
    expect(cards).toHaveLength(2);
    expect(cards.every((c) => c.status === "pending")).toBe(true);
    // Ordered by updatedAt desc
    expect(cards.map((c) => c.id)).toEqual(["bravo", "alpha"]);
  });

  it("emits analyzed rows for candidates with a valid aggregated.json", () => {
    copyAnalyzed("omega-copy", "2026-05-01");
    const cards = listLandingCards();
    expect(cards).toHaveLength(1);
    expect(cards[0].status).toBe("analyzed");
    if (cards[0].status === "analyzed") {
      expect(cards[0].modelsCount).toBeGreaterThan(0);
      expect(["A", "B", "C", "D", "F"]).toContain(cards[0].overallGrade);
    }
  });

  it("interleaves analyzed and pending rows by updatedAt desc", () => {
    makePending("late-pending", "Late Pending", "2026-09-01");
    copyAnalyzed("mid-analyzed", "2026-06-01");
    makePending("early-pending", "Early", "2026-01-01");
    const ids = listLandingCards().map((c) => c.id);
    expect(ids).toEqual(["late-pending", "mid-analyzed", "early-pending"]);
  });

  it("falls back to a pending row when aggregated.json is broken", () => {
    copyAnalyzed("broken", "2026-07-01");
    // Corrupt the aggregated.json
    fs.writeFileSync(
      path.join(tmpDir, "broken", "current", "aggregated.json"),
      "{not valid json",
    );
    const cards = listLandingCards();
    expect(cards).toHaveLength(1);
    expect(cards[0].status).toBe("pending");
  });

  it("skips fictional candidates when EXCLUDE_FICTIONAL=1", () => {
    copyAnalyzed("fake", "2026-07-01"); // is_fictional: true
    makePending("real", "Real", "2026-08-01");
    process.env.EXCLUDE_FICTIONAL = "1";
    try {
      const cards = listLandingCards();
      expect(cards.map((c) => c.id)).toEqual(["real"]);
    } finally {
      delete process.env.EXCLUDE_FICTIONAL;
    }
  });
});

describe("listLandingCards (locale-aware)", () => {
  let tmpDir: string;
  const OLD_ENV = process.env.CANDIDATES_DIR;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "landing-cards-locale-"));
    process.env.CANDIDATES_DIR = tmpDir;
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    if (OLD_ENV === undefined) delete process.env.CANDIDATES_DIR;
    else process.env.CANDIDATES_DIR = OLD_ENV;
  });

  function seedOmega(id: string): string {
    const dir = path.join(tmpDir, id);
    fs.mkdirSync(path.join(dir, "current"), { recursive: true });
    fs.writeFileSync(
      path.join(dir, "metadata.json"),
      JSON.stringify({
        id,
        display_name: "Omega",
        party: "Parti Synthétique",
        party_id: "synth",
        created: "2025-01-01",
        updated: "2026-05-01",
        is_fictional: true,
      }),
    );
    for (const entry of fs.readdirSync(path.join(OMEGA_ROOT, "current"))) {
      // Locale-aware tests seed a baseline FR-only candidate; skip any
      // committed translation artifacts so the "missing" scenario is real.
      if (/^aggregated\.[a-z]{2}\.json$/.test(entry)) continue;
      const src = path.join(OMEGA_ROOT, "current", entry);
      const dst = path.join(dir, "current", entry);
      const stat = fs.statSync(src);
      if (stat.isDirectory()) fs.cpSync(src, dst, { recursive: true });
      else fs.copyFileSync(src, dst);
    }
    return dir;
  }

  it("defaults to native_fr translation status when lang is fr", () => {
    seedOmega("omega-fr");
    const cards = listLandingCards("fr");
    expect(cards).toHaveLength(1);
    expect(cards[0].translation).toEqual({ lang: "fr", status: "native_fr" });
  });

  it("marks translation as missing when no aggregated.<lang>.json exists", () => {
    seedOmega("omega-en-missing");
    const cards = listLandingCards("en");
    expect(cards).toHaveLength(1);
    expect(cards[0].translation).toEqual({ lang: "en", status: "missing" });
  });

  it("marks translation as available when aggregated.<lang>.json exists", () => {
    const dir = seedOmega("omega-en-available");
    fs.copyFileSync(
      path.join(dir, "current", "aggregated.json"),
      path.join(dir, "current", "aggregated.en.json"),
    );
    const cards = listLandingCards("en");
    expect(cards).toHaveLength(1);
    expect(cards[0].translation).toEqual({ lang: "en", status: "available" });
  });

  it("propagates lang to pending rows", () => {
    const dir = path.join(tmpDir, "pending-only");
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(
      path.join(dir, "metadata.json"),
      JSON.stringify({
        id: "pending-only",
        display_name: "Pending",
        party: "Parti Test",
        party_id: "test",
        created: "2025-01-01",
        updated: "2026-04-01",
      }),
    );
    const cards = listLandingCards("en");
    expect(cards).toHaveLength(1);
    expect(cards[0].status).toBe("pending");
    expect(cards[0].translation).toEqual({ lang: "en", status: "missing" });
  });
});
