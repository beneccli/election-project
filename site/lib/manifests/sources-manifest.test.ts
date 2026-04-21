// See docs/specs/website/transparency.md §4
import { describe, expect, it, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createHash } from "node:crypto";
import {
  buildSourcesRawManifest,
  writeSourcesRawManifest,
} from "./sources-manifest";

let tmp: string;
beforeEach(() => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), "sources-manifest-"));
});
afterEach(() => {
  fs.rmSync(tmp, { recursive: true, force: true });
});

describe("buildSourcesRawManifest", () => {
  it("returns empty files[] when directory is missing", () => {
    expect(buildSourcesRawManifest(path.join(tmp, "nope"))).toEqual({
      files: [],
    });
  });

  it("returns empty files[] when directory is empty", () => {
    const dir = path.join(tmp, "sources-raw");
    fs.mkdirSync(dir);
    expect(buildSourcesRawManifest(dir)).toEqual({ files: [] });
  });

  it("lists files with size + sha256, sorted alphabetically", () => {
    const dir = path.join(tmp, "sources-raw");
    fs.mkdirSync(dir);
    fs.writeFileSync(path.join(dir, "b.txt"), "bbb", "utf8");
    fs.writeFileSync(path.join(dir, "a.txt"), "aa", "utf8");
    const m = buildSourcesRawManifest(dir);
    expect(m.files.map((f) => f.filename)).toEqual(["a.txt", "b.txt"]);
    expect(m.files[0].byte_length).toBe(2);
    expect(m.files[0].sha256).toBe(
      createHash("sha256").update("aa").digest("hex"),
    );
  });

  it("merges sidecar .meta.json keys without overriding filename/size/sha", () => {
    const dir = path.join(tmp, "sources-raw");
    fs.mkdirSync(dir);
    fs.writeFileSync(path.join(dir, "manifesto.pdf"), "PDFBYTES", "utf8");
    fs.writeFileSync(
      path.join(dir, "manifesto.pdf.meta.json"),
      JSON.stringify({
        origin_url: "https://example.com/x.pdf",
        accessed_at: "2026-04-15",
        filename: "malicious-override",
      }),
      "utf8",
    );
    const m = buildSourcesRawManifest(dir);
    expect(m.files).toHaveLength(1);
    const e = m.files[0];
    expect(e.filename).toBe("manifesto.pdf");
    expect(e.origin_url).toBe("https://example.com/x.pdf");
    expect(e.accessed_at).toBe("2026-04-15");
    expect(e.byte_length).toBe(8);
  });

  it("excludes .DS_Store, .gitkeep, manifest.json and .meta.json sidecars from the listing", () => {
    const dir = path.join(tmp, "sources-raw");
    fs.mkdirSync(dir);
    fs.writeFileSync(path.join(dir, ".DS_Store"), "", "utf8");
    fs.writeFileSync(path.join(dir, ".gitkeep"), "", "utf8");
    fs.writeFileSync(path.join(dir, "manifest.json"), "{}", "utf8");
    fs.writeFileSync(path.join(dir, "foo.pdf"), "x", "utf8");
    fs.writeFileSync(path.join(dir, "foo.pdf.meta.json"), "{}", "utf8");
    const m = buildSourcesRawManifest(dir);
    expect(m.files.map((f) => f.filename)).toEqual(["foo.pdf"]);
  });
});

describe("writeSourcesRawManifest", () => {
  it("writes the manifest as indented JSON", () => {
    const dir = path.join(tmp, "out");
    writeSourcesRawManifest(dir, { files: [] });
    const content = fs.readFileSync(path.join(dir, "manifest.json"), "utf8");
    expect(JSON.parse(content)).toEqual({ files: [] });
    expect(content.endsWith("\n")).toBe(true);
  });
});
