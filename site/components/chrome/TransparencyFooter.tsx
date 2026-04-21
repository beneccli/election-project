// Transparency footer — task 0063.
// See docs/specs/website/nextjs-architecture.md §5.2
// See docs/specs/website/transparency.md
//
// Editorial rules:
//  • Every prompt SHA256 is shown in full (never truncated) — the hash is
//    the verifiability hook.
//  • Every model is shown with its exact version string.
//  • Human review status is surfaced even when incomplete; the publish gate
//    normally prevents that state from shipping but the footer renders
//    defensively.
import type { VersionMetadata } from "@/lib/schema";

export function TransparencyFooter({
  id,
  versionMeta,
}: {
  id: string;
  versionMeta: VersionMetadata;
}) {
  const models = versionMeta.analysis?.models ?? {};
  const modelEntries = Object.entries(models);
  const modelCount = modelEntries.length;

  const analysis = versionMeta.analysis;
  const aggregation = versionMeta.aggregation;
  const agg = aggregation?.aggregator_model;

  const artifactBase = `/candidates/${id}/${versionMeta.version_date}`;

  return (
    <footer className="mt-24 border-t border-rule bg-bg-subtle">
      <div className="mx-auto max-w-content px-8 py-12 text-sm text-text-secondary">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="text-sm font-bold uppercase tracking-[0.2em] text-accent">
            Transparence
          </div>
          <a
            href="#transparence=document"
            className="inline-flex items-center gap-2 rounded-sm border border-accent bg-accent px-4 py-2 text-xs font-semibold uppercase tracking-wider text-bg no-underline transition-colors hover:bg-accent/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
            data-transparency-trigger="footer-primary"
          >
            Ouvrir la transparence complète
          </a>
        </div>

        <p className="mb-8 text-base text-text">
          Cette analyse a été produite par{" "}
          <strong className="text-text">{modelCount}</strong>{" "}
          {modelCount > 1 ? "modèles d’IA" : "modèle d’IA"} analysant
          indépendamment le programme du candidat au{" "}
          {versionMeta.version_date}.
        </p>

        {/* Models */}
        <section className="mb-8">
          <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-text-tertiary">
            Modèles d’analyse
          </h3>
          {modelEntries.length === 0 ? (
            <p className="text-text-tertiary">Aucun modèle enregistré.</p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {modelEntries.map(([modelId, entry]) => (
                <li
                  key={modelId}
                  className="inline-flex items-center gap-2 rounded-full border border-rule bg-bg px-3 py-1.5 text-xs"
                  title={`run_at ${entry.run_at}`}
                >
                  <span className="font-semibold text-text">{modelId}</span>
                  <span className="text-text-tertiary">·</span>
                  <span>{entry.provider}</span>
                  <span className="text-text-tertiary">·</span>
                  <span className="font-mono">{entry.exact_version}</span>
                  <span className="text-text-tertiary">·</span>
                  <StatusBadge status={entry.status} />
                  <span className="text-text-tertiary">·</span>
                  <span>{entry.execution_mode}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Prompt hashes */}
        <section className="mb-8 grid gap-4 md:grid-cols-2">
          <HashBlock
            label="SHA256 du prompt d’analyse"
            version={analysis?.prompt_version}
            file={analysis?.prompt_file}
            hash={analysis?.prompt_sha256}
          />
          <HashBlock
            label="SHA256 du prompt d’agrégation"
            version={aggregation?.prompt_version}
            file={aggregation?.prompt_file}
            hash={aggregation?.prompt_sha256}
          />
        </section>

        {/* Aggregator attestation */}
        {agg ? (
          <section className="mb-8">
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-text-tertiary">
              Agrégateur
            </h3>
            <div className="rounded-md border border-rule bg-bg p-4 text-xs">
              <dl className="grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-2">
                <Field label="Fournisseur" value={agg.provider} />
                <Field label="Version exacte" value={agg.exact_version} mono />
                <Field label="Mode d’exécution" value={agg.execution_mode} />
                <Field label="Exécuté le" value={agg.run_at} mono />
                {agg.attested_by ? (
                  <Field label="Attesté par" value={agg.attested_by} />
                ) : null}
                {agg.attested_model_version ? (
                  <Field
                    label="Version attestée"
                    value={agg.attested_model_version}
                    mono
                  />
                ) : null}
              </dl>
            </div>
          </section>
        ) : null}

        {/* Human review badge */}
        <section className="mb-8">
          <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-text-tertiary">
            Revue humaine
          </h3>
          <ReviewBadge aggregation={aggregation} />
        </section>

        {/* Downloads */}
        <section className="mb-8">
          <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-text-tertiary">
            Téléchargements
          </h3>
          <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <li>
              <DownloadLink href={`${artifactBase}/aggregated.json`}>
                aggregated.json
              </DownloadLink>
            </li>
            <li>
              <DownloadLink href={`${artifactBase}/metadata.json`}>
                metadata.json
              </DownloadLink>
            </li>
            <li>
              <DownloadLink href={`${artifactBase}/sources.md`}>
                sources.md
              </DownloadLink>
            </li>
            <li>
              <DownloadLink href={`${artifactBase}/raw-outputs/`}>
                raw-outputs/
              </DownloadLink>
            </li>
          </ul>
        </section>

        {/* Methodology */}
        <details className="group rounded-md border border-rule bg-bg p-4">
          <summary className="cursor-pointer text-sm font-semibold text-text">
            Comment ces données ont été produites
          </summary>
          <div className="mt-3 space-y-2 text-xs text-text-secondary">
            <p>
              Le programme du candidat est consolidé à partir de sources
              publiques (voir <code className="font-mono">sources.md</code>),
              puis soumis indépendamment à chaque modèle via un prompt
              versionné. Les réponses brutes (
              <code className="font-mono">raw-outputs/</code>) sont ensuite
              agrégées sans moyennage cardinal du positionnement et avec
              préservation des désaccords inter-modèles.
            </p>
            <p>
              Les hachages SHA256 ci-dessus permettent de vérifier que les
              prompts publiés dans le dépôt correspondent exactement à ceux
              utilisés pour cette analyse.
            </p>
            <p>
              <a
                href="/methodologie"
                className="text-accent underline-offset-2 hover:underline"
              >
                Méthodologie complète →
              </a>
            </p>
          </div>
        </details>
      </div>
    </footer>
  );
}

function StatusBadge({ status }: { status: string }) {
  const ok = status === "success";
  return (
    <span
      className="rounded px-1.5 py-0.5 text-xs font-semibold uppercase tracking-wider"
      style={
        ok
          ? {
              backgroundColor:
                "color-mix(in oklch, var(--accent) 12%, transparent)",
              color: "var(--accent)",
            }
          : {
              backgroundColor:
                "color-mix(in oklch, var(--risk-red) 12%, transparent)",
              color: "var(--risk-red)",
            }
      }
    >
      {status}
    </span>
  );
}

function HashBlock({
  label,
  version,
  file,
  hash,
}: {
  label: string;
  version?: string;
  file?: string;
  hash?: string;
}) {
  return (
    <div className="rounded-md border border-rule bg-bg p-4">
      <div className="mb-2 flex items-baseline justify-between gap-3 text-xs">
        <span className="font-bold uppercase tracking-wider text-text-tertiary">
          {label}
        </span>
        {version ? (
          <span className="text-text-tertiary">v{version}</span>
        ) : null}
      </div>
      {file ? (
        <div className="mb-1 font-mono text-xs text-text-tertiary">
          {file}
        </div>
      ) : null}
      {hash ? (
        <code className="block break-all font-mono text-xs leading-relaxed text-text">
          {hash}
        </code>
      ) : (
        <span className="text-text-tertiary">non disponible</span>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex gap-2">
      <dt className="min-w-[7rem] text-text-tertiary">{label}</dt>
      <dd className={mono ? "font-mono text-text" : "text-text"}>{value}</dd>
    </div>
  );
}

function ReviewBadge({
  aggregation,
}: {
  aggregation: VersionMetadata["aggregation"];
}) {
  if (aggregation?.human_review_completed) {
    const parts: string[] = [];
    if (aggregation.reviewed_at) parts.push(aggregation.reviewed_at);
    if (aggregation.reviewer) parts.push(`par ${aggregation.reviewer}`);
    return (
      <div
        className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-xs font-medium"
        style={{
          borderColor:
            "color-mix(in oklch, var(--accent) 40%, transparent)",
          backgroundColor:
            "color-mix(in oklch, var(--accent) 8%, transparent)",
          color: "var(--accent)",
        }}
      >
        <span aria-hidden="true">✓</span>
        <span>
          Revue humaine terminée{parts.length ? ` — ${parts.join(" ")}` : ""}
        </span>
      </div>
    );
  }
  return (
    <div
      className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-xs font-medium"
      style={{
        borderColor: "oklch(75% 0.15 85 / 0.45)",
        backgroundColor: "oklch(75% 0.15 85 / 0.12)",
        color: "oklch(55% 0.15 85)",
      }}
      role="status"
    >
      <span aria-hidden="true">⚠</span>
      <span>Revue humaine en cours — publication provisoire</span>
    </div>
  );
}

function DownloadLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className="inline-flex items-center gap-1.5 font-mono text-accent underline-offset-2 hover:underline"
      download
    >
      <span aria-hidden="true">↓</span>
      {children}
    </a>
  );
}
