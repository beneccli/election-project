// See docs/specs/website/landing-page.md §5.2
// Build /comparer?c=<id1>&c=<id2> preselecting the two most recently
// updated analyzable candidates. Falls back to /comparer with no
// query when <2 analyzable candidates exist.
//
// Editorial: ordering is by `updated` recency, NOT by any score —
// the landing page must never insinuate a ranking.

import { listCandidates, type CandidateIndexEntry } from "./candidates";
import { localePath } from "./locale-path";
import type { Lang } from "./i18n";

export function buildCompareCtaHref(
  entries: CandidateIndexEntry[] = listCandidates(),
  lang: Lang = "fr",
): string {
  const sorted = [...entries].sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt),
  );
  const picks = sorted.slice(0, 2).map((e) => e.id);
  const base = localePath("/comparer", lang);
  if (picks.length < 2) return base;
  const qs = picks.map((id) => `c=${encodeURIComponent(id)}`).join("&");
  return `${base}?${qs}`;
}
