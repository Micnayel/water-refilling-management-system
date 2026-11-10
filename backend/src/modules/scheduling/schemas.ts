import { z } from "zod";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);

export const createScheduleSchema = z.object({
  customerId: z.string().uuid(),
  assignedUserId: z.string().uuid(),
  type: z.enum(["refill", "delivery"]),
  recurrence: z.enum(["one-time", "daily", "weekly", "monthly"]),
  scheduledDate: isoDate,
  scheduledTime: time,
  gallons: z.number().int().min(1).max(10_000),
  amountCentavos: z.number().int().min(0).max(100_000_000),
  notes: z.string().trim().max(500).optional().default(""),
});

export const updateScheduleSchema = createScheduleSchema.partial().extend({
  version: z.number().int().min(1),
});

export const scheduleStatusSchema = z.object({
  status: z.enum(["Scheduled", "Out for delivery", "Completed", "Cancelled"]),
  version: z.number().int().min(1),
  itemId: z.string().uuid().optional(),
});

export const querySchedulesSchema = z
  .object({
    cursor: z.string().optional(),
    pageSize: z.number().int().min(1).max(100).optional(),
    status: z.enum(["Scheduled", "Out for delivery", "Completed", "Cancelled"]).optional(),
    date: isoDate.optional(),
    from: isoDate.optional(),
    to: isoDate.optional(),
  })
  .refine((input) => !input.from || !input.to || input.from <= input.to, {
    message: "The start date must be before the end date.",
    path: ["from"],
  });
