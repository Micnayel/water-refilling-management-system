import { z } from "zod";

export const MOVEMENT_TYPES = ["in", "out", "return", "adjust", "damaged", "deliver"] as const;

export const createItemSchema = z.object({
  name: z.string().trim().min(2).max(120),
  sku: z.string().trim().min(2).max(48),
  openingQuantity: z.number().int().min(0).max(1_000_000).optional(),
  reorderLevel: z.number().int().min(0).max(1_000_000).optional(),
});

export const updateItemSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  reorderLevel: z.number().int().min(0).max(1_000_000).optional(),
  version: z.number().int().min(1),
});

export const movementSchema = z.object({
  type: z.enum(MOVEMENT_TYPES),
  quantity: z.number().int().min(-1_000_000).max(1_000_000).refine((value) => value !== 0),
  reason: z.string().trim().min(3).max(255),
  version: z.number().int().min(1).optional(),
});

export const queryInventorySchema = z.object({
  cursor: z.string().optional(),
  pageSize: z.number().int().min(1).max(100).optional(),
  lowStock: z.boolean().optional(),
});
