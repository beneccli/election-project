// See docs/specs/website/i18n.md §4 (URL is the canonical locale source)
//
// Tiny helper to prefix an internal route with the active locale.
// Mirror of swapLocalePath but for the common "I have a target path
// already and just want to render it for the current locale" case.

import type { Lang } from "./i18n";

/**
 * Prefix an internal absolute path with `/<lang>` when `lang` is not
 * the default (FR). Pass-through for FR (no prefix). Hash and query
 * are preserved.
 *
 * Examples:
 *   localePath("/candidat/x", "fr")        → "/candidat/x"
 *   localePath("/candidat/x", "en")        → "/en/candidat/x"
 *   localePath("/comparer?c=a", "en")      → "/en/comparer?c=a"
 *   localePath("/candidat/x#risques", "en")→ "/en/candidat/x#risques"
 *   localePath("/", "en")                  → "/en"
 *
 * Inputs that already carry a locale prefix are returned unchanged
 * (defensive — callers should not double-prefix).
 */
export function localePath(path: string, lang: Lang): string {
  if (!path.startsWith("/")) return path;
  if (lang === "fr") return path;
  // Avoid double-prefixing if the caller already inlined `/en/...`.
  if (path === `/${lang}` || path.startsWith(`/${lang}/`)) return path;
  if (path === "/") return `/${lang}`;
  return `/${lang}${path}`;
}
