/**
 * Dual-locale build smoke + denylist lint for translated artifacts.
 *
 * Spec: docs/specs/website/i18n.md §3.3, task 0128.
 *
 * Test_command: `npm run build --workspace site && npm run test:integration`
 * — the site build runs first; this suite asserts that the resulting
 * `site/out/` directory contains both FR and EN candidate pages, that
 * the EN page for a candidate WITH a translation contains translated
 * prose, that the EN page for a candidate WITHOUT a translation
 * contains the fallback banner, and that no advocacy verb has been
 * smuggled into any committed `aggregated.<lang>.json`.
 */
import { describe, it, expect } from "vitest";
import { readFile, access, readdir } from "node:fs/promises";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");
const OUT_DIR = join(REPO_ROOT, "site/out");

const TRANSLATED_CANDIDATE = "test-omega";
// Any published candidate that has aggregated.json but no
// aggregated.en.json. Picked at runtime so the test stays robust as
// candidates gain translations.
async function pickFallbackCandidate(): Promise<string> {
  const candidatesDir = join(REPO_ROOT, "candidates");
  const ids = await readdir(candidatesDir);
  for (const id of ids) {
    if (id === TRANSLATED_CANDIDATE) continue;
    const currentLink = join(candidatesDir, id, "current");
    try {
      const fr = join(currentLink, "aggregated.json");
      const en = join(currentLink, "aggregated.en.json");
      await access(fr);
      try {
        await access(en);
        // Has EN translation — skip.
        continue;
      } catch {
        return id;
      }
    } catch {
      // No aggregated.json for this candidate.
    }
  }
  throw new Error(
    "no published candidate without an EN translation found — fallback test cannot run",
  );
}

describe("dual-locale build smoke", () => {
  it("validate-translation passes for test-omega/en", () => {
    // Use execFileSync so the test fails loudly if the validator does.
    const out = execFileSync(
      "npm",
      [
        "run",
        "validate-translation",
        "--",
        "--candidate",
        TRANSLATED_CANDIDATE,
        "--version",
        "2027-11-01",
        "--lang",
        "en",
      ],
      { cwd: REPO_ROOT, encoding: "utf-8" },
    );
    expect(out).toMatch(/passes parity check/);
  });

  it("FR and EN candidate pages exist after build", async () => {
    const frPath = join(OUT_DIR, `candidat/${TRANSLATED_CANDIDATE}/index.html`);
    const enPath = join(
      OUT_DIR,
      `en/candidat/${TRANSLATED_CANDIDATE}/index.html`,
    );
    await access(frPath);
    await access(enPath);
    const fr = await readFile(frPath, "utf-8");
    const en = await readFile(enPath, "utf-8");
    expect(fr.length).toBeGreaterThan(1000);
    expect(en.length).toBeGreaterThan(1000);
  });

  it("EN page for translated candidate contains EN prose (not the FR summary)", async () => {
    const enPath = join(
      OUT_DIR,
      `en/candidat/${TRANSLATED_CANDIDATE}/index.html`,
    );
    const en = await readFile(enPath, "utf-8");
    // A distinctive EN substring from our translation overrides.
    expect(en).toMatch(/Omega Synth.+tique.+program proposes/i);
  });

  it("EN page for an untranslated candidate renders the fallback banner", async () => {
    const fallbackId = await pickFallbackCandidate();
    const enPath = join(OUT_DIR, `en/candidat/${fallbackId}/index.html`);
    const en = await readFile(enPath, "utf-8");
    // UI_STRINGS.TRANSLATION_FALLBACK_TITLE.en
    expect(en).toContain("Translation pending");
  });
});

describe("translation denylist lint", () => {
  // Advocacy verbs that should never appear in a translated artifact.
  // See docs/specs/analysis/editorial-principles.md §3 and task 0128.
  const DENY = /\b(sacrifice|betray|steal|crush|rescue)\b/i;

  it("no committed aggregated.<lang>.json contains advocacy verbs", async () => {
    const candidatesDir = join(REPO_ROOT, "candidates");
    const ids = await readdir(candidatesDir);
    const offenders: string[] = [];
    for (const id of ids) {
      const versionsDir = join(candidatesDir, id, "versions");
      let versions: string[];
      try {
        versions = await readdir(versionsDir);
      } catch {
        continue;
      }
      for (const v of versions) {
        const verDir = join(versionsDir, v);
        let entries: string[];
        try {
          entries = await readdir(verDir);
        } catch {
          continue;
        }
        for (const file of entries) {
          if (!/^aggregated\.[a-z]{2}\.json$/.test(file)) continue;
          const content = await readFile(join(verDir, file), "utf-8");
          if (DENY.test(content)) {
            offenders.push(`${id}/${v}/${file}`);
          }
        }
      }
    }
    expect(offenders).toEqual([]);
  });
});
