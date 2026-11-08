import type { FastifyInstance } from "fastify";
import { and, eq } from "drizzle-orm";
import type { AppContext } from "../../context";
import { inventoryItems, stockMovements } from "../../db/schema";
import { newId } from "../../lib/crypto";
import { errors, parseBody } from "../../lib/errors";
import {
  createItemSchema,
  movementSchema,
  queryInventorySchema,
  updateItemSchema,
} from "./schemas";
import {
  applyMovement,
  findItem,
  listMovements,
  queryInventory,
  serializeItem,
} from "./service";

export async function registerInventoryRoutes(app: FastifyInstance, ctx: AppContext): Promise<void> {
  const hooks = { preHandler: [ctx.authenticate] };

  app.post("/inventory/query", hooks, async (request) => {
    ctx.assertGrant(request, "inventory:view");
    const input = parseBody(queryInventorySchema, request.body ?? {});
    return queryInventory(ctx.db, input);
  });

  app.get<{ Params: { id: string } }>("/inventory/:id", hooks, async (request) => {
    ctx.assertGrant(request, "inventory:view");
    const row = await findItem(ctx.db, request.params.id);
    if (!row) throw errors.notFound();
    return serializeItem(row);
  });

  app.get<{ Params: { id: string } }>("/inventory/:id/movements", hooks, async (request) => {
    ctx.assertGrant(request, "inventory:view");
    const row = await findItem(ctx.db, request.params.id);
    if (!row) throw errors.notFound();
    return { items: await listMovements(ctx.db, row.id) };
  });

  app.post("/inventory", hooks, async (request, reply) => {
    ctx.assertGrant(request, "inventory:add");
    const actor = ctx.requireUser(request);
    const input = parseBody(createItemSchema, request.body);

    const duplicate = await ctx.db
      .select({ id: inventoryItems.id })
      .from(inventoryItems)
      .where(eq(inventoryItems.sku, input.sku))
      .limit(1);
    if (duplicate.length > 0) throw errors.conflict("That SKU is already in use.");

    const id = newId();
    const opening = input.openingQuantity ?? 0;

    await ctx.db.transaction(async (tx) => {
      await tx.insert(inventoryItems).values({
        id,
        name: input.name,
        sku: input.sku,
        gallonsFull: opening,
        reorderLevel: input.reorderLevel ?? 0,
      });
      if (opening > 0) {
        await tx.insert(stockMovements).values({
          id: newId(),
          itemId: id,
          type: "in",
          quantity: opening,
          reason: "Opening stock",
          actorId: actor.id,
        });
      }
    });

    await ctx.audit({
      actorId: actor.id,
      event: "INVENTORY_CREATE",
      entityType: "inventory_item",
      entityId: id,
    });
    const row = await findItem(ctx.db, id);
    if (!row) throw errors.notFound();
    reply.code(201);
    return serializeItem(row);
  });

  app.patch<{ Params: { id: string } }>("/inventory/:id", hooks, async (request) => {
    ctx.assertGrant(request, "inventory:edit");
    const actor = ctx.requireUser(request);
    const input = parseBody(updateItemSchema, request.body);
    const existing = await findItem(ctx.db, request.params.id);
    if (!existing) throw errors.notFound();

    const [result] = await ctx.db
      .update(inventoryItems)
      .set({
        name: input.name ?? existing.name,
        reorderLevel: input.reorderLevel ?? existing.reorderLevel,
        version: existing.version + 1,
      })
      .where(and(eq(inventoryItems.id, existing.id), eq(inventoryItems.version, input.version)));
    if (!result.affectedRows) throw errors.conflict();

    await ctx.audit({
      actorId: actor.id,
      event: "INVENTORY_UPDATE",
      entityType: "inventory_item",
      entityId: existing.id,
    });
    const row = await findItem(ctx.db, existing.id);
    if (!row) throw errors.notFound();
    return serializeItem(row);
  });

  app.post<{ Params: { id: string } }>("/inventory/:id/movements", hooks, async (request, reply) => {
    ctx.assertGrant(request, "inventory:edit");
    const actor = ctx.requireUser(request);
    const input = parseBody(movementSchema, request.body);

    const item = await ctx.db.transaction(async (tx) =>
      applyMovement(tx, {
        itemId: request.params.id,
        type: input.type,
        quantity: input.quantity,
        reason: input.reason,
        actorId: actor.id,
        expectedVersion: input.version,
      }),
    );

    await ctx.audit({
      actorId: actor.id,
      event: "INVENTORY_UPDATE",
      entityType: "inventory_item",
      entityId: request.params.id,
      detail: input.type,
    });
    reply.code(201);
    return item;
  });

  app.get("/inventory/export", hooks, async (request, reply) => {
    ctx.assertGrant(request, "inventory:export");
    const actor = ctx.requireUser(request);
    const page = await queryInventory(ctx.db, { pageSize: 100 });
    await ctx.audit({
      actorId: actor.id,
      event: "INVENTORY_EXPORT",
      entityType: "inventory_item",
    });
    const header = "sku,name,full,empty,with_customer,damaged,reorder_level\n";
    const body = page.items
      .map(
        (item) =>
          `${item.sku},"${item.name}",${item.gallonsFull},${item.gallonsEmpty},${item.gallonsWithCustomer},${item.gallonsDamaged},${item.reorderLevel}`,
      )
      .join("\n");
    reply.header("content-type", "text/csv; charset=utf-8");
    reply.header("content-disposition", "attachment; filename=inventory.csv");
    return `${header}${body}`;
  });
}
