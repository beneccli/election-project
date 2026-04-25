// See docs/specs/website/comparison-page.md §4 (page shell).
// Server component analogue of NavBar for the /comparer page, where
// there is no single candidate meta.
import Link from "next/link";
import { LanguageToggle } from "./LanguageToggle";
import { ThemeToggle } from "./ThemeToggle";
import { t, UI_STRINGS, type Lang } from "@/lib/i18n";

export function ComparisonNavBar({ lang = "fr" }: { lang?: Lang } = {}) {
  return (
    <header className="sticky px-6 top-0 z-[80] flex h-nav-h items-center border-b border-rule bg-bg">
      <div className="mx-auto flex w-full max-w-5xl items-center gap-4">
        <Link
          href={lang === "fr" ? "/" : `/${lang}`}
          className="flex-shrink-0 font-display text-2xl font-bold tracking-[-0.01em] text-accent no-underline"
        >
          é<span className="font-normal">lection</span> 2027
        </Link>
        <span className="flex-shrink-0 text-lg text-rule">·</span>
        <span className="overflow-hidden whitespace-nowrap text-[13px] font-medium text-text-secondary text-ellipsis">
          {t(UI_STRINGS.LANDING_COMPARE_TITLE, lang)}
        </span>
        <div className="flex-1" />
        <Link
          href={lang === "fr" ? "/" : `/${lang}`}
          className="flex-shrink-0 text-xs font-medium text-text-secondary underline decoration-dotted underline-offset-4 hover:text-text"
        >
          {t(UI_STRINGS.NAV_HOME, lang)}
        </Link>
        <LanguageToggle />
        <ThemeToggle lang={lang} />
      </div>
    </header>
  );
}
