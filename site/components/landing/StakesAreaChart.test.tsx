// See docs/specs/website/landing-page.md §5.4
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import StakesAreaChart from "./StakesAreaChart";
import { getContextSeries } from "@/lib/landing-context";

describe("StakesAreaChart", () => {
  it("renders for the debt series without errors", () => {
    const html = renderToStaticMarkup(
      <StakesAreaChart series={getContextSeries("debt")} lang="fr" />,
    );
    expect(html).toContain("<svg");
    expect(html).toContain('role="img"');
  });

  it("renders for the demographics series without errors", () => {
    const html = renderToStaticMarkup(
      <StakesAreaChart series={getContextSeries("demographics")} lang="fr" />,
    );
    expect(html).toContain("<svg");
  });

  it("produces a line path with N-1 segments (one M + N-1 L commands)", () => {
    const series = getContextSeries("debt");
    const html = renderToStaticMarkup(
      <StakesAreaChart series={series} lang="fr" />,
    );
    // The stroked line path is the one with fill="none".
    const match = html.match(/<path d="(M[^"]+)" fill="none"/);
    expect(match).not.toBeNull();
    const d = match![1];
    const lCount = (d.match(/ L/g) ?? []).length;
    expect(lCount).toBe(series.points.length - 1);
  });

  it("renders a projection separator only when projectionFrom is set", () => {
    const debtHtml = renderToStaticMarkup(
      <StakesAreaChart series={getContextSeries("debt")} lang="fr" />,
    );
    expect(debtHtml).not.toContain("projection-separator");

    const demoHtml = renderToStaticMarkup(
      <StakesAreaChart series={getContextSeries("demographics")} lang="fr" />,
    );
    expect(demoHtml).toContain("projection-separator");
    expect(demoHtml).toContain("projection →");
  });

  it("exposes the reference-line label as a <title> element (a11y)", () => {
    const html = renderToStaticMarkup(
      <StakesAreaChart series={getContextSeries("debt")} lang="fr" />,
    );
    expect(html).toContain("ref-line");
    expect(html).toMatch(/<title>Critère 60% \(Maastricht\)<\/title>/);
  });

  it("uses the title as the accessible label", () => {
    const html = renderToStaticMarkup(
      <StakesAreaChart series={getContextSeries("debt")} lang="fr" />,
    );
    // aria-labelledby points at a <title> that contains the FR title
    expect(html).toContain("Dette publique / PIB");
  });

  it("renders a source link pointing at the series URL", () => {
    const series = getContextSeries("debt");
    const html = renderToStaticMarkup(
      <StakesAreaChart series={series} lang="fr" />,
    );
    expect(html).toContain(`href="${series.source.url}"`);
    expect(html).toContain("Eurostat");
  });
});
