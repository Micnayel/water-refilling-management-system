import { describe, expect, it } from "vitest";
import { previewResponse } from "@/lib/preview-data";

interface StationResponse {
  label: string;
  latitude: number;
  longitude: number;
  version: number;
}

describe("preview station location", () => {
  it("returns the default Quezon City origin", () => {
    const station = previewResponse("/settings/station", "GET", {}) as StationResponse;
    expect(station.label).toContain("Quezon City");
    expect(station.latitude).toBeCloseTo(14.676, 3);
    expect(station.longitude).toBeCloseTo(121.0437, 3);
  });

  it("updates the origin in memory and bumps the version", () => {
    const before = previewResponse("/settings/station", "GET", {}) as StationResponse;
    const saved = previewResponse("/settings/station", "PUT", {
      label: "North station",
      latitude: 14.7,
      longitude: 121.1,
      version: before.version,
    }) as StationResponse;
    expect(saved.label).toBe("North station");
    expect(saved.latitude).toBeCloseTo(14.7, 3);
    expect(saved.version).toBe(before.version + 1);

    const after = previewResponse("/settings/station", "GET", {}) as StationResponse;
    expect(after.label).toBe("North station");
  });
});
