import { z } from "zod";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use a valid date.");

export const SUBSCRIPTION_STATUSES = ["Active", "Paused", "Cancelled"] as const;
export const SUBSCRIPTION_FREQUENCIES = ["daily", "weekly", "biweekly", "monthly"] as const;

export const createSubscriptionSchema = z.object({
  customerId: z.string().uuid("Select a customer."),
  planName: z.string().trim().min(1, "Plan name is required.").max(120),
  status: z.enum(SUBSCRIPTION_STATUSES).optional().default("Active"),
  gallonsPerDelivery: z.number().int().min(1).max(10_000),
  frequency: z.enum(SUBSCRIPTION_FREQUENCIES),
  priceCentavos: z.number().int().min(0).max(100_000_000),
  startDate: isoDate,
  nextBillingDate: isoDate.optional().nullable(),
  assignedUserId: z.string().uuid().optional().nullable(),
  notes: z.string().trim().max(500).optional().default(""),
});

export const updateSubscriptionSchema = createSubscriptionSchema.partial().extend({
  version: z.number().int().min(1),
});

export const subscriptionStatusSchema = z.object({
  status: z.enum(SUBSCRIPTION_STATUSES),
  version: z.number().int().min(1),
});

export const querySubscriptionsSchema = z.object({
  cursor: z.string().optional(),
  pageSize: z.number().int().min(1).max(100).optional(),
  status: z.enum(SUBSCRIPTION_STATUSES).optional(),
  search: z.string().trim().max(160).optional(),
});
