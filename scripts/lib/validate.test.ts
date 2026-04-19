import { describe, it, expect } from "vitest";
import { validateOrThrow, validateAndWrite, ValidationError } from "./validate.js";
import { z } from "zod";
import { readFile, mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

const TestSchema = z.object({
  name: z.string().min(1),
  value: z.number(),
});

describe("validate", () => {
  describe("validateOrThrow", () => {
    it("returns_valid_data_on_success", () => {
      const data = { name: "test", value: 42 };
      const result = validateOrThrow(TestSchema, data, "test-label");
      expect(result).toEqual(data);
    });

    it("throws_ValidationError_on_invalid_data", () => {
      const data = { name: "", value: "not a number" };
      expect(() => validateOrThrow(TestSchema, data, "test-label")).toThrow(
        ValidationError,
      );
    });

    it("ValidationError_contains_field_level_details", () => {
      const data = { name: "", value: "bad" };
      try {
        validateOrThrow(TestSchema, data, "test-label");
        expect.fail("should have thrown");
      } catch (e) {
        expect(e).toBeInstanceOf(ValidationError);
        const err = e as ValidationError;
        expect(err.issues.length).toBeGreaterThan(0);
        expect(err.message).toContain("test-label");
      }
    });

    it("strips_unknown_keys_from_valid_data", () => {
      const data = { name: "test", value: 42, extra: "field" };
      const result = validateOrThrow(TestSchema, data, "test-label");
      expect(result).toEqual({ name: "test", value: 42 });
    });
  });

  describe("validateAndWrite", () => {
    it("writes_valid_json_to_disk", async () => {
      const tmpDir = await mkdtemp(join(tmpdir(), "validate-test-"));
      const outPath = join(tmpDir, "output.json");
      try {
        const data = { name: "test", value: 42 };
        const result = await validateAndWrite(TestSchema, data, outPath);
        expect(result).toEqual(data);

        const written = JSON.parse(await readFile(outPath, "utf-8"));
        expect(written).toEqual(data);
      } finally {
        await rm(tmpDir, { recursive: true });
      }
    });

    it("creates_parent_directories", async () => {
      const tmpDir = await mkdtemp(join(tmpdir(), "validate-test-"));
      const outPath = join(tmpDir, "nested", "dir", "output.json");
      try {
        await validateAndWrite(TestSchema, { name: "test", value: 1 }, outPath);
        const written = JSON.parse(await readFile(outPath, "utf-8"));
        expect(written.name).toBe("test");
      } finally {
        await rm(tmpDir, { recursive: true });
      }
    });

    it("rejects_invalid_data_without_writing", async () => {
      const tmpDir = await mkdtemp(join(tmpdir(), "validate-test-"));
      const outPath = join(tmpDir, "should-not-exist.json");
      try {
        await expect(
          validateAndWrite(TestSchema, { name: "" }, outPath),
        ).rejects.toThrow(ValidationError);
        // File should not have been created
        await expect(readFile(outPath)).rejects.toThrow();
      } finally {
        await rm(tmpDir, { recursive: true });
      }
    });
  });
});
