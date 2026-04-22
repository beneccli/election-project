// See docs/specs/website/landing-page.md §5.2
// Server component. Mirrors ComparisonNavBar but shows the landing
// tagline instead of a section title, and drops the "Accueil" link.
import Link from "next/link";
import { LanguageToggle } from "./LanguageToggle";
import { ThemeToggle } from "./ThemeToggle";
import { t, UI_STRINGS, type Lang } from "@/lib/i18n";

export function LandingNavBar({ lang = "fr" }: { lang?: Lang } = {}) {
  return (
    <header className="sticky top-0 z-[80] flex h-nav-h items-center border-b border-rule bg-bg">
      <div className="mx-auto flex w-full max-w-content items-center gap-4 px-8">
        <Link
          href="/"
          className="flex-shrink-0 font-display text-xl font-bold tracking-[-0.01em] text-accent no-underline"
        >
          é<span className="font-normal">27</span>
        </Link>
        <span className="flex-shrink-0 text-lg text-rule">·</span>
        <span className="overflow-hidden whitespace-nowrap text-[13px] font-medium text-text-secondary text-ellipsis">
          {t(UI_STRINGS.LANDING_NAV_TAGLINE, lang)}
        </span>
        <div className="flex-1" />
        <LanguageToggle />
        <ThemeToggle />
      </div>
    </header>
  );
}
