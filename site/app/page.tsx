// See docs/specs/website/nextjs-architecture.md §1 — placeholder landing page
// The real landing page ships with milestone M_Landing. A minimal CTA
// to the /comparer route is added by M_Comparison task 0098.
import Link from "next/link";
import { listCandidates } from "@/lib/candidates";

export default function HomePage() {
  const compareCtaHref = buildCompareCtaHref();
  return (
    <main className="mx-auto max-w-content px-6 py-16">
      <h1 className="font-display text-4xl font-bold text-text">
        Élection 2027
      </h1>
      <p className="mt-4 text-text-secondary">
        Site en construction — milestone M_WebsiteCore.
      </p>
      <div className="mt-8">
        <Link
          href={compareCtaHref}
          data-cta="compare"
          className="inline-flex items-center gap-2 rounded border border-accent bg-accent px-4 py-2 text-sm font-semibold uppercase tracking-wide text-bg no-underline transition-colors hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
        >
          Comparer plusieurs candidats
          <span aria-hidden>›</span>
        </Link>
      </div>
    </main>
  );
}

/**
 * Build `/comparer?c=<id1>&c=<id2>` pre-selecting the two most recently
 * updated analyzable candidates, so the CTA lands on a page that
 * already has a populated comparison. Falls back to `/comparer` when
 * fewer than two analyzable candidates are available.
 *
 * Editorial: ordering is by `updated` recency, NOT by any score — the
 * landing page must never insinuate a ranking.
 */
function buildCompareCtaHref(): string {
  const entries = listCandidates();
  const sorted = [...entries].sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt),
  );
  const picks = sorted.slice(0, 2).map((e) => e.id);
  if (picks.length === 0) return "/comparer";
  const qs = picks.map((id) => `c=${encodeURIComponent(id)}`).join("&");
  return `/comparer?${qs}`;
}
