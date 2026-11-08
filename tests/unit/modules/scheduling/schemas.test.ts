import { describe, expect, it } from "vitest";
import { SCHEDULE_STATUSES, scheduleFormSchema } from "@/modules/scheduling/schemas";

const valid = {
  customerId: "11111111-1111-4111-8111-111111111111",
  assignedUserId: "22222222-2222-4222-8222-222222222222",
  type: "delivery" as const,
  recurrence: "one-time" as const,
  scheduledDate: "2026-03-01",
  scheduledTime: "08:30",
  gallons: 2,
  amountCentavos: 5000,
  notes: "",
};

describe("schedule schemas", () => {
  it("uses the documented lifecycle", () => {
    expect(SCHEDULE_STATUSES).toEqual(["Scheduled", "Out for delivery", "Completed", "Cancelled"]);
  });

  it("accepts a complete schedule", () => {
    expect(scheduleFormSchema.safeParse(valid).success).toBe(true);
  });

  it("requires a customer and an assignee", () => {
    expect(scheduleFormSchema.safeParse({ ...valid, customerId: "" }).success).toBe(false);
    expect(scheduleFormSchema.safeParse({ ...valid, assignedUserId: "" }).success).toBe(false);
  });

  it("uses ISO dates and 24-hour times", () => {
    expect(scheduleFormSchema.safeParse({ ...valid, scheduledDate: "03/01/2026" }).success).toBe(false);
    expect(scheduleFormSchema.safeParse({ ...valid, scheduledTime: "8:30" }).success).toBe(false);
    expect(scheduleFormSchema.safeParse({ ...valid, scheduledTime: "24:00" }).success).toBe(false);
  });

  it("rejects zero gallons and negative amounts", () => {
    expect(scheduleFormSchema.safeParse({ ...valid, gallons: 0 }).success).toBe(false);
    expect(scheduleFormSchema.safeParse({ ...valid, amountCentavos: -1 }).success).toBe(false);
  });
});
