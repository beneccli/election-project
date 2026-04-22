// See docs/specs/website/landing-page.md §5.3
//
// Hero band: emphatic title, body copy, stats panel (three tiles), and
// a two-up area-charts row. Headline stats render in the DEFAULT text
// color — no red/amber classes (editorial adjustment vs prototype,
// spec §2 and §3.2).

import { CONTEXT_STATS, CONTEXT_SERIES } from "@/lib/landing-context";
import { t, type Lang } from "@/lib/i18n";
import StakesAreaChart from "./StakesAreaChart";

interface Props {
  lang: Lang;
  analyzedCount: number;
  pendingCount: number;
}

// Local copy strings. Consolidated into UI_STRINGS in task 0116.
const HERO_TITLE_LEAD = { fr: "Que proposent", en: "What are the candidates" };
const HERO_TITLE_EM = { fr: "vraiment", en: "actually" };
const HERO_TITLE_TAIL = {
  fr: "les candidats à l\u2019Élysée\u00a0?",
  en: "proposing for France\u00a0?",
};
const HERO_BODY = {
  fr: "Chaque programme analysé par 4 à 5 grands modèles d\u2019IA sur des dimensions identiques. Les désaccords entre modèles sont préservés. Les sources, prompts et sorties brutes sont publics. L\u2019objectif\u00a0: l\u2019analyse, pas l\u2019advocacy.",
  en: "Every programme analysed by 4–5 frontier AI models on identical dimensions. Disagreement between models preserved. Sources, prompts and raw outputs are public. The goal: analysis, not advocacy.",
};

function countLabel(n: number, m: number, lang: Lang): string {
  return lang === "fr"
    ? `${n} candidats analysés · ${m} à venir`
    : `${n} candidates analysed · ${m} to come`;
}

export default function LandingHero({
  lang,
  analyzedCount,
  pendingCount,
}: Props) {
  return (
    <section className="px-6 py-12 md:py-16 border-b border-[color:var(--rule)]">
      <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] md:gap-12">
        {/* Left column: title + body + stats */}
        <div className="flex flex-col gap-6">
          <h1 className="font-display text-4xl md:text-5xl leading-[1.05] tracking-tight text-[color:var(--text)]">
            {t(HERO_TITLE_LEAD, lang)}
            <br />
            <em className="not-italic italic text-[color:var(--accent)]">
              {t(HERO_TITLE_EM, lang)}
            </em>{" "}
            {t(HERO_TITLE_TAIL, lang)}
          </h1>

          <p className="max-w-prose text-base md:text-lg text-[color:var(--text-secondary)] leading-relaxed">
            {t(HERO_BODY, lang)}
          </p>

          <ul
            className="mt-2 grid gap-4 sm:grid-cols-3"
            data-testid="hero-stats"
          >
            {CONTEXT_STATS.map((s) => (
              <li
                key={s.key}
                className="rounded-lg border border-[color:var(--rule)] bg-[color:var(--bg-card)] p-4"
              >
                <div className="text-2xl font-semibold text-[color:var(--text)]">
                  {s.headline}
                </div>
                <div className="mt-1 text-sm text-[color:var(--text-secondary)]">
                  {t(s.label, lang)}
                </div>
                <div className="mt-1 text-xs text-[color:var(--text-tertiary)]">
                  {t(s.sourceNote, lang)}
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Right column: charts */}
        <div className="flex flex-col gap-6" data-testid="hero-charts">
          {CONTEXT_SERIES.map((series) => (
            <div
              key={series.key}
              className="rounded-lg border border-[color:var(--rule)] bg-[color:var(--bg-card)] p-4"
            >
              <div className="mb-2 flex items-baseline justify-between gap-3">
                <h2 className="font-display text-lg text-[color:var(--text)]">
                  {t(series.title, lang)}
                </h2>
                <span className="text-sm font-medium text-[color:var(--text-secondary)]">
                  {t(series.headline, lang)}
                </span>
              </div>
              <StakesAreaChart series={series} lang={lang} />
            </div>
          ))}
        </div>
      </div>

      <div
        className="mx-auto mt-10 max-w-6xl text-center text-sm text-[color:var(--text-tertiary)]"
        data-testid="count-divider"
      >
        {countLabel(analyzedCount, pendingCount, lang)}
      </div>
    </section>
  );
}
