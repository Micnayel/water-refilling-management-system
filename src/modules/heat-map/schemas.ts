import { z } from "zod";

export const heatMetricSchema = z.enum(["customer-density", "completed-deliveries"]);

export const heatQuerySchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  metric: heatMetricSchema,
  area: z.string().trim().max(120).optional(),
});

export const heatResultSchema = z.object({
  bucket: z.literal("barangay"),
  minCellSize: z.number(),
  cells: z.array(
    z.object({
      area: z.string(),
      latitude: z.number(),
      longitude: z.number(),
      count: z.number(),
    }),
  ),
  suppressedCells: z.number(),
});

export type HeatQuery = z.infer<typeof heatQuerySchema>;
export type HeatResult = z.infer<typeof heatResultSchema>;

export const HEAT_METRIC_LABELS: Record<HeatQuery["metric"], string> = {
  "customer-density": "Customer density",
  "completed-deliveries": "Completed deliveries",
};
