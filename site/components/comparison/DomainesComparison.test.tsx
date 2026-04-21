// See docs/specs/website/comparison-page.md §4 (Domaines).
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { DIMENSION_KEYS } from "@/lib/derived/keys";
import type { GradeLetter } from "@/lib/grade-color";
import { DomainesTable } from "./DomainesComparison";
import type { ComparisonProjection } from "@/lib/derived/comparison-projection";

function makeProjection(
  id: string,
  name: string,
  party: string,
  gradeByDim: Partial<Record<(typeof DIMENSION_KEYS)[number], GradeLetter>>,
  defaultGrade: GradeLetter = "C",
): ComparisonProjection {
  const dimGrades = Object.fromEntries(
    DIMENSION_KEYS.map((k) => [k, gradeByDim[k] ?? defaultGrade]),
  ) as ComparisonProjection["dimGrades"];
  const risks = Object.fromEntries(
    DIMENSION_KEYS.map((k) => [k, [-1, -1, -1, -1] as Array<-1>]),
  ) as ComparisonProjection["risks"];
  return {
    id,
    displayName: name,
    party,
    partyShort: party.slice(0, 3).toUpperCase(),
    updatedAt: "2026-01-01T00:00:00Z",
    isFictional: true,
    analyzable: true,
    overallGrade: "C",
    overallGradeModifier: null,
    positioning: [0, 0, 0, 0, 0],
    dimGrades,
    risks,
    intergen: {
      pensions: null,
      public_debt: null,
      climate: null,
      health: null,
      education: null,
      housing: null,
    },
  };
}

describe("DomainesTable", () => {
  it("renders one row per dimension and N candidate columns + Écart", () => {
    const a = makeProjection("a", "Alpha", "Parti A", {});
    const b = makeProjection("b", "Beta", "Parti B", {});
    const html = renderToStaticMarkup(
      <DomainesTable selected={[a, b]} lang="fr" />,
    );
    // One <tr> per dimension (plus header row).
    const tr = html.match(/<tr/g) ?? [];
    expect(tr).toHaveLength(DIMENSION_KEYS.length + 1);
    // First-name column headers.
    expect(html).toContain("Alpha");
    expect(html).toContain("Beta");
    expect(html).toContain("Écart");
  });

  it("supports 3 and 4-candidate selections", () => {
    const candidates = [
      makeProjection("a", "A", "P", {}),
      makeProjection("b", "B", "P", {}),
      makeProjection("c", "C", "P", {}),
      makeProjection("d", "D", "P", {}),
    ];
    const html3 = renderToStaticMarkup(
      <DomainesTable selected={candidates.slice(0, 3)} lang="fr" />,
    );
    // 5 dims × 3 candidates = 15 GradeBadges. Each has role="img".
    const badges3 = html3.match(/role="img"/g) ?? [];
    expect(badges3.length).toBe(DIMENSION_KEYS.length * 3);

    const html4 = renderToStaticMarkup(
      <DomainesTable selected={candidates} lang="fr" />,
    );
    const badges4 = html4.match(/role="img"/g) ?? [];
    expect(badges4.length).toBe(DIMENSION_KEYS.length * 4);
  });

  it("renders the ↑ marker only when the top is strictly unique", () => {
    // Row economic_fiscal: A vs B → unique top on A.
    // Row social_demographic: A vs A → tie, no marker.
    const a = makeProjection("a", "A", "P", {
      economic_fiscal: "A",
      social_demographic: "A",
    });
    const b = makeProjection("b", "B", "P", {
      economic_fiscal: "B",
      social_demographic: "A",
    });
    const html = renderToStaticMarkup(
      <DomainesTable selected={[a, b]} lang="fr" />,
    );
    const markers = html.match(/data-top-marker="a"/g) ?? [];
    const markersB = html.match(/data-top-marker="b"/g) ?? [];
    // Unique-top rows: economic_fiscal + any other default "C" row where
    // a candidate's grade was changed. Since defaults are equal,
    // economic_fiscal is the only unique-top row.
    expect(markers.length).toBe(1);
    expect(markersB.length).toBe(0);
  });

  it("renders no ↑ marker on a two-way tie at top", () => {
    const a = makeProjection("a", "A", "P", { economic_fiscal: "A" });
    const b = makeProjection("b", "B", "P", { economic_fiscal: "A" });
    const html = renderToStaticMarkup(
      <DomainesTable selected={[a, b]} lang="fr" />,
    );
    // No ↑ in the whole row. Default C rows are also tied.
    expect(html).not.toContain("data-top-marker=");
  });

  it("Écart = max − min on ordinal values; never a mean", () => {
    // A=4, C=2 → spread 2. F=0, A=4 → spread 4.
    const a = makeProjection("a", "A", "P", {
      economic_fiscal: "A",
      social_demographic: "F",
    });
    const b = makeProjection("b", "B", "P", {
      economic_fiscal: "C",
      social_demographic: "A",
    });
    const html = renderToStaticMarkup(
      <DomainesTable selected={[a, b]} lang="fr" />,
    );
    expect(html).toContain("⚡ 2");
    expect(html).toContain("⚡ 4");
  });

  it("renders '—' in Écart when every dimension cell is NOT_ADDRESSED", () => {
    const a = makeProjection("a", "A", "P", {}, "NOT_ADDRESSED");
    const b = makeProjection("b", "B", "P", {}, "NOT_ADDRESSED");
    const html = renderToStaticMarkup(
      <DomainesTable selected={[a, b]} lang="fr" />,
    );
    // 5 '—' for the Écart column (one per dimension).
    const dashes = html.match(/<td[^>]*>—<\/td>/g) ?? [];
    expect(dashes.length).toBe(DIMENSION_KEYS.length);
  });

  it("does NOT render any totals / averages row", () => {
    const a = makeProjection("a", "A", "P", {});
    const b = makeProjection("b", "B", "P", {});
    const html = renderToStaticMarkup(
      <DomainesTable selected={[a, b]} lang="fr" />,
    );
    expect(html.toLowerCase()).not.toContain("total");
    expect(html.toLowerCase()).not.toContain("moyenne");
    expect(html.toLowerCase()).not.toContain("average");
  });

  it("localizes the header in English", () => {
    const a = makeProjection("a", "A", "P", {});
    const b = makeProjection("b", "B", "P", {});
    const html = renderToStaticMarkup(
      <DomainesTable selected={[a, b]} lang="en" />,
    );
    expect(html).toContain("Domains");
    expect(html).toContain("Spread");
  });
});
