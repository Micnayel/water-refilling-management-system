import { apiRequest } from "@/lib/api-client";
import {
  itemPageSchema,
  itemSchema,
  movementListSchema,
  movementSchema,
  type CreateItemValues,
  type InventoryItem,
  type MovementValues,
  type UpdateItemValues,
} from "./schemas";

export function queryInventory(input: {
  cursor?: string;
  pageSize: number;
  lowStock?: boolean;
}): Promise<{ items: InventoryItem[]; nextCursor: string | null }> {
  return apiRequest("/inventory/query", {
    method: "POST",
    body: input,
    schema: itemPageSchema,
  });
}

export function getItem(id: string): Promise<InventoryItem> {
  return apiRequest(`/inventory/${id}`, { schema: itemSchema });
}

export function createItem(values: CreateItemValues): Promise<InventoryItem> {
  return apiRequest("/inventory", {
    method: "POST",
    body: values,
    schema: itemSchema,
  });
}

export function updateItem(id: string, values: UpdateItemValues & { version: number }): Promise<InventoryItem> {
  return apiRequest(`/inventory/${id}`, {
    method: "PATCH",
    body: values,
    schema: itemSchema,
  });
}

export function addMovement(
  id: string,
  values: MovementValues & { version: number },
): Promise<InventoryItem> {
  return apiRequest(`/inventory/${id}/movements`, {
    method: "POST",
    body: values,
    schema: itemSchema,
  });
}

export function listMovements(id: string) {
  return apiRequest(`/inventory/${id}/movements`, { schema: movementListSchema });
}

export { movementSchema };
