// See docs/specs/website/transparency.md §5
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { DocumentTabView } from "./DocumentTab";

const SAMPLE_MD = `# Titre principal

## Retraites

Un paragraphe sur les **retraites**.

### Âge de départ

Sous-section avec accent.

## Éducation & Climat

Un autre paragraphe.
`;

describe("DocumentTabView", () => {
  it("renders the loading placeholder", () => {
    const html = renderToStaticMarkup(
      <DocumentTabView
        fileUrl="/candidates/x/2027-11-01/sources.md"
        versionDate="2027-11-01"
        humanReviewCompleted={true}
        state={{ phase: "loading" }}
      />,
    );
    expect(html).toContain("Chargement du document consolidé");
  });

  it("renders markdown body with slug ids on h2 / h3", () => {
    const html = renderToStaticMarkup(
      <DocumentTabView
        fileUrl="/candidates/x/2027-11-01/sources.md"
        versionDate="2027-11-01"
        humanReviewCompleted={true}
        state={{
          phase: "loaded",
          text: SAMPLE_MD,
          sha256: "a".repeat(64),
        }}
      />,
    );
    expect(html).toContain('id="retraites"');
    expect(html).toContain(">Retraites</h2>");
    expect(html).toContain('id="age-de-depart"');
    expect(html).toContain(">Âge de départ</h3>");
    expect(html).toContain('id="education-climat"');
    // Markdown emphasis rendered
    expect(html).toContain("<strong>retraites</strong>");
    // No id on h1 (only h2/h3 are anchored per spec).
    expect(html).not.toContain('<h1 id=');
  });

  it("renders the SHA256 + review badge", () => {
    const html = renderToStaticMarkup(
      <DocumentTabView
        fileUrl="/candidates/x/2027-11-01/sources.md"
        versionDate="2027-11-01"
        humanReviewCompleted={true}
        state={{
          phase: "loaded",
          text: "# Hello",
          sha256: "deadbeef".repeat(8),
        }}
      />,
    );
    expect(html).toContain("deadbeef".repeat(8));
    expect(html).toContain("Revue humaine");
    expect(html).toContain("sources.md · 2027-11-01");
  });

  it("shows the 'not reviewed' badge when human_review_completed is false", () => {
    const html = renderToStaticMarkup(
      <DocumentTabView
        fileUrl="/candidates/x/2027-11-01/sources.md"
        versionDate="2027-11-01"
        humanReviewCompleted={false}
        state={{ phase: "loading" }}
      />,
    );
    expect(html).toContain("Revue non validée");
  });

  it("renders the error state with a raw-file escape hatch", () => {
    const html = renderToStaticMarkup(
      <DocumentTabView
        fileUrl="/candidates/x/2027-11-01/sources.md"
        versionDate="2027-11-01"
        humanReviewCompleted={true}
        state={{ phase: "error", message: "HTTP 404" }}
      />,
    );
    expect(html).toContain("Échec du chargement du document consolidé");
    expect(html).toContain("HTTP 404");
    expect(html).toContain("Ouvrir le fichier brut");
  });
});
