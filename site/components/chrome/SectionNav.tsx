"use client";

// See docs/specs/website/nextjs-architecture.md §5.2
// Prototype reference: Candidate Page.html lines 741–762.
import { useEffect, useState } from "react";
import { useLang } from "@/lib/lang-context";

type Item = { id: string; fr: string; en: string };

const ITEMS: Item[] = [
  { id: "synthese", fr: "Synthèse", en: "Summary" },
  { id: "positionnement", fr: "Positionnement", en: "Positioning" },
  { id: "dimensions", fr: "Domaines", en: "Domains" },
  { id: "intergen", fr: "Générations", en: "Generations" },
  { id: "risques", fr: "Risques", en: "Risks" },
];

export function SectionNav() {
  const { lang } = useLang();
  const [active, setActive] = useState<string>(ITEMS[0].id);

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setActive(e.target.id);
            break;
          }
        }
      },
      { rootMargin: "-25% 0px -65% 0px" },
    );
    for (const item of ITEMS) {
      const el = document.getElementById(item.id);
      if (el) obs.observe(el);
    }
    return () => obs.disconnect();
  }, []);

  return (
    <nav className="sticky top-nav-h z-[70] h-section-nav-h border-b border-rule bg-bg">
      <div className="mx-auto flex h-full max-w-content items-center overflow-x-auto px-8">
        {ITEMS.map((item) => {
          const isActive = active === item.id;
          return (
            <a
              key={item.id}
              href={`#${item.id}`}
              className={[
                "flex h-full items-center whitespace-nowrap border-b-2 px-4 text-xs font-semibold tracking-wide transition-colors",
                isActive
                  ? "border-accent text-accent"
                  : "border-transparent text-text-secondary hover:text-text",
              ].join(" ")}
              aria-current={isActive ? "location" : undefined}
            >
              {lang === "fr" ? item.fr : item.en}
            </a>
          );
        })}
      </div>
    </nav>
  );
}
