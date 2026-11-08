import { z } from "zod";

export const dashboardSummarySchema = z.object({
  salesTodayCentavos: z.number(),
  salesTodayCount: z.number(),
  salesMonthCentavos: z.number(),
  salesMonthCount: z.number(),
  clientCount: z.number(),
  inventoryFull: z.number(),
  inventoryWithCustomer: z.number(),
  lowStockCount: z.number(),
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
