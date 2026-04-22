"use client";

// See docs/specs/website/landing-page.md §5.6
//
// Candidate card, discriminated union (analyzed | pending). Same outer
// shape for both variants to preserve symmetric scrutiny; the pending
// variant omits grade and axis and is NOT a link.

import { GradeBadge } from "@/components/widgets/GradeBadge";
import type { LandingCard } from "@/lib/landing-cards";
import { type Lang } from "@/lib/i18n";

interface Props {
  card: LandingCard;
  lang: Lang;
}

function formatDate(iso: string, lang: Lang): string {
  try {
    return new Date(iso).toLocaleDateString(lang === "fr" ? "fr-FR" : "en-GB", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

function PartyPill({
  partyShort,
  partyColor,
  party,
}: {
  partyShort: string;
  partyColor: string;
  party: string;
}) {
  return (
    <span
      className="inline-flex max-w-full items-center gap-1.5 text-text-tertiary uppercase truncate rounded px-2 py-[3px] text-[11px] font-bold uppercase tracking-wider"
      style={{
        background: `${partyColor}18`,
        border: `1px solid ${partyColor}40`,
      }}
    >
      <div className="w-2 h-2 rounded-full" style={{ background: partyColor }}></div>
      <span className="truncate">{partyShort} · {party}</span>
    </span>
  );
}

function AxisMiniBar({
  ecoAxis,
  partyColor,
  lang,
}: {
  ecoAxis: number | null;
  partyColor: string;
  lang: Lang;
}) {
  const percent =
    ecoAxis !== null ? ((ecoAxis + 5) / 10) * 100 : null;
  return (
    <div
      className="mt-3 flex items-center gap-2 text-[10px] uppercase tracking-wider text-text-tertiary"
      aria-label={lang === "fr" ? "Axe économique" : "Economic axis"}
    >
      <div className="relative h-[6px] flex-1 rounded-full bg-[color:var(--bg-subtle)]">
        {/* centre rule */}
        <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-[color:var(--rule)]" />
        {percent !== null ? (
          <div
            className="absolute top-1/2 h-[10px] w-[10px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/50"
            style={{
              left: `${percent}%`,
              background: partyColor,
            }}
            aria-hidden="true"
          />
        ) : (
          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[11px] text-text-tertiary"
            data-testid="axis-empty"
          >
            —
          </div>
        )}
      </div>
    </div>
  );
}

export default function CandidateCard({ card, lang }: Props) {
  const Inner = (
    <article
      className="relative flex h-full flex-col overflow-hidden rounded-lg border border-rule bg-[color:var(--bg-card)] py-4 hover:shadow-2xl hover:shadow-gray-500/20 hover:-translate-y-1"
      style={{ 
        transition: "opacity 0.55s cubic-bezier(0.16,1,0.3,1), transform 0.55s cubic-bezier(0.16,1,0.3,1), box-shadow 0.2s ease",
        willChange: "opacity, transform",
      }}
      data-testid="candidate-card"
      data-status={card.status}
      data-family={card.family ?? "none"}
      aria-label={
        card.status === "analyzed"
          ? `${card.displayName} — ${lang === "fr" ? "analyse disponible" : "analysis available"}`
          : `${card.displayName} — ${lang === "fr" ? "analyse à venir" : "analysis pending"}`
      }
      aria-disabled={card.status === "pending" ? true : undefined}
    >
      {/* party stripe */}
      <div
        className="absolute inset-x-0 top-0 h-[3px]"
        style={{ background: card.partyColor }}
        aria-hidden="true"
      />

      <div className="px-4 mb-3 mt-2 flex items-start justify-between gap-3">
        <PartyPill
          partyShort={card.partyShort}
          partyColor={card.partyColor}
          party={card.party}
        />
      </div>

      <h3 className="px-4 font-display text-2xl font-bold leading-tight tracking-tight text-text">
        {card.displayName}
      </h3>

      {card.status === "analyzed" ? (
        <>
          <h5 className="px-4 text-text-secondary text-sm mt-3">{card.spectrumLabel}</h5>
          <div className="px-4 flex items-center gap-4 my-6">
            <GradeBadge
              grade={card.overallGrade}
              modifier={card.overallGradeModifier}
              size="sm"
            />
            <div className="w-full">
              <div className="w-full flex justify-between uppercase text-text-secondary text-xs -mb-1">
                <div>Gauche</div>
                <div>Droite</div>
              </div>
              <AxisMiniBar
                ecoAxis={card.ecoAxis}
                partyColor={card.partyColor}
                lang={lang}
              />
            </div>
          </div>
          <div className="px-4 border-t border-rule mt-auto flex items-center justify-between gap-3 pt-4 text-sm text-text-tertiary">
            <span>{formatDate(card.versionDate, lang)}</span>
            <span className="text-accent font-bold">
              {lang === "fr" ? "Voir l\u2019analyse →" : "View analysis →"}
            </span>
          </div>
        </>
      ) : (
        <>
          <div className="mt-2 text-sm text-text-secondary">
            {/* spacer to keep cards vertically similar */}
            &nbsp;
          </div>
          <div className="mt-auto flex items-center justify-between gap-3 pt-4 text-xs text-text-tertiary">
            <span>
              {card.declaredDate
                ? formatDate(card.declaredDate, lang)
                : "\u2014"}
            </span>
          </div>
        </>
      )}
    </article>
  );

  if (card.status === "analyzed") {
    return (
      <a
        href={`/candidat/${card.id}`}
        className="block h-full rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        {Inner}
      </a>
    );
  }
  return <div className="h-full">{Inner}</div>;
}
