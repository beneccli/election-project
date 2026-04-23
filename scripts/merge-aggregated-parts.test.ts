import { describe, expect, test } from "vitest";
import { mergeParts } from "./merge-aggregated-parts";

describe("merge-aggregated-parts", () => {
  test("merges_disjoint_top_level_keys", () => {
    const out = mergeParts([
      { name: "00.json", contents: '{"a": 1}' },
      { name: "01.json", contents: '{"b": 2}' },
    ]);
    expect(out).toEqual({ a: 1, b: 2 });
  });

  test("recursively_merges_object_keys", () => {
    const out = mergeParts([
      { name: "00.json", contents: '{"dimensions": {"x": {"v": 1}}}' },
      { name: "01.json", contents: '{"dimensions": {"y": {"v": 2}}}' },
    ]);
    expect(out).toEqual({ dimensions: { x: { v: 1 }, y: { v: 2 } } });
  });

  test("errors_on_primitive_key_collision", () => {
    expect(() =>
      mergeParts([
        { name: "00.json", contents: '{"a": 1}' },
        { name: "01.json", contents: '{"a": 2}' },
      ]),
    ).toThrow(/Conflict at "01\.json\.a"/);
  });

  test("errors_on_array_key_collision", () => {
    expect(() =>
      mergeParts([
        { name: "00.json", contents: '{"tags": [1]}' },
        { name: "01.json", contents: '{"tags": [2]}' },
      ]),
    ).toThrow(/Conflict/);
  });

  test("errors_on_invalid_json", () => {
    expect(() =>
      mergeParts([{ name: "bad.json", contents: "{not json" }]),
    ).toThrow(/bad.json: invalid JSON/);
  });

  test("errors_when_top_level_not_object", () => {
    expect(() =>
      mergeParts([{ name: "arr.json", contents: "[1,2,3]" }]),
    ).toThrow(/top-level value must be a JSON object/);
  });
});
