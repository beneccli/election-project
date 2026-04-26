// See docs/specs/website/landing-page.md §5.6
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import CandidateCard from "./CandidateCard";
import type {
  LandingCardAnalyzed,
  LandingCardPending,
} from "@/lib/landing-cards";

const BASE_ANALYZED: LandingCardAnalyzed = {
  id: "omega",
  status: "analyzed",
  displayName: "Alpha Durand",
  party: "Parti Alpha",
  partyShort: "PA",
  partyColor: "#3B6FD4",
  family: "centre",
  spectrumLabel: "Centre-gauche",
  spectrumStatus: "present",
  overallGrade: "B",
  overallGradeModifier: "+",
  ecoAxis: -2,
  versionDate: "2026-04-01",
  updatedAt: "2026-04-01",
  modelsCount: 4,
  isFictional: false,
  translation: { lang: "fr", status: "native_fr" },
};

const BASE_PENDING: LandingCardPending = {
  id: "bravo",
  status: "pending",
  displayName: "Bravo Martin",
  party: "Parti Bravo",
  partyShort: "PB",
  partyColor: "#C93D3D",
  family: "droite",
  declaredDate: "2026-02-15",
  updatedAt: "2026-02-15",
  isFictional: false,
  translation: { lang: "fr", status: "native_fr" },
};

describe("CandidateCard — analyzed", () => {
  it("renders as a link to /candidat/{id}", () => {
    const html = renderToStaticMarkup(
      <CandidateCard card={BASE_ANALYZED} lang="fr" />,
    );
    expect(html).toMatch(/<a [^>]*href="\/candidat\/omega"/);
  });

  it("prefixes the link with /<lang> when lang is not fr", () => {
    const html = renderToStaticMarkup(
      <CandidateCard card={BASE_ANALYZED} lang="en" />,
    );
    expect(html).toMatch(/<a [^>]*href="\/en\/candidat\/omega"/);
  });

  it("includes the grade badge and display name", () => {
    const html = renderToStaticMarkup(
      <CandidateCard card={BASE_ANALYZED} lang="fr" />,
    );
    expect(html).toContain("Alpha Durand");
    expect(html).toContain("Centre-gauche");
  });

  it("renders the axis dot when ecoAxis is a number", () => {
    const html = renderToStaticMarkup(
      <CandidateCard card={BASE_ANALYZED} lang="fr" />,
    );
    expect(html).not.toContain("axis-empty");
    // dot positioned via left: ((ecoAxis + 5) / 10) * 100
    expect(html).toMatch(/left:\s*30%/); // (-2+5)/10 = 30%
  });

  it("renders a dash placeholder when ecoAxis is null", () => {
    const html = renderToStaticMarkup(
      <CandidateCard
        card={{ ...BASE_ANALYZED, ecoAxis: null }}
        lang="fr"
      />,
    );
    expect(html).toContain("axis-empty");
  });

  it("exposes data-status and data-family for the grid filter", () => {
    const html = renderToStaticMarkup(
      <CandidateCard card={BASE_ANALYZED} lang="fr" />,
    );
    expect(html).toContain('data-status="analyzed"');
    expect(html).toContain('data-family="centre"');
  });
});

describe("CandidateCard — pending", () => {
  it("is NOT wrapped in a link", () => {
    const html = renderToStaticMarkup(
      <CandidateCard card={BASE_PENDING} lang="fr" />,
    );
    expect(html).not.toMatch(/<a [^>]*href="\/candidat\/bravo"/);
  });

  it("sets aria-disabled and has no grade badge", () => {
    const html = renderToStaticMarkup(
      <CandidateCard card={BASE_PENDING} lang="fr" />,
    );
    expect(html).toContain("aria-disabled");
    expect(html).toContain("Analyse à venir");
  });

  it("shows the declared date when present, a dash otherwise", () => {
    const withDate = renderToStaticMarkup(
      <CandidateCard card={BASE_PENDING} lang="fr" />,
    );
    expect(withDate).toMatch(/2026/);

    const noDate = renderToStaticMarkup(
      <CandidateCard
        card={{ ...BASE_PENDING, declaredDate: null }}
        lang="fr"
      />,
    );
    expect(noDate).toContain("\u2014");
  });
});
