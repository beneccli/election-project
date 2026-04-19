import { describe, it, expect } from "vitest";
import { logger, createLogger } from "./logger.js";

describe("logger", () => {
  it("logger_exists_and_has_expected_methods", () => {
    expect(logger).toBeDefined();
    expect(typeof logger.info).toBe("function");
    expect(typeof logger.error).toBe("function");
    expect(typeof logger.warn).toBe("function");
    expect(typeof logger.debug).toBe("function");
  });

  it("createLogger_returns_child_with_bindings", () => {
    const child = createLogger({ script: "test", candidate: "jane-dupont" });
    expect(child).toBeDefined();
    expect(typeof child.info).toBe("function");
  });
});
