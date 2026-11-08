import { describe, expect, it } from "vitest";
import { ALL_GRANTS, parseGrants } from "../src/lib/grants";

describe("grants", () => {
  it("uses module:action keys", () => {
    expect(ALL_GRANTS.length).toBeGreaterThan(0);
    for (const grant of ALL_GRANTS) {
      expect(grant).toMatch(/^[a-z-]+:(view|add|edit|delete|export|reveal)$/);
    }
  });

  it("parses stored grant arrays safely", () => {
    expect(parseGrants('["customers:view","audit:view"]')).toEqual(["customers:view", "audit:view"]);
    expect(parseGrants('["customers:view", 42, null]')).toEqual(["customers:view"]);
    expect(parseGrants('["customers:view","made:up"]')).toEqual(["customers:view"]);
    expect(parseGrants("not json")).toEqual([]);
    expect(parseGrants('{"grant":"admin:view"}')).toEqual([]);
  });
});
