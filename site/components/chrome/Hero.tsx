// See docs/specs/website/nextjs-architecture.md §5.2
// Server component. Prototype reference: Candidate Page.html lines 685–739.
import type {
  AggregatedOutput,
  CandidateMetadata,
  VersionMetadata,
} from "@/lib/schema";
import { deriveTopLevelGrade } from "@/lib/derived/top-level-grade";
import { GradeBadge } from "@/components/widgets/GradeBadge";

type PartyMeta = CandidateMetadata & {
  party_short?: string;
  party_color?: string;
};

export function Hero({
  meta,
  versionMeta,
  aggregated,
}: {
  meta: CandidateMetadata;
  versionMeta: VersionMetadata;
  aggregated: AggregatedOutput;
}) {
  const p = meta as PartyMeta;
  const partyShort = p.party_short ?? meta.party.slice(0, 2).toUpperCase();
  const partyColor = p.party_color ?? "var(--accent)";
  const grade = deriveTopLevelGrade(aggregated);
  const modelIds = Object.keys(versionMeta.analysis?.models ?? {});

  return (
    <div className="border-b border-rule bg-bg">
      <div className="mx-auto max-w-content px-8 pb-10 pt-12">
        <div className="grid grid-cols-[72px_1fr] items-start gap-7">
          {/* Photo slot */}
          <div
            className="flex h-[72px] w-[72px] flex-shrink-0 flex-col items-center justify-center rounded-md border border-rule bg-bg-subtle"
            aria-hidden="true"
          >
            <div className="text-2xl opacity-20">◻</div>
            <div className="mt-[3px] text-[8px] tracking-wider text-text-tertiary">
              photo
            </div>
          </div>

          <div>
            <div className="mb-2.5 flex items-center gap-2.5">
              <span
                className="inline-flex items-center gap-1.5 rounded-sm px-2.5 py-[3px] text-[11px] font-bold uppercase tracking-wider"
                style={{
                  background: `${partyColor}18`,
                  border: `1px solid ${partyColor}40`,
                  color: partyColor,
                }}
              >
                {partyShort}
                <span className="font-normal normal-case">{meta.party}</span>
              </span>
            </div>
            <h1 className="mb-5 font-display text-[clamp(28px,4vw,44px)] font-bold leading-[1.1] tracking-[-0.01em] text-text">
              {meta.display_name}
            </h1>
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-3">
                <GradeBadge grade={grade.letter} modifier={grade.modifier} size="md" />
                <div>
                  <div className="mb-0.5 text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
                    Note globale
                  </div>
                  <div className="text-xs text-text-secondary">
                    Cohérence &amp; financement
                  </div>
                </div>
              </div>
              <div className="h-9 w-px flex-shrink-0 bg-rule" />
              <div>
                <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
                  Modèles IA
                </div>
                <div className="flex flex-wrap gap-2">
                  {modelIds.map((id) => (
                    <span
                      key={id}
                      className="inline-flex items-center gap-1 text-[11px] text-text-secondary"
                    >
                      <span
                        className="inline-block h-1.5 w-1.5 rounded-full bg-accent"
                        aria-hidden="true"
                      />
                      {id.split(/[-_]/)[0]}
                    </span>
                  ))}
                </div>
              </div>
              <div className="h-9 w-px flex-shrink-0 bg-rule" />
              <div>
                <div className="mb-0.5 text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
                  Mis à jour
                </div>
                <div className="text-xs text-text-secondary">
                  {versionMeta.version_date}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Inline grade badge previously defined here was replaced by the shared
// `@/components/widgets/GradeBadge` component in task 0060.
