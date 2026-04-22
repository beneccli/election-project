// See docs/specs/website/landing-page.md §3.2
//
// France-level context used by the landing hero (stats panel +
// two area charts). These values are factual, manually maintained,
// and are NOT derived from any candidate.
//
// Update procedure (maintainer role): the values below are sourced
// from the URLs in `source.url`. Refresh annually. Never auto-fetch
// at build time — every update is a reviewed commit.
//
// Editorial: labels and source notes are factual; no moral adjectives.
// See docs/specs/analysis/editorial-principles.md §3 (measurement over
// indictment).

import type { I18nString } from "./i18n";

export type ContextStatKey = "debt" | "deficit" | "carbonNeutrality";

export interface ContextStat {
  key: ContextStatKey;
  /** Headline figure as displayed (e.g. "112%"). */
  headline: string;
  label: I18nString;
  sourceNote: I18nString;
}

export interface ContextSeriesSource {
  label: I18nString;
  url: string;
}

export interface ContextReferenceLine {
  y: number;
  label: I18nString;
}

export type ContextSeriesKey = "debt" | "demographics";

export interface ContextSeries {
  key: ContextSeriesKey;
  title: I18nString;
  /** Short headline-style value shown next to the chart title. */
  headline: I18nString;
  points: ReadonlyArray<readonly [year: number, value: number]>;
  yMin: number;
  yMax: number;
  source: ContextSeriesSource;
  /** For the demographics series: first projected year (dashed from here). */
  projectionFrom?: number;
  refLine?: ContextReferenceLine;
  /** Accent token name (e.g. "risk-red", "accent") used by the chart. */
  colorToken: "accent" | "risk-red";
}

export const CONTEXT_STATS: readonly ContextStat[] = [
  {
    key: "debt",
    headline: "112%",
    label: {
      fr: "Dette publique / PIB",
      en: "Public debt / GDP",
    },
    sourceNote: { fr: "2025 · Eurostat", en: "2025 · Eurostat" },
  },
  {
    key: "deficit",
    headline: "−5,5%",
    label: {
      fr: "Déficit budgétaire",
      en: "Budget deficit",
    },
    sourceNote: { fr: "2024 · INSEE", en: "2024 · INSEE" },
  },
  {
    key: "carbonNeutrality",
    headline: "2050",
    label: {
      fr: "Neutralité carbone",
      en: "Carbon neutrality",
    },
    sourceNote: {
      fr: "Objectif légal",
      en: "Legal target",
    },
  },
] as const;

// Values copied verbatim from the Landing Page.html prototype
// (`debtData` / `demoData` arrays). Sources below.
const DEBT_POINTS: ReadonlyArray<readonly [number, number]> = [
  [2000, 57], [2001, 56], [2002, 59], [2003, 63], [2004, 65], [2005, 67],
  [2006, 64], [2007, 64], [2008, 68], [2009, 83], [2010, 82], [2011, 85],
  [2012, 90], [2013, 93], [2014, 95], [2015, 95], [2016, 98], [2017, 98],
  [2018, 98], [2019, 97], [2020, 115], [2021, 113], [2022, 112], [2023, 110],
  [2024, 112], [2025, 112],
] as const;

const DEMO_POINTS: ReadonlyArray<readonly [number, number]> = [
  [2000, 16.1], [2005, 16.6], [2010, 17.0], [2015, 18.8], [2020, 20.8],
  [2025, 22.2], [2030, 24.0], [2035, 25.6], [2040, 27.0], [2045, 27.9],
  [2050, 28.8],
] as const;

export const CONTEXT_SERIES: readonly ContextSeries[] = [
  {
    key: "debt",
    title: {
      fr: "Dette publique / PIB",
      en: "Public debt / GDP",
    },
    headline: { fr: "112%", en: "112%" },
    points: DEBT_POINTS,
    yMin: 40,
    yMax: 125,
    colorToken: "risk-red",
    source: {
      label: { fr: "Eurostat · gov_10dd_edpt1", en: "Eurostat · gov_10dd_edpt1" },
      url: "https://ec.europa.eu/eurostat/databrowser/view/gov_10dd_edpt1/default/table",
    },
    refLine: {
      y: 60,
      label: {
        fr: "Critère 60% (Maastricht)",
        en: "Maastricht 60% criterion",
      },
    },
  },
  {
    key: "demographics",
    title: {
      fr: "Population 65 ans et plus",
      en: "Population aged 65+",
    },
    headline: { fr: "22% → 29%", en: "22% → 29%" },
    points: DEMO_POINTS,
    yMin: 13,
    yMax: 32,
    colorToken: "accent",
    projectionFrom: 2025,
    source: {
      label: { fr: "INSEE · projections démographiques", en: "INSEE · demographic projections" },
      url: "https://www.insee.fr/fr/statistiques/5893969",
    },
  },
] as const;

export function getContextSeries(key: ContextSeriesKey): ContextSeries {
  const match = CONTEXT_SERIES.find((s) => s.key === key);
  if (!match) {
    throw new Error(`Unknown context series: ${key}`);
  }
  return match;
}
