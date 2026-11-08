import { z } from "zod";

export const SCHEDULE_STATUSES = ["Scheduled", "Out for delivery", "Completed", "Cancelled"] as const;

export const scheduleSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  customerCode: z.string(),
  customerName: z.string(),
  assignedUserId: z.string(),
  assignedUserName: z.string(),
  type: z.string(),
  recurrence: z.string(),
  scheduledDate: z.string(),
  scheduledTime: z.string(),
  status: z.string(),
  gallons: z.number(),
  amountCentavos: z.number(),
  notes: z.string(),
  version: z.number(),
  completedAt: z.string().nullable(),
  createdAt: z.string().nullable(),
});

export const schedulePageSchema = z.object({
  items: z.array(scheduleSchema),
  nextCursor: z.string().nullable(),
});

export const assigneeListSchema = z.object({
  items: z.array(z.object({ id: z.string(), fullName: z.string() })),
});

export const scheduleFormSchema = z.object({
  customerId: z.string().uuid("Select a customer."),
  assignedUserId: z.string().uuid("Select a staff member."),
  type: z.enum(["refill", "delivery"]),
  recurrence: z.enum(["one-time", "daily", "weekly", "monthly"]),
  scheduledDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a date."),
  scheduledTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Choose a time."),
  gallons: z.number().int().min(1, "At least 1 gallon.").max(10_000),
  amountCentavos: z.number().int().min(0).max(100_000_000),
  notes: z.string().trim().max(500),
});

export type Schedule = z.infer<typeof scheduleSchema>;
export type ScheduleFormValues = z.infer<typeof scheduleFormSchema>;
