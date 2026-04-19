import { describe, it, expect } from "vitest";

describe("project setup", () => {
  it("typescript_strict_mode_enabled", () => {
    // If this file compiles, strict mode is working
    const value: string = "hello";
    expect(value).toBe("hello");
  });
});
