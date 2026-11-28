import { z } from "zod";

export const SUBSCRIPTION_STATUSES = ["Active", "Paused", "Cancelled"] as const;
export const SUBSCRIPTION_FREQUENCIES = ["daily", "weekly", "biweekly", "monthly"] as const;

export const subscriptionSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  customerCode: z.string(),
  customerName: z.string(),
  planName: z.string(),
  status: z.string(),
  gallonsPerDelivery: z.number(),
  frequency: z.string(),
  priceCentavos: z.number(),
  startDate: z.string(),
  nextBillingDate: z.string().nullable(),
  assignedUserId: z.string().nullable(),
  assignedUserName: z.string(),
  notes: z.string(),
  version: z.number(),
  createdAt: z.string().nullable(),
});

export const subscriptionPageSchema = z.object({
  items: z.array(subscriptionSchema),
  nextCursor: z.string().nullable(),
});

export type Subscription = z.infer<typeof subscriptionSchema>;

export const subscriptionFormSchema = z.object({
  customerId: z.string().uuid("Select a customer."),
  planName: z.string().trim().min(1, "Plan name is required.").max(120),
  status: z.enum(SUBSCRIPTION_STATUSES),
  gallonsPerDelivery: z.number().int().min(1, "At least 1 gallon.").max(10_000),
  frequency: z.enum(SUBSCRIPTION_FREQUENCIES),
  priceCentavos: z.number().int().min(0).max(100_000_000),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a start date."),
  nextBillingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a date.").or(z.literal("")),
  assignedUserId: z.string(),
  notes: z.string().trim().max(500),
});

export type SubscriptionFormValues = z.infer<typeof subscriptionFormSchema>;

export const FREQUENCY_LABELS: Record<(typeof SUBSCRIPTION_FREQUENCIES)[number], string> = {
  daily: "Daily",
  weekly: "Weekly",
  biweekly: "Every 2 weeks",
  monthly: "Monthly",
};
