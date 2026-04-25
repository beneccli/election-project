"use client";
// See docs/specs/website/comparison-page.md §4 (Intergénérationnel).
//
// 2047-horizon ordinal comparison. Consumes ONLY
// `projection.intergen[row]` which is already `h_2038_2047.modal_score`.
// No cross-horizon arithmetic.

import Link from "next/link";
import {
  HORIZON_ROW_KEYS,
  type HorizonRowKey,
  type ComparisonProjection,
} from "@/lib/derived/comparison-projection";
import { COMPARISON_COLORS } from "@/lib/comparison-colors";
import { useLang } from "@/lib/lang-context";
import { t, UI_STRINGS, type Lang } from "@/lib/i18n";
import { localePath } from "@/lib/locale-path";
import { useComparison } from "./ComparisonBody";
import { SectionHead } from "../chrome/SectionHead";

const ROW_LABELS: Record<HorizonRowKey, { fr: string; en: string }> = {
  pensions: UI_STRINGS.INTERGEN_CATEGORY_PENSIONS,
  public_debt: UI_STRINGS.INTERGEN_CATEGORY_PUBLIC_DEBT,
  climate: UI_STRINGS.INTERGEN_CATEGORY_CLIMATE,
  health: UI_STRINGS.INTERGEN_CATEGORY_HEALTHCARE,
  education: UI_STRINGS.INTERGEN_CATEGORY_EDUCATION,
  housing: UI_STRINGS.INTERGEN_CATEGORY_HOUSING,
};

function scoreColor(score: number | null): string {
  if (score === null) return "var(--text-tertiary)";
  if (score >= 2) return "oklch(0.44 0.17 145)";
  if (score === 1) return "oklch(0.60 0.12 145)";
  if (score === 0) return "var(--text-secondary)";
  if (score === -1) return "oklch(0.60 0.13 30)";
  return "oklch(0.46 0.19 20)";
}

function formatScore(score: number | null): string {
  if (score === null) return "—";
  if (score === 0) return "0";
  return score > 0 ? `+${score}` : `−${Math.abs(score)}`;
}

function barWidth(score: number | null): number {
  if (score === null) return 0;
  return Math.max(Math.abs(score) * 12, 2);
}

export function IntergenComparison() {
  const { entries, selectedIds } = useComparison();
  const { lang } = useLang();
  if (selectedIds.length < 2) return null;
  const selected: ComparisonProjection[] = selectedIds
    .map((id) => entries.find((e) => e.analyzable && e.id === id))
    .filter((e): e is ComparisonProjection =>
      Boolean(e && e.analyzable === true),
    );
  if (selected.length < 2) return null;

  return <IntergenTable selected={selected} lang={lang} />;
}

function firstName(name: string): string {
  return name.split(/\s+/)[0] ?? name;
}

export function IntergenTable({
  selected,
  lang,
}: {
  selected: ComparisonProjection[];
  lang: Lang;
}) {
  const anchorCandidate = selected[0]?.id ?? "";
  return (
    <section id="intergenerationnel" className="mb-16">
      <header className="mb-5">
        <SectionHead label={t(UI_STRINGS.COMPARISON_INTERGEN_TITLE, lang)} />
        
        <p className="mt-1 max-w-prose text-sm text-text-secondary">
          {t(UI_STRINGS.COMPARISON_INTERGEN_INTRO, lang)}
        </p>
      </header>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] border-collapse text-sm">
          <thead>
            <tr>
              <th
                scope="col"
                className="w-44 border-b border-rule px-3 pb-2 text-left text-xs font-medium uppercase tracking-wide text-text-secondary"
              >
                {t(UI_STRINGS.COMPARISON_INTERGEN_DOMAIN_LABEL, lang)}
              </th>
              {selected.map((c, slot) => {
                const color = COMPARISON_COLORS[slot % COMPARISON_COLORS.length];
                return (
                  <th
                    key={c.id}
                    scope="col"
                    className="border-b border-rule px-3 pb-2 text-center text-xs font-medium"
                  >
                    <span
                      aria-hidden
                      className="mx-auto mb-1 block h-[3px] w-8 rounded"
                      style={{ backgroundColor: color }}
                    />
                    {firstName(c.displayName)}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {HORIZON_ROW_KEYS.map((row) => {
              const labels = ROW_LABELS[row];
              const href = localePath(
                `/candidat/${anchorCandidate}#horizon-${row}`,
                lang,
              );
              return (
                <tr key={row}>
                  <th
                    scope="row"
                    className="border-b border-rule px-3 py-2 text-left font-medium text-text-secondary"
                  >
                    <Link
                      href={href}
                      className="underline decoration-dotted underline-offset-4 hover:text-text"
                      title={t(UI_STRINGS.COMPARISON_INTERGEN_LINK, lang)}
                    >
                      {t(labels, lang)}
                    </Link>
                  </th>
                  {selected.map((c) => {
                    const score = c.intergen[row];
                    const color = scoreColor(score);
                    return (
                      <td
                        key={c.id}
                        className="border-b border-rule px-3 py-2"
                        data-row={row}
                        data-candidate={c.id}
                        data-score={score === null ? "null" : String(score)}
                      >
                        <div className="flex items-center justify-center gap-2">
                          {score === null ? null : (
                            <span
                              aria-hidden
                              className="block h-[6px] rounded"
                              style={{
                                width: `${barWidth(score)}px`,
                                backgroundColor: color,
                              }}
                            />
                          )}
                          <span
                            className="font-mono text-sm font-semibold"
                            style={{ color }}
                          >
                            {formatScore(score)}
                          </span>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
