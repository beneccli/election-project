// See docs/specs/website/nextjs-architecture.md §4.6
// Per-risk table grouped by dimension. NO cardinal risk score.
//
// Client component because each row toggles a detail panel exposing the
// full reasoning + supporting model list. See task 0065 review item #6.
"use client";

import { useState } from "react";
import type { AggregatedOutput } from "@/lib/schema";
import type { DimensionKey } from "@/lib/derived/keys";
import { ConfidenceDots } from "./ConfidenceDots";
import { format, t, UI_STRINGS, type Lang } from "@/lib/i18n";

type Risk = AggregatedOutput["dimensions"][DimensionKey]["execution_risks"][number];

export interface RiskGroup {
  dimensionKey: DimensionKey;
  label: string;
  risks: Risk[];
  /** Number of model runs covering this candidate — used for the "k/n" pill. */
  totalCoverage: number;
}

export function RiskHeatmap({ groups, lang = "fr" }: { groups: RiskGroup[]; lang?: Lang }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[540px] border-collapse">
        <thead>
          <tr className="text-left text-xs uppercase tracking-[0.06em] text-text-secondary">
            <th className="w-[66%] pb-3 pr-3 font-semibold">{t(UI_STRINGS.RISK_HEATMAP_COL_RISK, lang)}</th>
            <th className="pb-3 pr-3 font-semibold">{t(UI_STRINGS.RISK_HEATMAP_COL_PROBABILITY, lang)}</th>
            <th className="pb-3 pr-3 font-semibold">{t(UI_STRINGS.RISK_HEATMAP_COL_SEVERITY, lang)}</th>
            <th className="pb-3 pr-3 font-semibold">{t(UI_STRINGS.RISK_HEATMAP_COL_MODELS, lang)}</th>
            <th className="w-[32px] pb-3 font-semibold" aria-label={t(UI_STRINGS.A11Y_DETAILS, lang)} />
          </tr>
        </thead>
        <tbody>
          {groups.map((g) => (
            <GroupBody key={g.dimensionKey} group={g} lang={lang} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function GroupBody({ group, lang }: { group: RiskGroup; lang: Lang }) {
  return (
    <>
      <tr className="border-t border-rule">
        <td
          colSpan={5}
          className="bg-bg-subtle px-3 py-2 text-xs font-bold uppercase tracking-[0.06em] text-text-secondary"
        >
          {group.label}
        </td>
      </tr>
      {group.risks.length === 0 ? (
        <tr className="border-t border-rule-light">
          <td
            colSpan={5}
            className="px-3 py-3 text-sm italic text-text-tertiary"
          >
            {t(UI_STRINGS.RISK_HEATMAP_EMPTY, lang)}
          </td>
        </tr>
      ) : (
        group.risks.map((r, i) => (
          <RiskRow
            key={`${group.dimensionKey}-${i}`}
            risk={r}
            totalCoverage={group.totalCoverage}
            lang={lang}
          />
        ))
      )}
    </>
  );
}

/** 5-step palette keyed on max(probability, severity) in [0, 1]. */
function tintFor(max: number): string {
  if (max >= 0.85) return "oklch(0.50 0.20 20 / 0.18)";
  if (max >= 0.65) return "oklch(0.60 0.19 30 / 0.14)";
  if (max >= 0.45) return "oklch(0.74 0.15 60 / 0.12)";
  if (max >= 0.25) return "oklch(0.82 0.10 90 / 0.10)";
  return "transparent";
}

function RiskRow({
  risk,
  totalCoverage,
  lang,
}: {
  risk: Risk;
  totalCoverage: number;
  lang: Lang;
}) {
  const [open, setOpen] = useState(false);
  const max = Math.max(risk.probability, risk.severity);
  const supported = risk.supported_by.length;
  const dissenters = risk.dissenters ?? [];

  return (
    <>
      <tr
        className="cursor-pointer border-t border-rule-light align-top transition-colors hover:bg-bg-subtle focus-within:bg-bg-subtle"
        style={{ background: tintFor(max) }}
        onClick={() => setOpen((v) => !v)}
      >
        <td className="px-3 py-3 text-sm leading-[1.5] text-text [text-wrap:pretty]">
          {risk.risk}
        </td>
        <td className="px-3 py-3">
          <ConfidenceDots value={risk.probability} label={t(UI_STRINGS.SYNTHESE_PROBABILITY, lang)} />
        </td>
        <td className="px-3 py-3">
          <ConfidenceDots value={risk.severity} label={t(UI_STRINGS.SYNTHESE_SEVERITY, lang)} />
        </td>
        <td className="px-3 py-3">
          <span className="inline-flex items-center rounded-sm border border-rule px-1.5 py-0.5 text-xs font-semibold text-text-secondary">
            {supported}/{totalCoverage || supported}
          </span>
        </td>
        <td className="px-3 py-3 text-right">
          <button
            type="button"
            aria-expanded={open}
            aria-label={open ? t(UI_STRINGS.A11Y_DETAILS_TOGGLE_HIDE, lang) : t(UI_STRINGS.A11Y_DETAILS_TOGGLE_SHOW, lang)}
            onClick={(e) => {
              e.stopPropagation();
              setOpen((v) => !v);
            }}
            className="inline-flex h-5 w-5 items-center justify-center rounded-sm text-text-tertiary hover:text-text focus:outline-none focus:ring-1 focus:ring-accent"
          >
            <Chevron open={open} />
          </button>
        </td>
      </tr>
      {open ? (
        <tr style={{ background: tintFor(max) }}>
          <td
            colSpan={5}
            className="px-3 pb-4 pt-0 text-sm text-text-secondary"
          >
            <div className="pt-3 grid grid-cols-1 gap-4 md:grid-cols-[1fr_220px]">
              <div>
                <div className="mb-1 text-xs font-bold uppercase tracking-wider text-text-tertiary">
                  {t(UI_STRINGS.RISK_HEATMAP_REASONING, lang)}
                </div>
                <p className="leading-[1.55] text-text [text-wrap:pretty]">
                  {risk.reasoning}
                </p>
              </div>
              <div>
                <div className="mb-1 text-xs font-bold uppercase tracking-wider text-text-tertiary">
                  {format(t(UI_STRINGS.RISK_HEATMAP_MODELS_LABEL, lang), { n: supported })}
                </div>
                <ul className="m-0 flex flex-wrap list-none gap-1 p-0">
                  {risk.supported_by.map((m) => (
                    <li
                      key={m}
                      className="inline-flex items-center rounded-full border border-rule bg-bg px-2 py-[2px] text-xs text-text-secondary"
                    >
                      {m}
                    </li>
                  ))}
                </ul>
                {dissenters.length > 0 ? (
                  <>
                    <div className="mb-1 mt-3 text-xs font-bold uppercase tracking-wider text-text-tertiary">
                      {t(UI_STRINGS.RISK_HEATMAP_DISSENT_LABEL, lang)}
                    </div>
                    <ul className="m-0 flex flex-wrap list-none gap-1 p-0">
                      {dissenters.map((m) => (
                        <li
                          key={m}
                          className="inline-flex items-center rounded-full border border-risk-red/40 bg-risk-red/10 px-2 py-[2px] text-xs text-risk-red"
                        >
                          {m}
                        </li>
                      ))}
                    </ul>
                  </>
                ) : null}
              </div>
            </div>
          </td>
        </tr>
      ) : null}
    </>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      aria-hidden="true"
      className={`transition-transform duration-150 ${open ? "rotate-90" : ""}`}
    >
      <path
        d="M4 2 L8 6 L4 10"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
