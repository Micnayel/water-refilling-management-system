import { describe, expect, it } from "vitest";
import { subscriptionFormSchema } from "@/modules/subscriptions/schemas";

const valid = {
  customerId: "11111111-1111-4111-8111-111111111111",
  planName: "Standard refill",
  status: "Active" as const,
  gallonsPerDelivery: 1,
  frequency: "weekly" as const,
  priceCentavos: 0,
  startDate: "2026-11-28",
  nextBillingDate: "",
  assignedUserId: "",
  notes: "",
};

describe("subscriptionFormSchema", () => {
  it("accepts a valid form", () => {
    expect(subscriptionFormSchema.parse(valid).planName).toBe("Standard refill");
  });

  it("rejects bad status, frequency, and dates", () => {
    expect(() => subscriptionFormSchema.parse({ ...valid, status: "Done" })).toThrow();
    expect(() => subscriptionFormSchema.parse({ ...valid, frequency: "yearly" })).toThrow();
    expect(() => subscriptionFormSchema.parse({ ...valid, startDate: "nope" })).toThrow();
    expect(() => subscriptionFormSchema.parse({ ...valid, gallonsPerDelivery: 0 })).toThrow();
  });
});
