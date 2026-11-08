import { describe, expect, it } from "vitest";
import { createItemSchema, movementFormSchema, updateItemSchema } from "@/modules/inventory/schemas";

describe("inventory schemas", () => {
  it("accepts a valid new item", () => {
    const result = createItemSchema.safeParse({
      name: "Slim gallon",
      sku: "GAL-SLIM",
      openingQuantity: 10,
      reorderLevel: 3,
    });
    expect(result.success).toBe(true);
  });

  it("rejects negative opening quantities", () => {
    const result = createItemSchema.safeParse({
      name: "Slim gallon",
      sku: "GAL-SLIM",
      openingQuantity: -1,
      reorderLevel: 0,
    });
    expect(result.success).toBe(false);
  });

  it("requires a reason and a non-zero whole movement quantity", () => {
    expect(movementFormSchema.safeParse({ type: "in", quantity: 0, reason: "restock" }).success).toBe(false);
    expect(movementFormSchema.safeParse({ type: "in", quantity: 1.5, reason: "restock" }).success).toBe(false);
    expect(movementFormSchema.safeParse({ type: "in", quantity: 1, reason: "" }).success).toBe(false);
    expect(movementFormSchema.safeParse({ type: "in", quantity: 1, reason: "restock" }).success).toBe(true);
  });

  it("validates the editable item fields", () => {
    expect(updateItemSchema.safeParse({ name: "A", reorderLevel: 1 }).success).toBe(false);
    expect(updateItemSchema.safeParse({ name: "Slim gallon", reorderLevel: 2 }).success).toBe(true);
  });
});
