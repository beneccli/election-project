// See docs/specs/website/methodology-page.md §3.7.
import { t, UI_STRINGS, type Lang } from "@/lib/i18n";
import { REPO_URL } from "@/lib/methodology-content";

interface LinkRow {
  href: string;
  labelKey: keyof typeof UI_STRINGS;
}

export function TransparencyLinksSection({ lang }: { lang: Lang }) {
  const rows: readonly LinkRow[] = [
    {
      href: REPO_URL,
      labelKey: "METHODOLOGY_TRANSPARENCY_LINK_REPO",
    },
    {
      href: `${REPO_URL}/tree/main/candidates`,
      labelKey: "METHODOLOGY_TRANSPARENCY_LINK_ARTIFACTS",
    },
    {
      href: `${REPO_URL}/tree/main/prompts`,
      labelKey: "METHODOLOGY_TRANSPARENCY_LINK_PROMPTS",
    },
    {
      href: `${REPO_URL}/blob/main/docs/specs/analysis/editorial-principles.md`,
      labelKey: "METHODOLOGY_TRANSPARENCY_LINK_EDITORIAL",
    },
    {
      href: `${REPO_URL}/tree/main/site/components/methodology`,
      labelKey: "METHODOLOGY_TRANSPARENCY_LINK_PAGE_SOURCE",
    },
  ];
  return (
    <section id="transparence" className="px-6 py-12 border-b border-rule">
      <div className="mx-auto max-w-4xl">
        <h2 className="font-display text-2xl font-bold text-text">
          {t(UI_STRINGS.METHODOLOGY_TRANSPARENCY_TITLE, lang)}
        </h2>
        <p className="mt-4 max-w-prose text-sm leading-relaxed text-text-secondary">
          {t(UI_STRINGS.METHODOLOGY_TRANSPARENCY_INTRO, lang)}
        </p>
        <ul className="mt-6 space-y-2 text-sm">
          {rows.map((row) => (
            <li key={row.labelKey}>
              <a
                href={row.href}
                rel="noreferrer noopener"
                target="_blank"
                className="text-accent underline decoration-dotted underline-offset-4"
              >
                {t(UI_STRINGS[row.labelKey], lang)}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
