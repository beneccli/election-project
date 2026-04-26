// See docs/specs/website/methodology-page.md §3.2.
//
// Server-rendered SVG flow diagram on lg+, vertical card stack on
// smaller viewports. No client JS. The data comes from
// `methodology-content.ts`; this component never embeds copy.

import { t, UI_STRINGS, type Lang } from "@/lib/i18n";
import { PIPELINE_STAGES } from "@/lib/methodology-content";

export function PipelineDiagram({ lang }: { lang: Lang }) {
  return (
    <section id="pipeline" className="px-6 py-12 border-b border-rule">
      <div className="mx-auto max-w-5xl">
        <h2 className="font-display text-2xl font-bold text-text">
          {t(UI_STRINGS.METHODOLOGY_PIPELINE_TITLE, lang)}
        </h2>
        <p className="mt-3 max-w-prose text-sm text-text-secondary">
          {t(UI_STRINGS.METHODOLOGY_PIPELINE_INTRO, lang)}
        </p>
        <ol className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {PIPELINE_STAGES.map((stage, idx) => (
            <li
              key={stage.key}
              className="relative rounded-md border border-rule bg-[color:var(--bg-card)] p-4"
              data-pipeline-stage={stage.key}
            >
              <div className="text-xs font-semibold uppercase tracking-[0.1em] text-text-tertiary">
                {String(idx + 1).padStart(2, "0")}
              </div>
              <h3 className="mt-1 font-display text-base font-semibold text-text">
                {t(UI_STRINGS[stage.titleKey], lang)}
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-text-secondary">
                {t(UI_STRINGS[stage.bodyKey], lang)}
              </p>
              <div className="mt-3 flex flex-wrap gap-3 text-xs">
                {stage.artifactHref ? (
                  <a
                    href={stage.artifactHref}
                    rel="noreferrer noopener"
                    target="_blank"
                    className="text-accent underline decoration-dotted underline-offset-4"
                  >
                    {t(UI_STRINGS.METHODOLOGY_PIPELINE_ARTIFACT_LABEL, lang)}
                  </a>
                ) : null}
                <a
                  href={stage.specHref}
                  rel="noreferrer noopener"
                  target="_blank"
                  className="text-text-secondary underline decoration-dotted underline-offset-4 hover:text-text"
                >
                  {t(UI_STRINGS.METHODOLOGY_PIPELINE_SPEC_LABEL, lang)}
                </a>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
