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

export default function LandingHero({
  lang,
}: Props) {
  return (
    <section className="px-6 py-12 md:py-16 border-b border-[color:var(--rule)]">
      <div className="mx-auto max-w-6xl">
        {/* Top row: title + body (left) · stats panel (right) */}
        <div className="grid gap-10 md:grid-cols-[minmax(0,1fr)_auto] md:gap-12 md:items-start mb-12">
          {/* Left: title + body */}
          <div className="flex flex-col gap-5">
            <p className="uppercase text-xs font-semibold tracking-widest text-accent">
              {lang === "fr" ? "Présidentielle française" : "French presidential election"}
            </p>
            <h1 className=" max-w-[640px] font-display text-4xl md:text-[clamp(38px,6vw,68px)] font-bold leading-[1.05] tracking-tight text-[color:var(--text)]">
              {t(HERO_TITLE_LEAD, lang)}
              <br />
              <em className="font-semibold italic text-[color:var(--accent)]">
                {t(HERO_TITLE_EM, lang)}
              </em>{" "}
              {t(HERO_TITLE_TAIL, lang)}
            </h1>
            <p className="max-w-prose max-w-[580px] text-base md:text-lg text-[color:var(--text-secondary)] leading-relaxed">
              {t(HERO_BODY, lang)}
            </p>
          </div>

          {/* Right: stats panel — vertical stack */}
          <ul
            className="flex-shrink-0 min-w-[240px] rounded-lg border border-[color:var(--rule)] overflow-hidden"
            data-testid="hero-stats"
          >
            {CONTEXT_STATS.map((s, i) => {
              const textColor = i == 0 ? "text-red-800" : i == 1 ? "text-orange-800" : "text-black dark:text-white";
              return (
                <li
                  key={s.key}
                  className="px-5 py-4 border-b border-[color:var(--rule)] last:border-b-0"
                >
                  <div className={`font-display text-4xl font-bold leading-none tracking-tight text-[color:var(--text)] ${textColor}`}>
                    {s.headline}
                  </div>
                  <div className="mt-1 text-xs font-semibold uppercase tracking-[0.07em] text-[color:var(--text-tertiary)]">
                    {t(s.label, lang)}
                  </div>
                  <div className="mt-0.5 text-xs text-[color:var(--text-tertiary)]">
                    {t(s.sourceNote, lang)}
                  </div>
                </li>
              )
            })}
          </ul>
        </div>

        {/* Charts row: two panels side by side */}
        <div
          className="grid grid-cols-1 sm:grid-cols-2 rounded-lg border border-[color:var(--rule)] overflow-hidden"
          data-testid="hero-charts"
        >
          {CONTEXT_SERIES.map((series, i) => (
            <div
              key={series.key}
              className={`p-5 ${i < CONTEXT_SERIES.length - 1 ? " sm:border-r border-b sm:border-b-0 border-[color:var(--rule)]" : ""}`}
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <span className="text-xs font-bold uppercase tracking-[0.08em] text-[color:var(--text-tertiary)]">
                  {t(series.title, lang)}
                </span>
                <span className={`font-display text-lg font-bold ${i == 0 ? "text-red-700" : "text-blue-700"}`}>
                  {t(series.headline, lang)}
                </span>
              </div>
              <StakesAreaChart series={series} lang={lang} />
            </div>
          ))}
        </div>

        {/* Count divider */}
        {/* <div
          className="text-center text-sm text-[color:var(--text-tertiary)]"
          data-testid="count-divider"
        >
          {countLabel(analyzedCount, pendingCount, lang)}
        </div> */}
      </div>
    </section>
  );
}
