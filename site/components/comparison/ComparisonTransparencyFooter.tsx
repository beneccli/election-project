"use client";
// See docs/specs/website/comparison-page.md §5.4 (scoped transparency).
//
// Scoped transparency footer for /comparer. Lists each *selected*
// candidate's per-version metadata.json — deliberately terse because
// every candidate page already renders the full transparency footer
// for its own run. No raw-outputs drawer on this page.

import type { ComparisonProjection } from "@/lib/derived/comparison-projection";
import { useLang } from "@/lib/lang-context";
import { t, UI_STRINGS } from "@/lib/i18n";
import { useComparison } from "./ComparisonBody";

export function ComparisonTransparencyFooter() {
  const { entries, selectedIds } = useComparison();
  const { lang } = useLang();
  const selected: ComparisonProjection[] = selectedIds
    .map((id) => entries.find((e) => e.analyzable && e.id === id))
    .filter((e): e is ComparisonProjection =>
      Boolean(e && e.analyzable === true),
    );
  return (
    <footer className="mt-24 border-t border-rule bg-bg-subtle">
      <div className="mx-auto max-w-content px-8 py-10 text-sm text-text-secondary">
        <div className="mb-4 text-sm font-bold uppercase tracking-[0.2em] text-accent">
          {t(UI_STRINGS.COMPARISON_TRANSPARENCY_TITLE, lang)}
        </div>
        <p className="mb-6 max-w-prose text-base text-text">
          {t(UI_STRINGS.COMPARISON_FOOTER_BODY_LONG, lang)}
        </p>
        {selected.length === 0 ? (
          <p className="text-text-tertiary">
            {t(UI_STRINGS.COMPARISON_NO_CANDIDATES_SELECTED, lang)}
          </p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {selected.map((c) => {
              const metaHref = `/candidates/${c.id}/versions/${c.versionDate}/metadata.json`;
              const pageHref = `/candidat/${c.id}`;
              return (
                <li
                  key={c.id}
                  data-candidate={c.id}
                  className="inline-flex items-center gap-2 rounded-full border border-rule bg-bg px-3 py-1.5 text-xs"
                >
                  <a
                    href={pageHref}
                    className="font-semibold text-text no-underline hover:underline"
                  >
                    {c.displayName}
                  </a>
                  <span className="text-text-tertiary">·</span>
                  <span className="font-mono">{c.versionDate}</span>
                  <span className="text-text-tertiary">·</span>
                  <a
                    href={metaHref}
                    className="underline decoration-dotted underline-offset-4 hover:text-text"
                  >
                    metadata.json
                  </a>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </footer>
  );
}
