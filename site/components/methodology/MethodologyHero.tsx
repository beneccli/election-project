// See docs/specs/website/methodology-page.md §3.1.
import { t, UI_STRINGS, type Lang } from "@/lib/i18n";

export function MethodologyHero({ lang }: { lang: Lang }) {
  return (
    <section
      id="hero"
      className="border-b border-rule px-6 py-12 md:py-16"
    >
      <div className="mx-auto max-w-4xl">
        <div className="mb-3 font-sans text-sm font-semibold uppercase tracking-[0.12em] text-accent">
          {t(UI_STRINGS.LANDING_LINK_METHOD, lang)}
        </div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-text md:text-4xl">
          {t(UI_STRINGS.METHODOLOGY_HERO_TITLE, lang)}
        </h1>
        <p className="mt-3 max-w-prose text-base text-text-secondary">
          {t(UI_STRINGS.METHODOLOGY_HERO_TAGLINE, lang)}
        </p>
        <p className="mt-6 max-w-prose text-sm leading-relaxed text-text-secondary">
          {t(UI_STRINGS.METHODOLOGY_HERO_BODY, lang)}
        </p>
      </div>
    </section>
  );
}
