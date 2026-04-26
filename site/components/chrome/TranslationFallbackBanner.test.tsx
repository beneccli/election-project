// See docs/specs/website/i18n.md §6
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { TranslationFallbackBanner } from "@/components/chrome/TranslationFallbackBanner";

describe("TranslationFallbackBanner", () => {
  it("renders the EN title and body when lang is en", () => {
    const html = renderToStaticMarkup(<TranslationFallbackBanner lang="en" />);
    expect(html).toContain('data-translation-fallback="en"');
    expect(html).toContain("Translation pending");
    expect(html).toContain("not yet published");
  });

  it("exposes a dismiss button with an accessible label", () => {
    const html = renderToStaticMarkup(<TranslationFallbackBanner lang="en" />);
    expect(html).toMatch(/<button[^>]*data-translation-fallback-dismiss/);
    expect(html).toMatch(/aria-label="Dismiss this message"/);
  });
});
