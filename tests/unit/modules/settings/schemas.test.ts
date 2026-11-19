import { describe, expect, it } from "vitest";
import { stationLocationSchema } from "@/modules/settings/schemas";

describe("station location form", () => {
  it("accepts a Quezon City station origin", () => {
    const parsed = stationLocationSchema.safeParse({
      label: "Quezon City station",
      latitude: 14.676,
      longitude: 121.0437,
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects coordinates outside the valid range", () => {
    const parsed = stationLocationSchema.safeParse({
      label: "",
      latitude: 120,
      longitude: 200,
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects a missing latitude", () => {
    const parsed = stationLocationSchema.safeParse({
      label: "",
      latitude: Number.NaN,
      longitude: 121.0437,
    });
    expect(parsed.success).toBe(false);
  });
});
