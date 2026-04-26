// See docs/specs/website/i18n.md §4.4
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import {
  LanguageToggle,
  swapLocalePath,
} from "@/components/chrome/LanguageToggle";

describe("swapLocalePath", () => {
  it("swaps from FR root to /en", () => {
    expect(swapLocalePath("/", "en")).toBe("/en");
  });

  it("swaps from /en to FR root", () => {
    expect(swapLocalePath("/en", "fr")).toBe("/");
    expect(swapLocalePath("/en/", "fr")).toBe("/");
  });

  it("preserves nested paths when adding the EN prefix", () => {
    expect(swapLocalePath("/candidat/test-omega", "en")).toBe(
      "/en/candidat/test-omega",
    );
    expect(swapLocalePath("/comparer", "en")).toBe("/en/comparer");
  });

  it("strips the EN prefix when going back to FR", () => {
    expect(swapLocalePath("/en/candidat/test-omega", "fr")).toBe(
      "/candidat/test-omega",
    );
    expect(swapLocalePath("/en/comparer", "fr")).toBe("/comparer");
  });

  it("treats a missing pathname as root", () => {
    expect(swapLocalePath("", "en")).toBe("/en");
  });
});

vi.mock("next/navigation", () => {
  const params = new URLSearchParams("c=a&c=b");
  return {
    usePathname: () => "/comparer",
    useSearchParams: () => params,
  };
});

vi.mock("@/lib/lang-context", () => ({
  useLang: () => ({ lang: "fr", setLang: () => {} }),
}));

describe("LanguageToggle (URL navigator)", () => {
  it("renders an anchor whose href targets the swapped locale and preserves the query string", () => {
    const html = renderToStaticMarkup(<LanguageToggle />);
    expect(html).toContain('href="/en/comparer?c=a&amp;c=b"');
    expect(html).toContain('data-language-toggle="en"');
    // Not a button anymore
    expect(html).not.toMatch(/<button[^>]*data-language-toggle/);
  });
});
