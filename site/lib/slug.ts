// See docs/specs/website/transparency.md §5 "Document tab"
//
// Minimal deterministic slug helper shared by the Document tab's
// heading anchors (task 0094) and the `<SourceRef>` chip deep-links
// (task 0097). Keep this pure: no external deps, no side effects.

/**
 * Convert a heading text into a stable URL-safe slug.
 *
 * Rules:
 *   1. Unicode-normalize to NFD and strip combining marks (accents).
 *   2. Lowercase.
 *   3. Replace any run of non-`[a-z0-9]` characters with a single `-`.
 *   4. Trim leading / trailing dashes.
 *   5. Empty input → empty string.
 *
 * Stability: any future change to this function is a breaking change
 * for existing `anchor=<slug>` deep-links.
 */
export function slugify(input: string): string {
  if (!input) return "";
  const normalized = input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  const slug = normalized.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return slug;
}
