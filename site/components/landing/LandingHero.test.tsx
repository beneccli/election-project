// See docs/specs/website/landing-page.md §5.3
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import LandingHero from "./LandingHero";

const BANNED = [
  "catastrophe",
  "catastrophique",
  "crise",
  "désastre",
  "désastreux",
  "disaster",
  "meilleur candidat",
  "classement",
  "gagnant",
  "winner",
];

function stripHtmlForText(html: string): string {
  return html.replace(/<[^>]*>/g, " ").toLowerCase();
}

describe("LandingHero", () => {
  it("renders in FR with em-emphasis on 'vraiment'", () => {
    const html = renderToStaticMarkup(
      <LandingHero lang="fr" />,
    );
    expect(html).toContain("<em");
    expect(html).toContain("vraiment");
    expect(html).toContain("Que proposent");
  });

  it("renders in EN", () => {
    const html = renderToStaticMarkup(
      <LandingHero lang="en" analyzedCount={3} pendingCount={5} />,
    );
    expect(html).toContain("actually");
    expect(html).toContain("What are the candidates");
  });

  it("divider label reflects the analyzed and pending counts", () => {
    const html = renderToStaticMarkup(
      <LandingHero lang="fr" />,
    );
    expect(html).toMatch(/3 candidats analysés · 5 à venir/);
  });

  it("renders the three headline stats", () => {
    const html = renderToStaticMarkup(
      <LandingHero lang="fr" analyzedCount={0} pendingCount={0} />,
    );
    expect(html).toContain("112%");
    expect(html).toContain("−5,5%");
    expect(html).toContain("2050");
  });

  it("headline stats carry NO risk-red or amber color classes", () => {
    const html = renderToStaticMarkup(
      <LandingHero lang="fr" analyzedCount={0} pendingCount={0} />,
    );
    // Locate the hero-stats block
    const match = html.match(
      /data-testid="hero-stats"[\s\S]*?<\/ul>/,
    );
    expect(match).not.toBeNull();
    const block = match![0];
    expect(block).not.toMatch(/risk-red/);
    expect(block).not.toMatch(/text-red/);
    expect(block).not.toMatch(/color:\s*(red|#ff|oklch\(0\.5 0\.18 25\))/i);
    // Bad / warn classes from the prototype must not leak in:
    expect(block).not.toMatch(/class="[^"]*\bbad\b/);
    expect(block).not.toMatch(/class="[^"]*\bwarn\b/);
  });

  it("contains both stakes charts (debt + demographics)", () => {
    const html = renderToStaticMarkup(
      <LandingHero lang="fr" analyzedCount={0} pendingCount={0} />,
    );
    expect(html).toContain("Dette publique / PIB");
    expect(html).toContain("Population 65 ans et plus");
  });

  it("contains no banned advocacy words (regression guard)", () => {
    const html = renderToStaticMarkup(
      <LandingHero lang="fr" />,
    );
    const text = stripHtmlForText(html);
    for (const w of BANNED) {
      expect(text).not.toContain(w);
    }
  });
});
