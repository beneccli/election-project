import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { AggregatedOutput } from "@/lib/schema";
import { IntergenHorizonTable } from "./IntergenHorizonTable";

type Matrix = AggregatedOutput["intergenerational"]["horizon_matrix"];
type Row = Matrix[number];

function cell(
  score: number | null,
  dissenters: string[] = [],
): Row["cells"]["h_2027_2030"] {
  return {
    modal_score: score as Row["cells"]["h_2027_2030"]["modal_score"],
    score_interval: [
      (score ?? 0) as -3 | -2 | -1 | 0 | 1 | 2 | 3,
      (score ?? 0) as -3 | -2 | -1 | 0 | 1 | 2 | 3,
    ],
    note: `note score=${score ?? "null"}`,
    supported_by: ["model-a"],
    dissenters,
    per_model: [
      {
        model: "model-a",
        score: (score ?? 0) as -3 | -2 | -1 | 0 | 1 | 2 | 3,
        note: "a",
      },
      {
        model: "model-b",
        score: (score ?? 0) as -3 | -2 | -1 | 0 | 1 | 2 | 3,
        note: "b",
      },
    ],
  };
}

function row(
  name: Row["row"],
  scores: [number | null, number | null, number | null],
  dissents: [string[], string[], string[]] = [[], [], []],
): Row {
  return {
    row: name,
    dimension_note: `dimension note for ${name}`,
    cells: {
      h_2027_2030: cell(scores[0], dissents[0]),
      h_2031_2037: cell(scores[1], dissents[1]),
      h_2038_2047: cell(scores[2], dissents[2]),
    },
    row_supported_by: ["model-a"],
    row_dissenters: [],
  };
}

function buildMatrix(overrides: Partial<Record<Row["row"], Row>>): Matrix {
  const base: Matrix = [
    row("pensions", [0, 0, 0]),
    row("public_debt", [0, 0, 0]),
    row("climate", [0, 0, 0]),
    row("health", [0, 0, 0]),
    row("education", [0, 0, 0]),
    row("housing", [0, 0, 0]),
  ];
  return base.map((r) => overrides[r.row] ?? r) as Matrix;
}

describe("IntergenHorizonTable", () => {
  it("renders 6 row labels and 3 horizon column headers", () => {
    const html = renderToStaticMarkup(
      <IntergenHorizonTable matrix={buildMatrix({})} />,
    );
    // Row labels (French)
    for (const label of [
      "Retraites",
      "Dette publique",
      "Climat",
      "Santé",
      "Éducation",
      "Logement",
    ]) {
      expect(html).toContain(label);
    }
    // Horizon ranges
    expect(html).toContain("2027–2030");
    expect(html).toContain("2031–2037");
    expect(html).toContain("2038–2047");
    // Cohort annotations (HTML-encoded & => &amp;)
    expect(html).toContain("Actifs 35–55 ans");
    expect(html).toContain("Génération Z &amp; Alpha");
  });

  it("renders signed scores with + / − / 0 prefixes", () => {
    const matrix = buildMatrix({
      pensions: row("pensions", [-2, -1, 0]),
      climate: row("climate", [1, 2, 3]),
    });
    const html = renderToStaticMarkup(
      <IntergenHorizonTable matrix={matrix} />,
    );
    expect(html).toContain("−2");
    expect(html).toContain("−1");
    expect(html).toContain("+1");
    expect(html).toContain("+2");
    expect(html).toContain("+3");
    // A neutral 0 should still render
    expect(html).toMatch(/>0</);
  });

  it("renders a question mark when modal_score is null", () => {
    const matrix = buildMatrix({
      education: row("education", [null, 0, 0]),
    });
    const html = renderToStaticMarkup(
      <IntergenHorizonTable matrix={matrix} />,
    );
    expect(html).toContain("?");
  });

  it("shows the dissent badge when a cell has dissenters", () => {
    const matrix = buildMatrix({
      housing: row(
        "housing",
        [-1, 0, 0],
        [["model-b"], [], []],
      ),
    });
    const html = renderToStaticMarkup(
      <IntergenHorizonTable matrix={matrix} />,
    );
    expect(html).toContain("⚡");
  });

  it("exposes the dimension_note in the rendered output", () => {
    const matrix = buildMatrix({
      climate: row("climate", [0, 0, 0]),
    });
    const html = renderToStaticMarkup(
      <IntergenHorizonTable matrix={matrix} />,
    );
    expect(html).toContain("dimension note for climate");
  });

  it("uses semantic <table> structure with row headers", () => {
    const html = renderToStaticMarkup(
      <IntergenHorizonTable matrix={buildMatrix({})} />,
    );
    expect(html).toContain("<table");
    expect(html).toContain("<thead");
    expect(html).toContain("<tbody");
    expect(html).toContain('scope="row"');
    expect(html).toContain('scope="col"');
  });
});
