// See docs/specs/website/comparison-page.md §4.2
//
// Build-time listing of every analyzable candidate projected to the
// flat `ComparisonProjection` view-model. Failing-to-load candidates
// are surfaced as `analyzable: false` so the picker UI can grey them
// out without throwing.
//
// This module MUST only be imported from server components / build-time
// scripts. It uses `node:fs` via `./candidates`.

import {
  listCandidates,
  loadCandidate,
  type CandidateBundle,
  type CandidateIndexEntry,
} from "./candidates";
import {
  deriveComparisonProjection,
  type ComparisonEntry,
} from "./derived/comparison-projection";
import type { Lang } from "./i18n";

/**
 * Pure core: given a list of index rows and a bundle loader, build the
 * comparison entries. Exported for unit tests that inject a stub loader.
 */
export function buildComparisonEntries(
  rows: readonly CandidateIndexEntry[],
  load: (id: string) => CandidateBundle,
): ComparisonEntry[] {
  const out: ComparisonEntry[] = [];
  for (const row of rows) {
    try {
      out.push(deriveComparisonProjection(load(row.id)));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      out.push({
        id: row.id,
        displayName: row.displayName,
        updatedAt: row.updatedAt,
        analyzable: false,
        reason: message,
      });
    }
  }
  return out;
}

export function listComparisonProjections(
  lang: Lang = "fr",
): ComparisonEntry[] {
  return buildComparisonEntries(listCandidates(), (id) =>
    loadCandidate(id, lang),
  );
}
