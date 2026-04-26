import { describe, expect, it } from "vitest";
import { localePath } from "./locale-path";

describe("localePath", () => {
  it("returns the input unchanged for fr", () => {
    expect(localePath("/", "fr")).toBe("/");
    expect(localePath("/candidat/x", "fr")).toBe("/candidat/x");
    expect(localePath("/comparer?c=a&c=b", "fr")).toBe("/comparer?c=a&c=b");
  });

  it("prefixes /<lang> for non-fr locales", () => {
    expect(localePath("/", "en")).toBe("/en");
    expect(localePath("/candidat/x", "en")).toBe("/en/candidat/x");
    expect(localePath("/comparer", "en")).toBe("/en/comparer");
  });

  it("preserves query strings and hash fragments", () => {
    expect(localePath("/comparer?c=a&c=b", "en")).toBe("/en/comparer?c=a&c=b");
    expect(localePath("/candidat/x#risques", "en")).toBe(
      "/en/candidat/x#risques",
    );
    expect(localePath("/candidat/x?foo=1#bar", "en")).toBe(
      "/en/candidat/x?foo=1#bar",
    );
  });

  it("does not double-prefix when the input already carries the locale", () => {
    expect(localePath("/en", "en")).toBe("/en");
    expect(localePath("/en/candidat/x", "en")).toBe("/en/candidat/x");
  });

  it("returns non-absolute inputs untouched", () => {
    expect(localePath("candidat/x", "en")).toBe("candidat/x");
    expect(localePath("#section", "en")).toBe("#section");
  });
});
