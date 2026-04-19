import { describe, it, expect } from "vitest";
import { normalizeArgv } from "./cli-args";

describe("normalizeArgv", () => {
  it("strips a leading -- token (pnpm style)", () => {
    const input = ["/usr/bin/node", "script.ts", "--", "--id", "x"];
    expect(normalizeArgv(input)).toEqual([
      "/usr/bin/node",
      "script.ts",
      "--id",
      "x",
    ]);
  });

  it("leaves argv untouched when there is no leading --", () => {
    const input = ["/usr/bin/node", "script.ts", "--id", "x"];
    expect(normalizeArgv(input)).toEqual(input);
  });

  it("preserves a later -- token", () => {
    const input = ["/usr/bin/node", "script.ts", "--id", "x", "--", "rest"];
    expect(normalizeArgv(input)).toEqual(input);
  });

  it("returns argv as-is when there are no user args", () => {
    const input = ["/usr/bin/node", "script.ts"];
    expect(normalizeArgv(input)).toEqual(input);
  });
});
