import { describe, expect, it } from "vitest";
import {
  createSubscriptionSchema,
  subscriptionStatusSchema,
  updateSubscriptionSchema,
} from "../src/modules/subscriptions/schemas";

const valid = {
  customerId: "11111111-1111-4111-8111-111111111111",
  planName: "Standard refill",
  gallonsPerDelivery: 2,
  frequency: "weekly" as const,
  priceCentavos: 5000,
  startDate: "2026-11-28",
};

describe("subscription schemas", () => {
  it("accepts a valid create payload and defaults status", () => {
    const parsed = createSubscriptionSchema.parse(valid);
    expect(parsed.status).toBe("Active");
    expect(parsed.gallonsPerDelivery).toBe(2);
  });

  it("rejects invalid frequency and dates", () => {
    expect(() => createSubscriptionSchema.parse({ ...valid, frequency: "yearly" })).toThrow();
    expect(() => createSubscriptionSchema.parse({ ...valid, startDate: "11/28/2026" })).toThrow();
    expect(() => createSubscriptionSchema.parse({ ...valid, gallonsPerDelivery: 0 })).toThrow();
    expect(() => createSubscriptionSchema.parse({ ...valid, priceCentavos: -1 })).toThrow();
  });

  it("update is partial and requires a version", () => {
    expect(updateSubscriptionSchema.parse({ version: 1, planName: "x" }).planName).toBe("x");
    expect(() => updateSubscriptionSchema.parse({ planName: "x" })).toThrow();
  });

  it("status transitions require a known status and version", () => {
    expect(subscriptionStatusSchema.parse({ status: "Paused", version: 3 }).status).toBe("Paused");
    expect(() => subscriptionStatusSchema.parse({ status: "Active", version: 0 })).toThrow();
    expect(() => subscriptionStatusSchema.parse({ status: "Done", version: 1 })).toThrow();
  });
});
