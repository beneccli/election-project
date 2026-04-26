// See docs/specs/website/methodology-page.md §2 (editorial contract)
// and §7.1-2 (regression test).
//
// Last-line-of-defense regression test for the /methodologie page.
// The page is the surface most exposed to advocacy drift, so we
// enforce three properties:
//
//   1. Static source scan: forbidden vocabulary never appears in any
//      methodology source file or i18n string referenced by the page.
//   2. Anchor parity: every required section ID is present in both
//      the FR and EN exported HTML, and the two locales agree on the
//      set of IDs they expose.
//   3. No candidate names: methodology copy never mentions any
//      `display_name` from `candidates/<id>/metadata.json`. The
//      methodology page is candidate-agnostic by contract.
//
// The post-build smoke is skipped when `out/` is missing so that
// pre-build test runs don't fail spuriously.

import * as fs from "node:fs";
import * as path from "node:path";
import { describe, expect, it } from "vitest";
import { UI_STRINGS } from "@/lib/i18n";
import { METHODOLOGY_SECTION_IDS } from "@/lib/methodology-content";

// Combined forbidden list — superset of the comparison and landing
// guardrails. Mirrors the lists in
// `site/app/comparer/comparison-editorial.test.tsx` and
// `site/app/__tests__/landing-editorial.test.tsx`. Update both
// neighbouring tests if you extend this list — the editorial spec is
// site-wide, not per-page.
const FORBIDDEN: readonly string[] = [
  "gagnant",
  "winner",
  "vainqueur",
  "classement",
  "classement général",
  "score global",
  "meilleur candidat",
  "best candidate",
  "catastrophique",
  "désastre",
  "disaster",
  "crise",
];

const HERE = __dirname;
const SITE_ROOT = path.resolve(HERE, "..", "..");
const METHODOLOGY_COMPONENTS_DIR = path.resolve(
  SITE_ROOT,
  "components",
  "methodology",
);
const METHODOLOGY_PAGE_BODY = path.resolve(
  SITE_ROOT,
  "components",
  "pages",
  "MethodologyPageBody.tsx",
);
const METHODOLOGY_CONTENT = path.resolve(
  SITE_ROOT,
  "lib",
  "methodology-content.ts",
);

function listSourceFiles(dir: string): string[] {
  const out: string[] = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      out.push(...listSourceFiles(path.join(dir, entry.name)));
      continue;
    }
    if (!entry.isFile()) continue;
    if (entry.name.endsWith(".test.ts") || entry.name.endsWith(".test.tsx")) {
      continue;
    }
    if (/\.(t|j)sx?$/.test(entry.name)) {
      out.push(path.join(dir, entry.name));
    }
  }
  return out;
}

describe("methodology-editorial — static source scan", () => {
  const files = [
    ...listSourceFiles(METHODOLOGY_COMPONENTS_DIR),
    METHODOLOGY_PAGE_BODY,
    METHODOLOGY_CONTENT,
  ].filter((f) => fs.existsSync(f));

  it("finds methodology source files to scan", () => {
    expect(files.length).toBeGreaterThan(0);
  });

  for (const word of FORBIDDEN) {
    it(`no methodology source file contains forbidden word: "${word}"`, () => {
      const hits: string[] = [];
      const needle = word.toLowerCase();
      for (const file of files) {
        const body = fs.readFileSync(file, "utf8").toLowerCase();
        if (body.includes(needle)) {
          hits.push(path.relative(SITE_ROOT, file));
        }
      }
      expect(hits).toEqual([]);
    });
  }
});

describe("methodology-editorial — i18n string scan", () => {
  // Every METHODOLOGY_* and META_METHODOLOGIE_* UI string, in both
  // languages, must be free of forbidden vocabulary. We scan the
  // resolved string values rather than the source file so that we
  // catch words however they're authored.
  const methodologyEntries = Object.entries(UI_STRINGS).filter(
    ([key]) => key.startsWith("METHODOLOGY_") || key.startsWith("META_METHODOLOGIE_"),
  );

  it("scan covers a meaningful set of strings", () => {
    expect(methodologyEntries.length).toBeGreaterThan(20);
  });

  for (const word of FORBIDDEN) {
    it(`no methodology UI string contains forbidden word: "${word}"`, () => {
      const hits: string[] = [];
      const needle = word.toLowerCase();
      for (const [key, val] of methodologyEntries) {
        for (const lang of ["fr", "en"] as const) {
          const text = (val as { fr: string; en: string })[lang].toLowerCase();
          if (text.includes(needle)) {
            hits.push(`${key} (${lang})`);
          }
        }
      }
      expect(hits).toEqual([]);
    });
  }
});

