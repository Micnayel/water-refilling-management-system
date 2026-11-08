import { and, asc, desc, eq, sql } from "drizzle-orm";
import type { Database } from "../../db/client";
import { inventoryItems, stockMovements } from "../../db/schema";
import { newId } from "../../lib/crypto";
import { errors } from "../../lib/errors";
import { buildPage, decodeCursor, type Page } from "../../lib/pagination";
import type { MOVEMENT_TYPES } from "./schemas";

type Transaction = Parameters<Parameters<Database["transaction"]>[0]>[0];
export type Executor = Database | Transaction;
type MovementType = (typeof MOVEMENT_TYPES)[number];

export interface PublicItem {
  id: string;
  name: string;
  sku: string;
  gallonsFull: number;
  gallonsEmpty: number;
  gallonsWithCustomer: number;
  gallonsDamaged: number;
  reorderLevel: number;
  lowStock: boolean;
  version: number;
  createdAt: string | null;
}

export function serializeItem(row: typeof inventoryItems.$inferSelect): PublicItem {
  return {
    id: row.id,
    name: row.name,
    sku: row.sku,
    gallonsFull: row.gallonsFull,
    gallonsEmpty: row.gallonsEmpty,
    gallonsWithCustomer: row.gallonsWithCustomer,
    gallonsDamaged: row.gallonsDamaged,
    reorderLevel: row.reorderLevel,
    lowStock: row.gallonsFull <= row.reorderLevel,
    version: row.version,
    createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : null,
  };
}

export interface PublicMovement {
  id: string;
  itemId: string;
  type: string;
  quantity: number;
  reason: string;
  actorId: string;
  scheduleId: string | null;
  createdAt: string | null;
}

export function serializeMovement(row: typeof stockMovements.$inferSelect): PublicMovement {
  return {
    id: row.id,
    itemId: row.itemId,
    type: row.type,
    quantity: row.quantity,
    reason: row.reason,
    actorId: row.actorId,
    scheduleId: row.scheduleId ?? null,
    createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : null,
  };
}

export async function findItem(executor: Executor, id: string) {
  const rows = await executor.select().from(inventoryItems).where(eq(inventoryItems.id, id)).limit(1);
  return rows[0] ?? null;
}

export interface MovementInput {
  itemId: string;
  type: MovementType;
  quantity: number;
  reason: string;
  actorId: string;
  scheduleId?: string | null;
  expectedVersion?: number;
}

export async function applyMovement(executor: Executor, input: MovementInput): Promise<PublicItem> {
  const rows = await executor
    .select()
    .from(inventoryItems)
    .where(eq(inventoryItems.id, input.itemId))
    .limit(1);
  const item = rows[0];
  if (!item) throw errors.notFound();
  if (input.expectedVersion !== undefined && item.version !== input.expectedVersion) {
    throw errors.conflict();
  }

  const next = {
    gallonsFull: item.gallonsFull,
    gallonsEmpty: item.gallonsEmpty,
    gallonsWithCustomer: item.gallonsWithCustomer,
    gallonsDamaged: item.gallonsDamaged,
  };

  switch (input.type) {
    case "in":
      next.gallonsFull += input.quantity;
      break;
    case "out":
      next.gallonsFull -= input.quantity;
      break;
    case "deliver":
      next.gallonsFull -= input.quantity;
      next.gallonsWithCustomer += input.quantity;
      break;
    case "return":
      next.gallonsWithCustomer -= input.quantity;
      next.gallonsEmpty += input.quantity;
      break;
    case "damaged":
      next.gallonsFull -= input.quantity;
      next.gallonsDamaged += input.quantity;
      break;
    case "adjust":
      next.gallonsFull += input.quantity;
      break;
  }

  if (
    next.gallonsFull < 0 ||
    next.gallonsEmpty < 0 ||
    next.gallonsWithCustomer < 0 ||
    next.gallonsDamaged < 0
  ) {
    throw errors.conflict("Stock cannot go negative.");
  }

  await executor
    .update(inventoryItems)
    .set({ ...next, version: item.version + 1 })
    .where(eq(inventoryItems.id, item.id));

  await executor.insert(stockMovements).values({
    id: newId(),
    itemId: item.id,
    type: input.type,
    quantity: input.quantity,
    reason: input.reason,
    actorId: input.actorId,
    scheduleId: input.scheduleId ?? null,
  });

  const updated = await findItem(executor, item.id);
  if (!updated) throw errors.notFound();
  return serializeItem(updated);
}

export async function queryInventory(
  db: Database,
  input: { cursor?: string; pageSize?: number; lowStock?: boolean },
): Promise<Page<PublicItem>> {
  const offset = decodeCursor(input.cursor);
  const pageSize = input.pageSize ?? 20;
  const condition = input.lowStock
    ? sql`${inventoryItems.gallonsFull} <= ${inventoryItems.reorderLevel}`
    : undefined;
  const rows = await db
    .select()
    .from(inventoryItems)
    .where(condition)
    .orderBy(desc(inventoryItems.createdAt))
    .limit(pageSize + 1)
    .offset(offset);
  return buildPage(rows.map(serializeItem), offset, pageSize);
}

export async function listMovements(
  db: Database,
  itemId: string,
  limit = 50,
): Promise<PublicMovement[]> {
  const rows = await db
    .select()
    .from(stockMovements)
    .where(eq(stockMovements.itemId, itemId))
    .orderBy(desc(stockMovements.createdAt))
    .limit(limit);
  return rows.map(serializeMovement);
}

export async function inventoryTotals(db: Database): Promise<{
  full: number;
  withCustomer: number;
  lowStockCount: number;
}> {
  const rows = await db
    .select({
      full: sql<number>`coalesce(sum(${inventoryItems.gallonsFull}), 0)`,
      withCustomer: sql<number>`coalesce(sum(${inventoryItems.gallonsWithCustomer}), 0)`,
    })
    .from(inventoryItems);
  const low = await db
    .select({ value: sql<number>`count(*)` })
    .from(inventoryItems)
    .where(sql`${inventoryItems.gallonsFull} <= ${inventoryItems.reorderLevel}`);
  return {
    full: Number(rows[0]?.full ?? 0),
    withCustomer: Number(rows[0]?.withCustomer ?? 0),
    lowStockCount: Number(low[0]?.value ?? 0),
  };
}

export async function firstItem(executor: Executor) {
  const rows = await executor
    .select()
    .from(inventoryItems)
    .orderBy(asc(inventoryItems.createdAt))
    .limit(1);
  return rows[0] ?? null;
}

export async function itemForUpdate(executor: Executor, id: string) {
  const rows = await executor
    .select()
    .from(inventoryItems)
    .where(and(eq(inventoryItems.id, id)))
    .limit(1);
  return rows[0] ?? null;
}
