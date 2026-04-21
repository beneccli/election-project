// See docs/specs/website/transparency.md §4 "Sources tab"
"use client";
import * as React from "react";
import type {
  SourcesRawManifest,
  SourcesRawManifestEntry,
} from "@/lib/manifests/sources-manifest";

type FetchState =
  | { phase: "loading" }
  | { phase: "loaded"; manifest: SourcesRawManifest };

export function SourcesTab({
  id,
  versionDate,
  selectedFile,
  onSelectFile,
  onRequestDocumentTab,
}: {
  id: string;
  versionDate: string;
  selectedFile: string | undefined;
  onSelectFile: (filename: string | null) => void;
  onRequestDocumentTab: () => void;
}) {
  const manifestUrl = `/candidates/${id}/${versionDate}/sources-raw/manifest.json`;
  const [state, setState] = React.useState<FetchState>({ phase: "loading" });

  React.useEffect(() => {
    let cancelled = false;
    fetch(manifestUrl, { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<SourcesRawManifest>;
      })
      .then((manifest) => {
        if (!cancelled) setState({ phase: "loaded", manifest });
      })
      .catch((err: unknown) => {
        // A missing manifest is equivalent to an empty manifest — the
        // pipeline creates one for every published version, but older
        // versions predating task 0091 may not have it.
        if (!cancelled)
          setState({
            phase: "loaded",
            manifest: { files: [] },
          });
        // Surface unexpected errors to console for debugging; editorial
        // principles forbid silent swallowing of signal.
        console.debug("[SourcesTab] manifest fetch:", err);
      });
    return () => {
      cancelled = true;
    };
  }, [manifestUrl]);

  if (state.phase === "loading") {
    return (
      <p className="rounded-md border border-rule bg-bg-subtle px-4 py-6 text-center text-xs text-text-tertiary">
        Chargement de l’index des sources…
      </p>
    );
  }

  return (
    <SourcesTabView
      manifest={state.manifest}
      baseUrl={`/candidates/${id}/${versionDate}/sources-raw`}
      selectedFile={selectedFile}
      onSelectFile={onSelectFile}
      onRequestDocumentTab={onRequestDocumentTab}
    />
  );
}

// ---------------------------------------------------------------------------
// Pure view — deterministic given manifest + selected file.
// ---------------------------------------------------------------------------

