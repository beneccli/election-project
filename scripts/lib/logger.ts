/**
 * Structured logger for pipeline scripts.
 * See docs/specs/data-pipeline/overview.md — no console.log in committed code.
 */
import pino from "pino";

const level = process.env["LOG_LEVEL"] ?? "info";

export const logger = pino({
  level,
  ...(process.env["NODE_ENV"] !== "production" && {
    transport: {
      target: "pino-pretty",
      options: { colorize: true },
    },
  }),
});

/** Create a child logger with bound context fields. */
export function createLogger(bindings: Record<string, unknown>) {
  return logger.child(bindings);
}
