// See docs/specs/website/transparency.md §4
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { SourcesTabView } from "./SourcesTab";
import type { SourcesRawManifest } from "@/lib/manifests/sources-manifest";

// Following the pattern in Drawer.test.tsx: we test the pure view
// component (manifest → markup) here. The outer `<SourcesTab>` does
// a `fetch(manifest.json)` on mount, which requires a browser-like
// env; that path is thin and exercised at runtime / in e2e.

const SAMPLE_MANIFEST: SourcesRawManifest = {
  files: [
    {
      filename: "programme.pdf",
      byte_length: 1_234_567,
      sha256:
        "abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789",
      origin_url: "https://example.org/programme.pdf",
      accessed_at: "2027-11-01",
    },
    {
      filename: "notes.md",
      byte_length: 2048,
      sha256:
        "0011223344556677889900aabbccddeeff00112233445566778899aabbccddee",
    },
    {
      filename: "data.json",
      byte_length: 512,
      sha256:
        "deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef",
    },
  ],
};

describe("SourcesTabView", () => {
  it("renders one row per manifest entry with metadata", () => {
    const html = renderToStaticMarkup(
      <SourcesTabView
        manifest={SAMPLE_MANIFEST}
        baseUrl="/candidates/test/2027-11-01/sources-raw"
        selectedFile={undefined}
        onSelectFile={() => undefined}
        onRequestDocumentTab={() => undefined}
      />,
    );
    expect(html).toContain("programme.pdf");
    expect(html).toContain("notes.md");
    expect(html).toContain("data.json");
    // byte size formatting
    expect(html).toContain("1.2 Mio");
    expect(html).toContain("2.0 Kio");
    expect(html).toContain("512 o");
    // sha truncation + full sha in title attr
    expect(html).toContain("sha256:abcdef0…");
    expect(html).toContain(
      'title="abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789"',
    );
    // origin link
    expect(html).toContain("https://example.org/programme.pdf");
    // accessed_at metadata surfaced
    expect(html).toContain("accédée 2027-11-01");
    // no viewer rendered when nothing selected
    expect(html).not.toContain("<iframe");
    expect(html).not.toContain("<pre");
  });

  it("renders the empty-state copy and a document-tab switch button", () => {
    const onRequestDocumentTab = vi.fn();
    const html = renderToStaticMarkup(
      <SourcesTabView
        manifest={{ files: [] }}
        baseUrl="/candidates/test/2027-11-01/sources-raw"
        selectedFile={undefined}
        onSelectFile={() => undefined}
        onRequestDocumentTab={onRequestDocumentTab}
      />,
    );
    expect(html).toContain(
      "Les sources primaires archivées ne sont pas encore disponibles",
    );
    expect(html).toContain("Ouvrir le document consolidé");
    expect(onRequestDocumentTab).not.toHaveBeenCalled();
  });

  it("opens the PDF viewer iframe when the matching file is selected", () => {
    const html = renderToStaticMarkup(
      <SourcesTabView
        manifest={SAMPLE_MANIFEST}
        baseUrl="/candidates/test/2027-11-01/sources-raw"
        selectedFile="programme.pdf"
        onSelectFile={() => undefined}
        onRequestDocumentTab={() => undefined}
      />,
    );
    expect(html).toContain("<iframe");
    expect(html).toContain(
      'src="/candidates/test/2027-11-01/sources-raw/programme.pdf"',
    );
    expect(html).toContain('sandbox=""');
    // "Masquer" button label when viewer is open
    expect(html).toContain("Masquer");
  });

  it("encodes special characters in filenames for the download href", () => {
    const manifest: SourcesRawManifest = {
      files: [
        {
          filename: "programme avec espaces.pdf",
          byte_length: 10,
          sha256: "a".repeat(64),
        },
      ],
    };
    const html = renderToStaticMarkup(
      <SourcesTabView
        manifest={manifest}
        baseUrl="/candidates/test/2027-11-01/sources-raw"
        selectedFile={undefined}
        onSelectFile={() => undefined}
        onRequestDocumentTab={() => undefined}
      />,
    );
    expect(html).toContain("programme%20avec%20espaces.pdf");
  });
});
