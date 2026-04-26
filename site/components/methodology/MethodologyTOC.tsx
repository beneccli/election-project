// See docs/specs/website/methodology-page.md §3 (TOC) and §6.
import { t, UI_STRINGS, type Lang } from "@/lib/i18n";
import {
  METHODOLOGY_SECTION_IDS,
  type MethodologySectionId,
} from "@/lib/methodology-content";

const SECTION_LABEL: Record<MethodologySectionId, keyof typeof UI_STRINGS> = {
  hero: "METHODOLOGY_HERO_TITLE",
  pipeline: "METHODOLOGY_PIPELINE_TITLE",
  principes: "METHODOLOGY_PRINCIPLES_TITLE",
  positionnement: "METHODOLOGY_POSITIONING_TITLE",
  agregation: "METHODOLOGY_AGGREGATION_TITLE",
  dimensions: "METHODOLOGY_DIMENSIONS_TITLE",
  transparence: "METHODOLOGY_TRANSPARENCY_TITLE",
  "ce-que-non": "METHODOLOGY_NOT_THIS_TITLE",
  limites: "METHODOLOGY_LIMITS_TITLE",
  gouvernance: "METHODOLOGY_GOVERNANCE_TITLE",
};

export function MethodologyTOC({ lang }: { lang: Lang }) {
  return (
    <nav
      aria-label={t(UI_STRINGS.METHODOLOGY_TOC_TITLE, lang)}
      className="hidden lg:block sticky top-[calc(var(--nav-h)+1rem)] self-start"
    >
      <div className="rounded-md border border-rule bg-[color:var(--bg-card)] p-4 text-sm">
        <div className="mb-3 text-xs font-semibold uppercase tracking-[0.1em] text-text-tertiary">
          {t(UI_STRINGS.METHODOLOGY_TOC_TITLE, lang)}
        </div>
        <ol className="space-y-2">
          {METHODOLOGY_SECTION_IDS.map((id) => (
            <li key={id}>
              <a
                href={`#${id}`}
                className="text-text-secondary hover:text-accent underline-offset-4 hover:underline"
              >
                {t(UI_STRINGS[SECTION_LABEL[id]], lang)}
              </a>
            </li>
          ))}
        </ol>
      </div>
    </nav>
  );
}
