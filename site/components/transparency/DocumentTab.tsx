// See docs/specs/website/transparency.md §5 "Document consolidé tab"
"use client";
import * as React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";
import { slugify } from "@/lib/slug";

type FetchState =
  | { phase: "loading" }
  | { phase: "loaded"; text: string; sha256: string }
  | { phase: "error"; message: string };

export function DocumentTab({
  id,
  versionDate,
  humanReviewCompleted,
  anchor,
}: {
  id: string;
  versionDate: string;
  humanReviewCompleted: boolean;
  anchor: string | undefined;
}) {
  const fileUrl = `/candidates/${id}/${versionDate}/sources.md`;
  const [state, setState] = React.useState<FetchState>({ phase: "loading" });

  React.useEffect(() => {
    let cancelled = false;
    fetch(fileUrl, { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.arrayBuffer();
      })
      .then(async (buf) => {
        const text = new TextDecoder("utf-8").decode(buf);
        const sha256 = await sha256Hex(buf);
        if (!cancelled) setState({ phase: "loaded", text, sha256 });
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
  }, [fileUrl]);

  // Scroll to the requested anchor whenever it changes (and after load).
  React.useEffect(() => {
    if (!anchor || state.phase !== "loaded") return;
    // Allow react-markdown to commit the heading nodes before scrolling.
    const raf = requestAnimationFrame(() => {
      const el = document.getElementById(anchor);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    return () => cancelIdleRAF(raf);
  }, [anchor, state.phase]);

  return (
    <DocumentTabView
      fileUrl={fileUrl}
      versionDate={versionDate}
      humanReviewCompleted={humanReviewCompleted}
      state={state}
    />
  );
}

// ---------------------------------------------------------------------------
// Pure view
// ---------------------------------------------------------------------------

export function DocumentTabView({
  fileUrl,
  versionDate,
  humanReviewCompleted,
  state,
}: {
  fileUrl: string;
  versionDate: string;
  humanReviewCompleted: boolean;
  state: FetchState;
}) {
  return (
    <div className="flex flex-col gap-4">
      <DocumentHeader
        fileUrl={fileUrl}
        versionDate={versionDate}
        humanReviewCompleted={humanReviewCompleted}
        sha256={state.phase === "loaded" ? state.sha256 : undefined}
      />
      {state.phase === "loading" ? (
        <p className="rounded-md border border-rule bg-bg-subtle px-4 py-6 text-center text-xs text-text-tertiary">
          Chargement du document consolidé…
        </p>
      ) : null}
      {state.phase === "error" ? (
        <p className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-xs text-amber-950">
          Échec du chargement du document consolidé ({state.message}).{" "}
          <a
            href={fileUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="underline decoration-dotted underline-offset-2"
          >
            Ouvrir le fichier brut
          </a>
          .
        </p>
      ) : null}
      {state.phase === "loaded" ? (
        <article
          data-document-body=""
          className="prose prose-sm max-w-none text-text [&_a]:underline [&_a]:decoration-dotted [&_a]:underline-offset-2 [&_code]:rounded-sm [&_code]:bg-bg-subtle [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[12px] [&_h2]:mt-6 [&_h2]:text-base [&_h2]:font-semibold [&_h3]:mt-4 [&_h3]:text-sm [&_h3]:font-semibold [&_p]:text-[13px] [&_p]:leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5"
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
            {state.text}
          </ReactMarkdown>
        </article>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Internals
// ---------------------------------------------------------------------------

function DocumentHeader({
  fileUrl,
  versionDate,
  humanReviewCompleted,
  sha256,
}: {
  fileUrl: string;
  versionDate: string;
  humanReviewCompleted: boolean;
  sha256: string | undefined;
}) {
  return (
    <header className="rounded-md border border-rule bg-bg-subtle px-4 py-3 text-xs">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <div className="text-[10.5px] font-semibold uppercase tracking-wider text-text-tertiary">
            Document consolidé
          </div>
          <div className="mt-0.5 font-mono text-text">
            sources.md · {versionDate}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ReviewBadge completed={humanReviewCompleted} />
          <a
            href={fileUrl}
            download
            className="rounded-sm border border-rule bg-bg px-2 py-1 hover:bg-bg-subtle"
          >
            Télécharger
          </a>
        </div>
      </div>
      <div className="mt-2 break-all font-mono text-[10.5px] text-text-secondary">
        sha256 : <span className="text-text">{sha256 ?? "…"}</span>
      </div>
    </header>
  );
}

function ReviewBadge({ completed }: { completed: boolean }) {
  return (
    <span
      className={
        "rounded-full border px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wider " +
        (completed
          ? "border-emerald-300 bg-emerald-50 text-emerald-900"
          : "border-amber-300 bg-amber-50 text-amber-900")
      }
    >
      {completed ? "Revue humaine ✓" : "Revue non validée"}
    </span>
  );
}

// Map h2/h3 to include a stable slug id. Other elements fall through to
// default react-markdown rendering.
const mdComponents: Components = {
  h2: ({ children, ...rest }) => (
    <h2 id={slugify(extractText(children))} {...rest}>
      {children}
    </h2>
  ),
  h3: ({ children, ...rest }) => (
    <h3 id={slugify(extractText(children))} {...rest}>
      {children}
    </h3>
  ),
};

function extractText(children: React.ReactNode): string {
  if (children == null || typeof children === "boolean") return "";
  if (typeof children === "string" || typeof children === "number")
    return String(children);
  if (Array.isArray(children)) return children.map(extractText).join("");
  if (React.isValidElement(children)) {
    const props = children.props as { children?: React.ReactNode };
    return extractText(props.children);
  }
  return "";
}

async function sha256Hex(buf: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", buf);
  const bytes = new Uint8Array(digest);
  let hex = "";
  for (const b of bytes) hex += b.toString(16).padStart(2, "0");
  return hex;
}

function cancelIdleRAF(id: number) {
  cancelAnimationFrame(id);
}