export function SourcesTabView({
  manifest,
  baseUrl,
  selectedFile,
  onSelectFile,
  onRequestDocumentTab,
}: {
  manifest: SourcesRawManifest;
  baseUrl: string;
  selectedFile: string | undefined;
  onSelectFile: (filename: string | null) => void;
  onRequestDocumentTab: () => void;
}) {
  if (manifest.files.length === 0) {
    return <EmptyState onGoToDocument={onRequestDocumentTab} />;
  }
  return (
    <ul className="flex flex-col gap-3">
      {manifest.files.map((entry) => {
        const isOpen = entry.filename === selectedFile;
        const href = `${baseUrl}/${encodeURIComponent(entry.filename)}`;
        return (
          <li
            key={entry.filename}
            className="rounded-md border border-rule bg-bg"
          >
            <Row
              entry={entry}
              href={href}
              isOpen={isOpen}
              onToggle={() =>
                onSelectFile(isOpen ? null : entry.filename)
              }
            />
            {isOpen ? (
              <div className="border-t border-rule px-3 py-3">
                <Viewer entry={entry} href={href} />
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

// ---------------------------------------------------------------------------
// Row header + empty state
// ---------------------------------------------------------------------------

function Row({
  entry,
  href,
  isOpen,
  onToggle,
}: {
  entry: SourcesRawManifestEntry;
  href: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 px-3 py-2">
      <FileTypeIcon filename={entry.filename} />
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-medium text-text">
          {entry.filename}
        </span>
        <span className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 text-[11px] text-text-tertiary">
          <span>{formatBytes(entry.byte_length)}</span>
          <span
            className="font-mono"
            title={entry.sha256}
          >{`sha256:${entry.sha256.slice(0, 7)}…`}</span>
          {typeof entry.origin_url === "string" && entry.origin_url ? (
            <a
              href={entry.origin_url}
              target="_blank"
              rel="noreferrer noopener"
              className="underline decoration-dotted underline-offset-2"
            >
              source d’origine
            </a>
          ) : null}
          {typeof entry.accessed_at === "string" && entry.accessed_at ? (
            <span>accédée {entry.accessed_at}</span>
          ) : null}
        </span>
      </div>
      <div className="flex flex-shrink-0 gap-2 text-xs">
        <button
          type="button"
          onClick={onToggle}
          className="rounded-sm border border-rule px-2 py-1 hover:bg-bg-subtle"
          aria-expanded={isOpen}
        >
          {isOpen ? "Masquer" : "Voir"}
        </button>
        <a
          href={href}
          download={entry.filename}
          className="rounded-sm border border-rule px-2 py-1 hover:bg-bg-subtle"
        >
          Télécharger
        </a>
      </div>
    </div>
  );
}

function EmptyState({ onGoToDocument }: { onGoToDocument: () => void }) {
  return (
    <div className="rounded-md border border-rule bg-bg-subtle px-4 py-6 text-sm text-text-secondary">
      <p>
        Les sources primaires archivées ne sont pas encore disponibles pour
        cette version. Voir le document consolidé pour le contenu du
        programme tel qu’il a été soumis aux modèles.
      </p>
      <button
        type="button"
        onClick={onGoToDocument}
        className="mt-3 rounded-sm border border-rule bg-bg px-3 py-1 text-xs hover:bg-bg-subtle"
      >
        Ouvrir le document consolidé
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inline viewers per file type
// ---------------------------------------------------------------------------

function Viewer({
  entry,
  href,
}: {
  entry: SourcesRawManifestEntry;
  href: string;
}) {
  const kind = classifyFile(entry.filename);
  switch (kind) {
    case "pdf":
      return (
        <iframe
          title={entry.filename}
          src={href}
          sandbox=""
          className="block h-[600px] w-full rounded-sm border border-rule bg-white"
        />
      );
    case "text":
    case "json":
      return <TextViewer href={href} kind={kind} />;
    default:
      return (
        <p className="text-xs text-text-secondary">
          Aperçu non disponible.{" "}
          <a
            href={href}
            target="_blank"
            rel="noreferrer noopener"
            className="underline decoration-dotted underline-offset-2"
          >
            Ouvrir dans un nouvel onglet
          </a>
          .
        </p>
      );
  }
}

function TextViewer({
  href,
  kind,
}: {
  href: string;
  kind: "text" | "json";
}) {
  const [state, setState] = React.useState<
    | { phase: "loading" }
    | { phase: "loaded"; body: string }
    | { phase: "error"; message: string }
  >({ phase: "loading" });

  React.useEffect(() => {
    let cancelled = false;
    fetch(href, { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.text();
      })
      .then((body) => {
        if (cancelled) return;
        if (kind === "json") {
          try {
            const parsed = JSON.parse(body);
            setState({
              phase: "loaded",
              body: JSON.stringify(parsed, null, 2),
            });
            return;
          } catch {
            // fall through — display raw text.
          }
        }
        setState({ phase: "loaded", body });
      })
      .catch((err: unknown) => {
        if (!cancelled)
          setState({
            phase: "error",
            message: err instanceof Error ? err.message : String(err),
          });
      });
    return () => {
      cancelled = true;
    };
  }, [href, kind]);

  if (state.phase === "loading") {
    return <p className="text-xs text-text-tertiary">Chargement…</p>;
  }
  if (state.phase === "error") {
    return (
      <p className="text-xs text-text-tertiary">
        Échec du chargement : {state.message}
      </p>
    );
  }
  return (
    <pre className="max-h-[600px] overflow-auto rounded-sm border border-rule bg-bg-subtle p-3 text-[11px] leading-snug text-text">
      {state.body}
    </pre>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function classifyFile(
  filename: string,
): "pdf" | "text" | "json" | "html" | "other" {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".pdf")) return "pdf";
  if (lower.endsWith(".json")) return "json";
  if (lower.endsWith(".md") || lower.endsWith(".txt")) return "text";
  if (lower.endsWith(".html") || lower.endsWith(".htm")) return "html";
  return "other";
}

function FileTypeIcon({ filename }: { filename: string }) {
  const kind = classifyFile(filename);
  const label =
    kind === "pdf"
      ? "PDF"
      : kind === "json"
        ? "{}"
        : kind === "text"
          ? "TXT"
          : kind === "html"
            ? "HTM"
            : "FIC";
  return (
    <span
      aria-hidden="true"
      className="inline-flex h-8 w-10 flex-shrink-0 items-center justify-center rounded-sm border border-rule bg-bg-subtle font-mono text-[10px] font-semibold text-text-tertiary"
    >
      {label}
    </span>
  );
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} o`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} Kio`;
  return `${(n / (1024 * 1024)).toFixed(1)} Mio`;
}
