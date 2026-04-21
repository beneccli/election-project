// See docs/specs/website/transparency.md §9 "SourceRef component"
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { SourceRef, targetForLocator } from "./SourceRef";

describe("targetForLocator", () => {
  it("extracts the anchor slug from sources.md#<slug>", () => {
    expect(targetForLocator("sources.md#retraites")).toEqual({
      tab: "document",
      anchor: "retraites",
    });
  });

  it("accepts hyphens and digits in the slug", () => {
    expect(targetForLocator("sources.md#article-12a")).toEqual({
      tab: "document",
      anchor: "article-12a",
    });
  });

  it("returns the document root for non-matching locators", () => {
    expect(targetForLocator("page 42, §3")).toEqual({ tab: "document" });
  });

  it("returns the document root for locators without a fragment", () => {
    expect(targetForLocator("sources.md")).toEqual({ tab: "document" });
  });

  it("trims whitespace before matching", () => {
    expect(targetForLocator("  sources.md#education  ")).toEqual({
      tab: "document",
      anchor: "education",
    });
  });
});

describe("SourceRef (SSR)", () => {
  it("renders the locator verbatim and exposes it via title + data attribute", () => {
    const html = renderToStaticMarkup(
      <SourceRef>sources.md#retraites</SourceRef>,
    );
    expect(html).toContain(">sources.md#retraites<");
    expect(html).toContain('title="sources.md#retraites"');
    expect(html).toContain('data-source-ref="sources.md#retraites"');
    // It's a button, not a link, so keyboard activation works and
    // there is no phantom URL in the status bar.
    expect(html).toContain('type="button"');
  });

  it("preserves non-anchor locators byte-for-byte (pass-through)", () => {
    const html = renderToStaticMarkup(
      <SourceRef>Manifeste p. 14, §3 « écologie »</SourceRef>,
    );
    expect(html).toContain("Manifeste p. 14, §3 « écologie »");
  });
});
