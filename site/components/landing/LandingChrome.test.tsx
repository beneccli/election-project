// See docs/specs/website/landing-page.md §5.7, §5.8, §5.9, §5.2
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import CompareCta from "./CompareCta";
import MethodologyBlock from "./MethodologyBlock";
import LandingFooter from "./LandingFooter";
import { LandingNavBar } from "@/components/chrome/LandingNavBar";
import type { CandidateIndexEntry } from "@/lib/candidates";

function entry(id: string, updated: string): CandidateIndexEntry {
  return {
    id,
    displayName: id,
    party: "P",
    partyId: "p",
    isFictional: false,
    availableLocales: ["fr"],
    versionDate: "2026-01-01",
    updatedAt: updated,
  };
}

describe("CompareCta", () => {
  it("links to /comparer with both preselected ids when ≥2 exist", () => {
    const html = renderToStaticMarkup(
      <CompareCta
        lang="fr"
        entries={[entry("a", "2026-03-01"), entry("b", "2026-02-01")]}
      />,
    );
    expect(html).toContain("/comparer?c=a&amp;c=b");
  });

  it("falls back to /comparer when <2 candidates", () => {
    const html = renderToStaticMarkup(
      <CompareCta lang="fr" entries={[entry("a", "2026-03-01")]} />,
    );
    expect(html).toContain('href="/comparer"');
  });

  it("has NO 'Bientôt' badge (comparison is live)", () => {
    const html = renderToStaticMarkup(
      <CompareCta lang="fr" entries={[entry("a", "2026-03-01"), entry("b", "2026-02-01")]} />,
    );
    expect(html).not.toMatch(/Bientôt/i);
    expect(html).not.toMatch(/Coming soon/i);
  });
});

describe("MethodologyBlock", () => {
  it("renders 5 method pills and a 'Learn more' link", () => {
    const html = renderToStaticMarkup(<MethodologyBlock lang="fr" />);
    // 5 <li> items in the pill list
    const liCount = (html.match(/<li/g) ?? []).length;
    expect(liCount).toBeGreaterThanOrEqual(5);
    expect(html).toContain("/methodologie");
    expect(html).toContain("En savoir plus");
  });

  it("section anchor is #methode", () => {
    const html = renderToStaticMarkup(<MethodologyBlock lang="fr" />);
    expect(html).toMatch(/id="methode"/);
  });
});

describe("LandingFooter", () => {
  it("renders the three footer links", () => {
    const html = renderToStaticMarkup(<LandingFooter lang="fr" />);
    expect(html).toContain("#methode");
    expect(html).toMatch(/href="https:\/\/github.com\//);
    expect(html).toContain("/mentions-legales");
  });

  it("reiterates the neutrality note", () => {
    const html = renderToStaticMarkup(<LandingFooter lang="fr" />);
    expect(html).toMatch(/Aucune recommandation de vote/);
  });

  it("honors NEXT_PUBLIC_REPO_URL override", () => {
    const OLD = process.env.NEXT_PUBLIC_REPO_URL;
    process.env.NEXT_PUBLIC_REPO_URL = "https://example.test/repo";
    try {
      const html = renderToStaticMarkup(<LandingFooter lang="fr" />);
      expect(html).toContain("https://example.test/repo");
    } finally {
      if (OLD === undefined) delete process.env.NEXT_PUBLIC_REPO_URL;
      else process.env.NEXT_PUBLIC_REPO_URL = OLD;
    }
  });
});

describe("LandingNavBar", () => {
  it("shows the landing tagline and the two toggles, no candidate context", () => {
    const html = renderToStaticMarkup(<LandingNavBar lang="fr" />);
    expect(html).toContain("Analyse multi-IA des programmes");
    expect(html).not.toMatch(/Transparence/);
  });

  it("brand mark links to /", () => {
    const html = renderToStaticMarkup(<LandingNavBar lang="fr" />);
    expect(html).toMatch(/href="\/"/);
  });
});