describe("methodology-editorial — candidate-agnostic", () => {
  // Methodology page must never mention a specific candidate by name.
  const candidatesRoot = path.resolve(SITE_ROOT, "..", "candidates");

  function loadCandidateDisplayNames(): string[] {
    if (!fs.existsSync(candidatesRoot)) return [];
    const names: string[] = [];
    for (const entry of fs.readdirSync(candidatesRoot, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const metaPath = path.join(candidatesRoot, entry.name, "metadata.json");
      if (!fs.existsSync(metaPath)) continue;
      try {
        const meta = JSON.parse(fs.readFileSync(metaPath, "utf8"));
        if (typeof meta.display_name === "string" && meta.display_name.trim()) {
          names.push(meta.display_name.trim());
        }
      } catch {
        // Skip unreadable metadata.
      }
    }
    return names;
  }

  const names = loadCandidateDisplayNames();

  it("loads at least one candidate display_name", () => {
    expect(names.length).toBeGreaterThan(0);
  });

  // Scan the resolved methodology UI strings for each candidate name.
  it("no methodology UI string mentions any candidate display_name", () => {
    const methodologyEntries = Object.entries(UI_STRINGS).filter(([key]) =>
      key.startsWith("METHODOLOGY_") || key.startsWith("META_METHODOLOGIE_"),
    );
    const hits: string[] = [];
    for (const [key, val] of methodologyEntries) {
      for (const lang of ["fr", "en"] as const) {
        const text = (val as { fr: string; en: string })[lang];
        for (const name of names) {
          if (text.includes(name)) {
            hits.push(`${key} (${lang}) mentions "${name}"`);
          }
        }
      }
    }
    expect(hits).toEqual([]);
  });
});

describe("methodology-editorial — post-build smoke", () => {
  const frHtml = path.resolve(SITE_ROOT, "out", "methodologie", "index.html");
  const enHtml = path.resolve(SITE_ROOT, "out", "en", "methodologie", "index.html");

  it.skipIf(!fs.existsSync(frHtml) || !fs.existsSync(enHtml))(
    "both /methodologie and /en/methodologie are present in the export",
    () => {
      expect(fs.existsSync(frHtml)).toBe(true);
      expect(fs.existsSync(enHtml)).toBe(true);
    },
  );

  for (const word of FORBIDDEN) {
    it.skipIf(!fs.existsSync(frHtml))(
      `FR export contains no forbidden word: "${word}"`,
      () => {
        const html = fs.readFileSync(frHtml, "utf8").toLowerCase();
        expect(html).not.toContain(word.toLowerCase());
      },
    );
    it.skipIf(!fs.existsSync(enHtml))(
      `EN export contains no forbidden word: "${word}"`,
      () => {
        const html = fs.readFileSync(enHtml, "utf8").toLowerCase();
        expect(html).not.toContain(word.toLowerCase());
      },
    );
  }

  it.skipIf(!fs.existsSync(frHtml) || !fs.existsSync(enHtml))(
    "both locales expose every required section anchor",
    () => {
      const fr = fs.readFileSync(frHtml, "utf8");
      const en = fs.readFileSync(enHtml, "utf8");
      for (const id of METHODOLOGY_SECTION_IDS) {
        expect(fr, `FR missing #${id}`).toContain(`id="${id}"`);
        expect(en, `EN missing #${id}`).toContain(`id="${id}"`);
      }
    },
  );

  it.skipIf(!fs.existsSync(frHtml) || !fs.existsSync(enHtml))(
    "FR and EN agree on the set of section anchors",
    () => {
      const fr = fs.readFileSync(frHtml, "utf8");
      const en = fs.readFileSync(enHtml, "utf8");
      const found = (html: string) =>
        new Set(
          METHODOLOGY_SECTION_IDS.filter((id) => html.includes(`id="${id}"`)),
        );
      const frIds = [...found(fr)].sort();
      const enIds = [...found(en)].sort();
      expect(frIds).toEqual(enIds);
    },
  );
});
