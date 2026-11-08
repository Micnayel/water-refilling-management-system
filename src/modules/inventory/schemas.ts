import { z } from "zod";

export const itemSchema = z.object({
  id: z.string(),
  name: z.string(),
  sku: z.string(),
  gallonsFull: z.number(),
  gallonsEmpty: z.number(),
  gallonsWithCustomer: z.number(),
  gallonsDamaged: z.number(),
  reorderLevel: z.number(),
  lowStock: z.boolean(),
  version: z.number(),
  createdAt: z.string().nullable(),
});

export const itemPageSchema = z.object({
  items: z.array(itemSchema),
  nextCursor: z.string().nullable(),
});

export const movementSchema = z.object({
  id: z.string(),
  itemId: z.string(),
  type: z.string(),
  quantity: z.number(),
  reason: z.string(),
  actorId: z.string(),
  scheduleId: z.string().nullable(),
  createdAt: z.string().nullable(),
});

export const movementListSchema = z.object({
  items: z.array(movementSchema),
});

export const createItemSchema = z.object({
  name: z.string().trim().min(2, "Enter an item name.").max(120),
  sku: z.string().trim().min(2, "Enter a SKU.").max(48),
  openingQuantity: z.number().int().min(0).max(1_000_000),
  reorderLevel: z.number().int().min(0).max(1_000_000),
});

export const updateItemSchema = z.object({
  name: z.string().trim().min(2, "Enter an item name.").max(120),
  reorderLevel: z.number().int().min(0).max(1_000_000),
});

export const movementFormSchema = z.object({
  type: z.enum(["in", "out", "return", "adjust", "damaged", "deliver"]),
  quantity: z
    .number({ invalid_type_error: "Enter a quantity." })
    .int("Use a whole number.")
    .refine((value) => value !== 0, "Quantity cannot be zero."),
  reason: z.string().trim().min(3, "Add a reason.").max(255),
});

export const MOVEMENT_LABELS: Record<string, string> = {
  in: "Stock in",
  out: "Stock out",
  return: "Empty return",
  adjust: "Adjustment",
  damaged: "Damaged",
  deliver: "Delivered to customer",
};

export type InventoryItem = z.infer<typeof itemSchema>;
export type InventoryMovement = z.infer<typeof movementSchema>;
export type CreateItemValues = z.infer<typeof createItemSchema>;
export type UpdateItemValues = z.infer<typeof updateItemSchema>;
export type MovementValues = z.infer<typeof movementFormSchema>;
