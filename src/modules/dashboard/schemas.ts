import { z } from "zod";
import { scheduleSchema } from "@/modules/scheduling";

export const dashboardSummarySchema = z.object({
  salesTodayCentavos: z.number(),
  salesTodayCount: z.number(),
  salesMonthCentavos: z.number(),
  salesMonthCount: z.number(),
  clientCount: z.number(),
  totalCustomers: z.number(),
  inventoryFull: z.number(),
  inventoryWithCustomer: z.number(),
  lowStockCount: z.number(),
  activeSubscriptions: z.number(),
  todaysOrders: z.number(),
  pendingOrders: z.number(),
  ongoingDeliveries: z.number(),
  completedDeliveries: z.number(),
  revenueTotalCentavos: z.number(),
  revenueTodayCentavos: z.number(),
  revenueMonthCentavos: z.number(),
  analyticsSeries: z.array(
    z.object({ date: z.string(), salesCentavos: z.number(), orders: z.number() }),
  ),
  recentCustomers: z.array(
    z.object({
      id: z.string(),
      code: z.string(),
      name: z.string(),
      status: z.string(),
      createdAt: z.string().nullable(),
    }),
  ),
  latestOrders: z.array(scheduleSchema),
  deliveryMonitoring: z.object({
    scheduled: z.number(),
    ongoing: z.number(),
    completed: z.number(),
    cancelled: z.number(),
    total: z.number(),
  }),
  inventoryItemCount: z.number(),
  lowStockItems: z.array(z.object({ name: z.string(), gallonsFull: z.number(), reorderLevel: z.number() })),
  clientLocationStats: z.array(z.object({ area: z.string(), count: z.number() })),
});

export const dashboardMapSchema = z.object({
  masked: z.boolean(),
  points: z.array(
    z.object({
      label: z.string(),
      latitude: z.number(),
      longitude: z.number(),
      count: z.number(),
    }),
  ),
});

export const revealResultSchema = z.object({
  id: z.string(),
  name: z.string(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
});

export type DashboardSummary = z.infer<typeof dashboardSummarySchema>;
export type DashboardMap = z.infer<typeof dashboardMapSchema>;
