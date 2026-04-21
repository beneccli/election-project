// See docs/specs/website/nextjs-architecture.md §5.2
// Server component. Prototype reference: Candidate Page.html lines 664–683.
import Link from "next/link";
import type { CandidateMetadata } from "@/lib/schema";
import { LanguageToggle } from "./LanguageToggle";
import { ThemeToggle } from "./ThemeToggle";

export function NavBar({ meta }: { meta: CandidateMetadata }) {
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
          {meta.display_name}
        </span>
        <div className="flex-1" />
        <a
          href="#transparence=document"
          className="flex-shrink-0 text-xs font-medium text-text-secondary underline decoration-dotted underline-offset-4 hover:text-text"
          title="Ouvrir la transparence complète"
        >
          Transparence
        </a>
        <LanguageToggle />
        <ThemeToggle />
      </div>
    </header>
  );
}
