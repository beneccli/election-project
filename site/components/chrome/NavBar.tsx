// See docs/specs/website/nextjs-architecture.md §5.2
// Server component. Prototype reference: Candidate Page.html lines 664–683.
import Link from "next/link";
import type { CandidateMetadata } from "@/lib/schema";
import { LanguageToggle } from "./LanguageToggle";
import { ThemeToggle } from "./ThemeToggle";
import { t, UI_STRINGS, type Lang } from "@/lib/i18n";

export function NavBar({
  meta,
  lang = "fr",
}: {
  meta: CandidateMetadata;
  lang?: Lang;
}) {
  return (
    <header className="sticky top-0 z-[80] flex h-nav-h items-center border-b border-rule bg-bg">
      <div className="mx-auto flex w-full max-w-content items-center gap-4 px-8">
        <Link
          href={lang === "fr" ? "/" : `/${lang}`}
          className="flex-shrink-0 font-display text-2xl font-bold tracking-[-0.01em] text-accent no-underline"
        >
          é<span className="font-normal">lection</span> 2027
        </Link>
        <span className="flex-shrink-0 text-lg text-rule">·</span>
        <span className="overflow-hidden whitespace-nowrap text-[13px] font-medium text-text-secondary text-ellipsis">
          {meta.display_name}
        </span>
        <div className="flex-1" />
        <a
          href="#transparence=document"
          className="flex-shrink-0 text-xs font-medium text-text-secondary underline decoration-dotted underline-offset-4 hover:text-text"
          title={t(UI_STRINGS.NAV_OPEN_TRANSPARENCY, lang)}
        >
          {t(UI_STRINGS.NAV_TRANSPARENCE, lang)}
        </a>
        <LanguageToggle />
        <ThemeToggle />
      </div>
    </header>
  );
}
