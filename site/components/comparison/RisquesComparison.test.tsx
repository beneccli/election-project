// See docs/specs/website/comparison-page.md §4 (Risques).
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import * as fs from "node:fs";
import * as path from "node:path";
import {
  RISK_CATEGORY_KEYS,
  type ComparisonProjection,
  type RiskLevelIndex,
} from "@/lib/derived/comparison-projection";
import { DIMENSION_KEYS } from "@/lib/derived/keys";
import { RisquesStack } from "./RisquesComparison";

function makeProjection(
  id: string,
  name: string,
  risks: Partial<ComparisonProjection["risks"]> = {},
): ComparisonProjection {
  const dimGrades = Object.fromEntries(
    DIMENSION_KEYS.map((k) => [k, "C" as const]),
  ) as ComparisonProjection["dimGrades"];
  const defaultRisks = Object.fromEntries(
    DIMENSION_KEYS.map((k) => [
      k,
      [-1, -1, -1, -1] as RiskLevelIndex[],
    ]),
  ) as ComparisonProjection["risks"];
  return {
    id,
    displayName: name,
    party: "Parti Exemple",
    partyShort: "PEX",
    updatedAt: "2026-01-01T00:00:00Z",
    versionDate: "2026-01-01",
    isFictional: true,
    analyzable: true,
    overallGrade: "C",
    overallGradeModifier: null,
    positioning: [0, 0, 0, 0, 0],
    dimGrades,
    risks: { ...defaultRisks, ...risks },
    intergen: {
      pensions: 0,
      public_debt: 0,
      climate: 0,
      health: 0,
      education: 0,
      housing: 0,
    },
  };
}

describe("RisquesStack", () => {
  it("renders one block per selected candidate in URL order", () => {
    const a = makeProjection("alpha", "Alpha");
    const b = makeProjection("bravo", "Bravo");
    const c = makeProjection("charlie", "Charlie");
    const html = renderToStaticMarkup(
      <RisquesStack selected={[a, b, c]} lang="fr" />,
    );
    const matches = [...html.matchAll(/data-candidate="([^"]+)"/g)].map(
      (m) => m[1],
    );
    expect(matches).toEqual(["alpha", "bravo", "charlie"]);
  });

  it("each block has DIMENSION_KEYS × RISK_CATEGORY_KEYS cells", () => {
    const a = makeProjection("a", "Alpha");
    const b = makeProjection("b", "Beta");
    const html = renderToStaticMarkup(
      <RisquesStack selected={[a, b]} lang="fr" />,
    );
    // Each cell carries data-dim and data-cat.
    const cells = html.match(/data-dim="/g) ?? [];
    expect(cells.length).toBe(
      DIMENSION_KEYS.length * RISK_CATEGORY_KEYS.length * 2,
    );
  });

  it("renders every level label (Low..High) when fixtures cover them", () => {
    const fullLevels = DIMENSION_KEYS.reduce(
      (acc, dk, i) => {
        // Spread 0..3 across categories deterministically.
        acc[dk] = [
          (i % 4) as RiskLevelIndex,
          ((i + 1) % 4) as RiskLevelIndex,
          ((i + 2) % 4) as RiskLevelIndex,
          ((i + 3) % 4) as RiskLevelIndex,
        ];
        return acc;
      },
      {} as ComparisonProjection["risks"],
    );
    const a = makeProjection("a", "Alpha", fullLevels);
    const html = renderToStaticMarkup(
      <RisquesStack selected={[a, a]} lang="fr" />,
    );
    expect(html).toContain("Faible");
    expect(html).toContain("Limité");
    expect(html).toContain("Modéré");
    expect(html).toContain("Élevé");
  });

  it("renders '?' for unknown (levelIndex = -1) cells", () => {
    const a = makeProjection("a", "Alpha");
    const b = makeProjection("b", "Beta");
    const html = renderToStaticMarkup(
      <RisquesStack selected={[a, b]} lang="fr" />,
    );
    // Default fixture is all -1.
    expect(html).toContain("Niveau inconnu");
  });

  it("uses English labels when lang='en'", () => {
    const fullLevels = DIMENSION_KEYS.reduce(
      (acc, dk, i) => {
        acc[dk] = [
          (i % 4) as RiskLevelIndex,
          ((i + 1) % 4) as RiskLevelIndex,
          ((i + 2) % 4) as RiskLevelIndex,
          ((i + 3) % 4) as RiskLevelIndex,
        ];
        return acc;
      },
      {} as ComparisonProjection["risks"],
    );
    const a = makeProjection("a", "Alpha", fullLevels);
    const b = makeProjection("b", "Beta", fullLevels);
    const html = renderToStaticMarkup(
      <RisquesStack selected={[a, b]} lang="en" />,
    );
    expect(html).toContain("Low");
    expect(html).toContain("Limited");
    expect(html).toContain("Moderate");
    expect(html).toContain("High");
    expect(html).toContain("Risks"); // heading
    expect(html).toContain("Budgetary"); // category
  });

  it("does not introduce composite scoring vocabulary", () => {
    // The comparison Risques block must not rank candidates by total or
    // average risk.
    const src = fs.readFileSync(
      path.resolve(__dirname, "RisquesComparison.tsx"),
      "utf8",
    );
    expect(src).not.toMatch(/\bgagnant\b/i);
    expect(src).not.toMatch(/\bwinner\b/i);
    expect(src).not.toMatch(/\bmean\s*\(/);
    expect(src).not.toMatch(/\baverage\s*\(/);
    expect(src).not.toMatch(/\bclassement\b/i);
    // No arithmetic reduction over risk cells.
    expect(src).not.toMatch(/\.reduce\s*\(/);
  });

  it("blocks links to /candidat/<id>#risques for drill-through", () => {
    const a = makeProjection("alpha", "Alpha Beta");
    const b = makeProjection("bravo", "Bravo");
    const html = renderToStaticMarkup(
      <RisquesStack selected={[a, b]} lang="fr" />,
    );
    expect(html).toContain('href="/candidat/alpha#risques"');
    expect(html).toContain('href="/candidat/bravo#risques"');
    // First-name only in the header.
    expect(html).toMatch(/>Alpha</);
  });
});
