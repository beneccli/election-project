// See docs/specs/analysis/editorial-principles.md §"comparison page".
// See docs/specs/website/comparison-page.md §6 (editorial guardrails).
//
// Last-line-of-defense regression test. The /comparer page must never
// rank candidates or suggest a winner — the site reports tradeoffs, the
// reader forms a verdict. This test enforces the guardrail in two
// complementary ways:
//
//   1. Static source scan across every comparison component file and
//      the /comparer route itself. Catches forbidden vocabulary the
//      moment it lands in the repo.
//   2. Post-build smoke on `site/out/comparer.html` when it exists.
//      Catches anything injected by runtime code paths or i18n
//      resources. Skipped when the static export has not been built
//      yet (pre-build test runs).
//
// Forbidden list mirrors the spec: words that presuppose an ordering
// over candidates as a whole. Per-dimension "meilleur" comparisons are
// NOT permitted either, so "meilleur candidat" is included.

import * as fs from "node:fs";
import * as path from "node:path";
import { describe, expect, it } from "vitest";

const FORBIDDEN: readonly string[] = [
  "gagnant",
  "winner",
  "vainqueur",
  "classement général",
  "score global",
  "meilleur candidat",
  "best candidate",
];

const COMPARISON_DIR = path.resolve(__dirname, "../../components/comparison");
const ROUTE_DIR = path.resolve(__dirname);

function listSourceFiles(dir: string): string[] {
  const out: string[] = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      out.push(...listSourceFiles(path.join(dir, entry.name)));
      continue;
    }
    if (!entry.isFile()) continue;
    // Don't scan the test file itself — it contains the forbidden
    // vocabulary as string literals on purpose.
    if (entry.name.endsWith(".test.ts") || entry.name.endsWith(".test.tsx")) {
      continue;
    }
    if (/\.(t|j)sx?$/.test(entry.name)) {
      out.push(path.join(dir, entry.name));
    }
  }
  return out;
}

describe("comparison-editorial — static source scan", () => {
  const files = [
    ...listSourceFiles(COMPARISON_DIR),
    ...listSourceFiles(ROUTE_DIR),
  ];

  it("finds at least one comparison source file to scan", () => {
    // Sanity: if the glob breaks, the test would vacuously pass.
    expect(files.length).toBeGreaterThan(0);
  });

  for (const word of FORBIDDEN) {
    it(`no comparison source file contains forbidden word: "${word}"`, () => {
      const hits: string[] = [];
      const needle = word.toLowerCase();
      for (const file of files) {
        const body = fs.readFileSync(file, "utf8").toLowerCase();
        if (body.includes(needle)) {
          hits.push(path.relative(path.resolve(__dirname, "../.."), file));
        }
      }
      expect(hits).toEqual([]);
    });
  }
});

describe("comparison-editorial — post-build smoke", () => {
  // Next.js static export writes /comparer as a folder: out/comparer/index.html
  const htmlPath = path.resolve(__dirname, "../../out/comparer/index.html");

  it.skipIf(!fs.existsSync(htmlPath))(
    "the exported /comparer/index.html contains no forbidden vocabulary",
    () => {
      const html = fs.readFileSync(htmlPath, "utf8").toLowerCase();
      for (const word of FORBIDDEN) {
        expect(html, `forbidden word "${word}" found in comparer.html`).not.toContain(
          word.toLowerCase(),
        );
      }
    },
  );

  it.skipIf(!fs.existsSync(htmlPath))(
    "comparer/index.html embeds every analyzable candidate id in its projection payload",
    async () => {
      const html = fs.readFileSync(htmlPath, "utf8");
      const { listCandidates } = await import("@/lib/candidates");
      const ids = listCandidates().map((c) => c.id);
      expect(ids.length).toBeGreaterThan(0);
      for (const id of ids) {
        expect(html, `candidate id "${id}" missing from comparer/index.html`).toContain(
          id,
        );
      }
    },
  );

  it.skipIf(!fs.existsSync(htmlPath))(
    "no aria-label or title on the exported page contains ranking language",
    () => {
      const html = fs.readFileSync(htmlPath, "utf8");
      // Extract every aria-label / title attribute and check the set.
      const ariaLabels = [
        ...html.matchAll(/aria-label="([^"]*)"/gi),
      ].map((m) => m[1].toLowerCase());
      const titles = [...html.matchAll(/title="([^"]*)"/gi)].map((m) =>
        m[1].toLowerCase(),
      );
      const attrs = [...ariaLabels, ...titles];
      for (const attr of attrs) {
        for (const word of FORBIDDEN) {
          expect(
            attr,
            `ranking vocabulary "${word}" found in aria-label/title: ${attr}`,
          ).not.toContain(word.toLowerCase());
        }
      }
    },
  );
});
