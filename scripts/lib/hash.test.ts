import { describe, it, expect } from "vitest";
import { hashFile, hashString } from "./hash.js";
import { writeFile, mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

describe("hash", () => {
  it("hashString_returns_correct_sha256_for_known_input", () => {
    // SHA256 of "hello" is well-known
    const result = hashString("hello");
    expect(result).toBe(
      "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824",
    );
  });

  it("hashString_returns_lowercase_hex", () => {
    const result = hashString("test");
    expect(result).toMatch(/^[a-f0-9]{64}$/);
  });

  it("hashString_returns_different_hashes_for_different_inputs", () => {
    const h1 = hashString("hello");
    const h2 = hashString("world");
    expect(h1).not.toBe(h2);
  });

  it("hashString_returns_consistent_results", () => {
    const h1 = hashString("consistent");
    const h2 = hashString("consistent");
    expect(h1).toBe(h2);
  });

  it("hashFile_returns_correct_sha256_for_known_content", async () => {
    const tmpDir = await mkdtemp(join(tmpdir(), "hash-test-"));
    const filePath = join(tmpDir, "test.txt");
    await writeFile(filePath, "hello", "utf-8");
    try {
      const result = await hashFile(filePath);
      expect(result).toBe(
        "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824",
      );
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });

  it("hashFile_throws_on_nonexistent_file", async () => {
    await expect(hashFile("/nonexistent/file.txt")).rejects.toThrow();
  });
});
