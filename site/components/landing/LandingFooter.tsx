// See docs/specs/website/landing-page.md §5.9
// Server component. Brand + neutrality note + three links.

import Link from "next/link";
import { t, UI_STRINGS, type Lang } from "@/lib/i18n";

const DEFAULT_REPO_URL = "https://github.com/election-2027/election-2027";

export default function LandingFooter({ lang }: { lang: Lang }) {
  const repoUrl = process.env.NEXT_PUBLIC_REPO_URL ?? DEFAULT_REPO_URL;
  return (
    <footer className="border-t border-rule bg-bg px-6 py-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="font-display text-lg text-accent">
            é<span className="font-normal text-text-secondary">27</span>
          </div>
          <p className="mt-2 max-w-lg text-xs text-text-tertiary leading-relaxed">
            {t(UI_STRINGS.LANDING_FOOTER_NOTE, lang)}
          </p>
        </div>
        <nav
          aria-label={lang === "fr" ? "Liens bas de page" : "Footer links"}
          className="flex flex-wrap gap-5 text-xs text-text-secondary"
        >
          <Link
            href="#methode"
            className="underline decoration-dotted underline-offset-4 hover:text-text"
          >
            {t(UI_STRINGS.LANDING_LINK_METHOD, lang)}
          </Link>
          <a
            href={repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-dotted underline-offset-4 hover:text-text"
          >
            {t(UI_STRINGS.LANDING_LINK_REPO, lang)}
          </a>
          <Link
            href="/mentions-legales"
            className="underline decoration-dotted underline-offset-4 hover:text-text"
          >
            {t(UI_STRINGS.LANDING_LINK_LEGAL, lang)}
          </Link>
        </nav>
      </div>
    </footer>
  );
}
