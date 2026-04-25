// See docs/specs/website/nextjs-architecture.md §4.5
// Two-column static panel — neutral treatment, no red/green asymmetry.
import type { AggregatedOutput } from "@/lib/schema";
import { ConfidenceDots } from "./ConfidenceDots";
import { t, UI_STRINGS, type Lang, type I18nString } from "@/lib/i18n";

type Intergen = AggregatedOutput["intergenerational"];
type Cell = Intergen["impact_on_25yo_in_2027"]["fiscal"];

const LABELS_25: Record<
  "fiscal" | "housing" | "pension_outlook" | "labor_market" | "environmental_debt",
  I18nString
> = {
  fiscal: UI_STRINGS.INTERGEN_SPLIT_FISCAL,
  housing: UI_STRINGS.INTERGEN_CATEGORY_HOUSING,
  pension_outlook: UI_STRINGS.INTERGEN_SPLIT_PENSION_OUTLOOK,
  labor_market: UI_STRINGS.INTERGEN_CATEGORY_LABOR_MARKET,
  environmental_debt: UI_STRINGS.INTERGEN_SPLIT_ENVIRONMENTAL_DEBT,
};

const LABELS_65: Record<"fiscal" | "pension" | "healthcare", I18nString> = {
  fiscal: UI_STRINGS.INTERGEN_SPLIT_FISCAL,
  pension: UI_STRINGS.INTERGEN_SPLIT_PENSION,
  healthcare: UI_STRINGS.INTERGEN_CATEGORY_HEALTHCARE,
};

export function IntergenSplitPanel({
  intergen,
  lang = "fr",
}: {
  intergen: Intergen;
  lang?: Lang;
}) {
  const confidence = intergen.confidence;
  const y25 = intergen.impact_on_25yo_in_2027;
  const y65 = intergen.impact_on_65yo_in_2027;

  const rows25 = (Object.keys(LABELS_25) as (keyof typeof LABELS_25)[]).map(
    (k) => ({ key: k, label: t(LABELS_25[k], lang), cell: y25[k] }),
  );
  const rows65 = (Object.keys(LABELS_65) as (keyof typeof LABELS_65)[]).map(
    (k) => ({ key: k, label: t(LABELS_65[k], lang), cell: y65[k] }),
  );

  // Pad the shorter column with invisible rows so the two columns align
  // visually. Empty cells show "Non quantifié".
  const n = Math.max(rows25.length, rows65.length);

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <Column
        title={t(UI_STRINGS.INTERGEN_AT_25_TITLE, lang)}
        rows={rows25}
        rowCount={n}
        confidence={confidence}
        narrative={y25.narrative_summary}
        lang={lang}
      />
      <Column
        title={t(UI_STRINGS.INTERGEN_AT_65_TITLE, lang)}
        rows={rows65}
        rowCount={n}
        confidence={confidence}
        narrative={y65.narrative_summary}
        lang={lang}
      />
    </div>
  );
}

function Column({
  title,
  rows,
  rowCount,
  confidence,
  narrative,
  lang,
}: {
  title: string;
  rows: { key: string; label: string; cell: Cell }[];
  rowCount: number;
  confidence: number;
  narrative: string;
  lang: Lang;
}) {
  return (
    <div className="rounded-md border border-rule-light bg-bg-subtle p-5">
      <div className="mb-4 text-xs font-bold uppercase tracking-[0.08em] text-text-secondary">
        {title}
      </div>
      <ul className="m-0 flex list-none flex-col gap-3 p-0">
        {rows.map(({ key, label, cell }) => (
          <li
            key={key}
            className="flex flex-col gap-1 border-b border-rule-light pb-2 last:border-b-0"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-semibold text-text-secondary">
                {label}
              </span>
              <ConfidenceDots value={confidence} label={t(UI_STRINGS.SYNTHESE_CONFIDENCE, lang)} />
            </div>
            <div className="text-sm text-text">
              {cell.quantified ?? (
                <span className="italic text-text-tertiary">{t(UI_STRINGS.INTERGEN_NOT_QUANTIFIED, lang)}</span>
              )}
            </div>
            <div className="text-xs leading-[1.5] text-text-secondary [text-wrap:pretty]">
              {cell.summary}
            </div>
          </li>
        ))}
        {Array.from({ length: Math.max(0, rowCount - rows.length) }).map(
          (_, i) => (
            <li key={`pad-${i}`} aria-hidden="true" className="opacity-0">
              &nbsp;
            </li>
          ),
        )}
      </ul>

      <div className="mt-12">
        <div className="mb-1 text-xs font-bold uppercase tracking-wider text-text-tertiary">
            {t(UI_STRINGS.INTERGEN_SUMMARY_LABEL, lang)}
        </div>
        <p className="text-sm leading-[1.55] text-text [text-wrap:pretty]">
            {narrative}
        </p>
      </div>
    </div>
  );
}
