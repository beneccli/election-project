// See docs/specs/website/methodology-page.md (task 0144).
//
// Regression: components that link to /methodologie must use
// `localePath()` so EN pages get /en/methodologie. FR rendering is
// unchanged.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import MethodologyBlock from "@/components/landing/MethodologyBlock";
import { TransparencyFooter } from "@/components/chrome/TransparencyFooter";
import { VersionMetadataSchema, type VersionMetadata } from "@/lib/schema";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OMEGA = path.resolve(HERE, "..", "..", "..", "candidates", "test-omega", "current");

function loadVersionMeta(): VersionMetadata {
  return VersionMetadataSchema.parse(
    JSON.parse(fs.readFileSync(path.join(OMEGA, "metadata.json"), "utf8")),
  );
}

describe("/methodologie href locale-prefixing", () => {
  test("MethodologyBlock fr → /methodologie", () => {
    const html = renderToStaticMarkup(<MethodologyBlock lang="fr" />);
    expect(html).toContain('href="/methodologie"');
    expect(html).not.toContain('href="/en/methodologie"');
  });

  test("MethodologyBlock en → /en/methodologie", () => {
    const html = renderToStaticMarkup(<MethodologyBlock lang="en" />);
    expect(html).toContain('href="/en/methodologie"');
  });

  test("TransparencyFooter fr → /methodologie", () => {
    const meta = loadVersionMeta();
    const html = renderToStaticMarkup(
      <TransparencyFooter id="test-omega" versionMeta={meta} lang="fr" />,
    );
    expect(html).toContain('href="/methodologie"');
    expect(html).not.toContain('href="/en/methodologie"');
  });

  test("TransparencyFooter en → /en/methodologie", () => {
    const meta = loadVersionMeta();
    const html = renderToStaticMarkup(
      <TransparencyFooter id="test-omega" versionMeta={meta} lang="en" />,
    );
    expect(html).toContain('href="/en/methodologie"');
  });
});
