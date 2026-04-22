"use client";

// See docs/specs/website/landing-page.md §5.5
//
// Filter pills + responsive grid. Filter state is local (no URL, no
// localStorage). `IntersectionObserver` fades cards in as they enter
// the viewport; `prefers-reduced-motion` short-circuits the animation.

import { useEffect, useMemo, useRef, useState } from "react";
import type { LandingCard, LandingFamily } from "@/lib/landing-cards";
import { type Lang } from "@/lib/i18n";
import CandidateCard from "./CandidateCard";

type FilterBucket = "all" | LandingFamily;

interface Props {
  cards: LandingCard[];
  lang: Lang;
}

const FILTER_LABELS: Record<FilterBucket, { fr: string; en: string }> = {
  all: { fr: "Tous", en: "All" },
  gauche: { fr: "Gauche", en: "Left" },
  centre: { fr: "Centre", en: "Centre" },
  droite: { fr: "Droite", en: "Right" },
  ecologie: { fr: "Écologie", en: "Ecology" },
};

const FILTER_ORDER: FilterBucket[] = [
  "all",
  "gauche",
  "centre",
  "droite",
  "ecologie",
];

function matchesFilter(card: LandingCard, filter: FilterBucket): boolean {
  if (filter === "all") return true;
  return card.family === filter;
}

export default function CandidateGrid({ cards, lang }: Props) {
  const [filter, setFilter] = useState<FilterBucket>("all");
  const gridRef = useRef<HTMLDivElement | null>(null);

  const visible = useMemo(
    () => cards.filter((c) => matchesFilter(c, filter)),
    [cards, filter],
  );

  // IntersectionObserver fade-in
  useEffect(() => {
    if (typeof window === "undefined") return;
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const root = gridRef.current;
    if (!root) return;

    const items = Array.from(
      root.querySelectorAll<HTMLElement>("[data-landing-slot]"),
    );
    if (reduced) {
      items.forEach((el) => {
        el.style.opacity = "1";
        el.style.transform = "none";
      });
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            const el = e.target as HTMLElement;
            el.style.opacity = "1";
            el.style.transform = "translateY(0)";
            io.unobserve(el);
          }
        }
      },
      { threshold: 0.1 },
    );

    items.forEach((el) => {
      el.style.opacity = "0";
      el.style.transform = "translateY(8px)";
      el.style.transition = "opacity 200ms ease-out, transform 200ms ease-out";
      io.observe(el);
    });
    return () => io.disconnect();
  }, [visible]);

  return (
    <section className="px-6 py-8">
      <div className="mx-auto max-w-6xl">
        <div
          role="radiogroup"
          aria-label={lang === "fr" ? "Filtrer par famille" : "Filter by family"}
          className="mb-8 flex flex-wrap items-center gap-2"
        >
          <p className="uppercase text-xs font-semibold text-text-secondary mr-3 tracking-widest">Famille politique</p>
          {FILTER_ORDER.map((key) => {
            const active = filter === key;
            return (
              <button
                key={key}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setFilter(key)}
                className={[
                  "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  active
                    ? "bg-accent text-white border-accent"
                    : "border-rule text-text-secondary hover:text-text",
                ].join(" ")}
              >
                {FILTER_LABELS[key][lang]}
              </button>
            );
          })}
        </div>

        <div
          ref={gridRef}
          className="grid grid-cols-1 gap-5 min-[440px]:grid-cols-2 min-[720px]:grid-cols-3 min-[1024px]:grid-cols-4"
          data-testid="candidate-grid"
        >
          {visible.map((card, i) => (
            <div key={card.id} data-landing-slot>
              <CandidateCard card={card} lang={lang} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
