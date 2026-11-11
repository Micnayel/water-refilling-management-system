import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CreateItemValues, MovementValues, UpdateItemValues } from "./schemas";
import * as service from "./service";

export const inventoryKeys = {
  list: ["inventory", "list"] as const,
  detail: (id: string) => ["inventory", "detail", id] as const,
  movements: (id: string) => ["inventory", "movements", id] as const,
};

export function useInventoryList(page: number, pageSize: number, lowStock: boolean) {
  const cursor = page <= 1 ? undefined : String((page - 1) * pageSize);
  return useQuery({
    queryKey: [...inventoryKeys.list, cursor ?? "start", pageSize, lowStock],
    queryFn: () => service.queryInventory({ cursor, pageSize, lowStock }),
    placeholderData: (previous) => previous,
  });
}

export function useInventoryItem(id: string | undefined) {
  return useQuery({
    queryKey: inventoryKeys.detail(id ?? "none"),
    queryFn: () => service.getItem(id as string),
    enabled: Boolean(id),
  });
}

export function useInventoryMovements(id: string | undefined) {
  return useQuery({
    queryKey: inventoryKeys.movements(id ?? "none"),
    queryFn: () => service.listMovements(id as string),
    enabled: Boolean(id),
  });
}

function useInvalidateInventory() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ["inventory"] });
}

export function useCreateItem() {
  const invalidate = useInvalidateInventory();
  return useMutation({
    mutationFn: (values: CreateItemValues) => service.createItem(values),
    onSuccess: invalidate,
  });
}

export function useUpdateItem(id: string) {
  const invalidate = useInvalidateInventory();
  return useMutation({
    mutationFn: (values: UpdateItemValues & { version: number }) => service.updateItem(id, values),
    onSuccess: invalidate,
  });
}

export function useAddMovement(id: string) {
  const invalidate = useInvalidateInventory();
  return useMutation({
    mutationFn: (values: MovementValues & { version: number }) => service.addMovement(id, values),
    onSuccess: invalidate,
  });
}

/** Records a movement for an item chosen inside a form rather than a route. */
export function useRecordStock() {
  const invalidate = useInvalidateInventory();
  return useMutation({
    mutationFn: (input: { id: string; values: MovementValues & { version: number } }) =>
      service.addMovement(input.id, input.values),
    onSuccess: invalidate,
  });
}
