// See docs/specs/website/comparison-page.md §4 (page shell).
// Server component analogue of NavBar for the /comparer page, where
// there is no single candidate meta.
import Link from "next/link";
import { LanguageToggle } from "./LanguageToggle";
import { ThemeToggle } from "./ThemeToggle";

export function ComparisonNavBar() {
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
          Comparer les programmes
        </span>
        <div className="flex-1" />
        <Link
          href="/"
          className="flex-shrink-0 text-xs font-medium text-text-secondary underline decoration-dotted underline-offset-4 hover:text-text"
        >
          Accueil
        </Link>
        <LanguageToggle />
        <ThemeToggle />
      </div>
    </header>
  );
}
