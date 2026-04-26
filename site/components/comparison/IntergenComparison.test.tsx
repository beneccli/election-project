// See docs/specs/website/comparison-page.md §4 (Intergénérationnel).
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import {
  HORIZON_ROW_KEYS,
  type ComparisonProjection,
} from "@/lib/derived/comparison-projection";
import { DIMENSION_KEYS } from "@/lib/derived/keys";
import { IntergenTable } from "./IntergenComparison";

function makeProjection(
  id: string,
  name: string,
  intergen: Partial<ComparisonProjection["intergen"]> = {},
): ComparisonProjection {
  const dimGrades = Object.fromEntries(
    DIMENSION_KEYS.map((k) => [k, "C" as const]),
  ) as ComparisonProjection["dimGrades"];
  const risks = Object.fromEntries(
    DIMENSION_KEYS.map((k) => [k, [-1, -1, -1, -1] as Array<-1>]),
  ) as ComparisonProjection["risks"];
  const pick = (k: keyof ComparisonProjection["intergen"]) =>
    k in intergen ? (intergen[k] as number | null) : 0;
  return {
    id,
    displayName: name,
    party: "Parti",
    partyShort: "PR",
    updatedAt: "2026-01-01T00:00:00Z",
    versionDate: "2026-01-01",
    isFictional: true,
    translation: { lang: "fr", status: "native_fr" },
    analyzable: true,
    overallGrade: "C",
    overallGradeModifier: null,
    positioning: [0, 0, 0, 0, 0],
    dimGrades,
    risks,
    intergen: {
      pensions: pick("pensions"),
      public_debt: pick("public_debt"),
      climate: pick("climate"),
      health: pick("health"),
      education: pick("education"),
      housing: pick("housing"),
    },
  };
}

describe("IntergenTable", () => {
  it("renders one row per HORIZON_ROW_KEY and N candidate columns", () => {
    const a = makeProjection("a", "Alpha");
    const b = makeProjection("b", "Beta");
    const html = renderToStaticMarkup(
      <IntergenTable selected={[a, b]} lang="fr" />,
    );
    for (const key of HORIZON_ROW_KEYS) {
      expect(html).toMatch(new RegExp(`data-row="${key}"`));
    }
    // Each key × 2 candidates.
    const cells = html.match(/data-row=/g) ?? [];
    expect(cells.length).toBe(HORIZON_ROW_KEYS.length * 2);
  });

  it("renders '—' (no bar) when a cell score is null", () => {
    const a = makeProjection("a", "Alpha", { pensions: null });
    const b = makeProjection("b", "Beta");
    const html = renderToStaticMarkup(
      <IntergenTable selected={[a, b]} lang="fr" />,
    );
    expect(html).toMatch(/data-row="pensions"[^>]*data-candidate="a"[^>]*data-score="null"/);
    // The "—" glyph must appear for the null cell.
    expect(html).toContain("—");
  });

  it("renders signed integers with + prefix for positive, − for negative", () => {
    const a = makeProjection("a", "Alpha", { pensions: 2, climate: -3 });
    const b = makeProjection("b", "Beta");
    const html = renderToStaticMarkup(
      <IntergenTable selected={[a, b]} lang="fr" />,
    );
    expect(html).toContain("+2");
    expect(html).toContain("−3");
  });

  it("renders no totals row or totals column", () => {
    const a = makeProjection("a", "A");
    const b = makeProjection("b", "B");
    const html = renderToStaticMarkup(
      <IntergenTable selected={[a, b]} lang="fr" />,
    );
    expect(html.toLowerCase()).not.toContain("total");
  });

  it("each row header links to /candidat/<first>#horizon-<row>", () => {
    const a = makeProjection("a", "Alpha");
    const b = makeProjection("b", "Beta");
    const html = renderToStaticMarkup(
      <IntergenTable selected={[a, b]} lang="fr" />,
    );
    for (const key of HORIZON_ROW_KEYS) {
      expect(html).toContain(`href="/candidat/a#horizon-${key}"`);
    }
  });

  it("does not contain advocacy vocabulary (measurement only)", () => {
    const a = makeProjection("a", "A", { pensions: 3 });
    const b = makeProjection("b", "B", { pensions: -3 });
    const html = renderToStaticMarkup(
      <IntergenTable selected={[a, b]} lang="fr" />,
    );
    for (const w of ["sacrifice", "vol", "injustice", "rob", "steal"]) {
      expect(html.toLowerCase()).not.toContain(w);
    }
  });

  it("localizes headers in English", () => {
    const a = makeProjection("a", "A");
    const b = makeProjection("b", "B");
    const html = renderToStaticMarkup(
      <IntergenTable selected={[a, b]} lang="en" />,
    );
    expect(html).toContain("Intergenerational");
    expect(html).toContain("Topic");
    expect(html).toContain("Pensions");
    expect(html).toContain("Housing");
  });
});
