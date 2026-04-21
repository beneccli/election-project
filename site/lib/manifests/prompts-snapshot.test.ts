// See docs/specs/website/transparency.md §6
import { describe, expect, it, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createHash } from "node:crypto";
import {
  listPromptFiles,
  sha256File,
  snapshotPrompts,
} from "./prompts-snapshot";

let tmp: string;
beforeEach(() => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), "prompts-snapshot-"));
});
afterEach(() => {
  fs.rmSync(tmp, { recursive: true, force: true });
});

function writeFile(rel: string, content: string) {
  const abs = path.join(tmp, rel);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, content, "utf8");
}

describe("listPromptFiles", () => {
  it("returns empty array when root does not exist", () => {
    expect(listPromptFiles(path.join(tmp, "nope"))).toEqual([]);
  });

  it("lists markdown files recursively in sorted order", () => {
    writeFile("prompts/b.md", "b");
    writeFile("prompts/a.md", "a");
    writeFile("prompts/sub/c.md", "c");
    writeFile("prompts/skip.txt", "skip");
    const out = listPromptFiles(path.join(tmp, "prompts"));
    expect(out).toEqual(["a.md", "b.md", "sub/c.md"]);
  });
});

describe("sha256File", () => {
  it("matches crypto.createHash output byte-for-byte", () => {
    writeFile("f.md", "hello\n");
    const out = sha256File(path.join(tmp, "f.md"));
    const expected = createHash("sha256").update("hello\n").digest("hex");
    expect(out.sha256).toBe(expected);
    expect(out.byteLength).toBe(6);
  });
});

describe("snapshotPrompts", () => {
  it("writes content-addressed files and a sorted manifest", () => {
    writeFile("prompts/analyze-candidate.md", "analyze\n");
    writeFile("prompts/aggregate-analyses.md", "aggregate\n");
    const publicDir = path.join(tmp, "public/prompts");
    const manifest = snapshotPrompts(path.join(tmp, "prompts"), publicDir);

    expect(manifest.files.map((f) => f.logical_name)).toEqual([
      "aggregate-analyses.md",
      "analyze-candidate.md",
    ]);

    for (const entry of manifest.files) {
      const contentFile = path.join(publicDir, `${entry.sha256}.md`);
      expect(fs.existsSync(contentFile)).toBe(true);
      const bytes = fs.readFileSync(contentFile);
      expect(bytes.byteLength).toBe(entry.byte_length);
      expect(createHash("sha256").update(bytes).digest("hex")).toBe(
        entry.sha256,
      );
    }
    const written = JSON.parse(
      fs.readFileSync(path.join(publicDir, "manifest.json"), "utf8"),
    );
    expect(written).toEqual(manifest);
  });

  it("is idempotent and clears stale files", () => {
    writeFile("prompts/a.md", "a\n");
    const publicDir = path.join(tmp, "public/prompts");
    snapshotPrompts(path.join(tmp, "prompts"), publicDir);
    const staleFile = path.join(publicDir, "deadbeef.md");
    fs.writeFileSync(staleFile, "stale", "utf8");

    fs.writeFileSync(path.join(tmp, "prompts/a.md"), "b\n", "utf8");
    const manifest = snapshotPrompts(path.join(tmp, "prompts"), publicDir);
    expect(fs.existsSync(staleFile)).toBe(false);
    expect(manifest.files).toHaveLength(1);
    expect(manifest.files[0].sha256).toBe(
      createHash("sha256").update("b\n").digest("hex"),
    );
  });

  it("handles identical content under different logical names", () => {
    writeFile("prompts/a.md", "same\n");
    writeFile("prompts/b.md", "same\n");
    const publicDir = path.join(tmp, "public/prompts");
    const manifest = snapshotPrompts(path.join(tmp, "prompts"), publicDir);
    expect(manifest.files).toHaveLength(2);
    expect(manifest.files[0].sha256).toBe(manifest.files[1].sha256);
    const snapshotFiles = fs
      .readdirSync(publicDir)
      .filter((f) => f.endsWith(".md"));
    expect(snapshotFiles).toHaveLength(1);
  });
});
