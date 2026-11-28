import type { FastifyInstance } from "fastify";
import { and, eq } from "drizzle-orm";
import type { AppContext } from "../../context";
import { customers, subscriptions } from "../../db/schema";
import { newId } from "../../lib/crypto";
import { errors, parseBody } from "../../lib/errors";
import {
  createSubscriptionSchema,
  querySubscriptionsSchema,
  subscriptionStatusSchema,
  updateSubscriptionSchema,
} from "./schemas";
import { findSubscription, querySubscriptions } from "./service";

const SUBSCRIPTION_TRANSITIONS: Record<string, string[]> = {
  Active: ["Paused", "Cancelled"],
  Paused: ["Active", "Cancelled"],
  Cancelled: ["Active"],
};

export async function registerSubscriptionRoutes(app: FastifyInstance, ctx: AppContext): Promise<void> {
  const hooks = { preHandler: [ctx.authenticate] };

  app.post("/subscriptions/query", hooks, async (request) => {
    ctx.assertGrant(request, "scheduling:view");
    const input = parseBody(querySubscriptionsSchema, request.body ?? {});
    return querySubscriptions(ctx.db, input);
  });

  app.get<{ Params: { id: string } }>("/subscriptions/:id", hooks, async (request) => {
    ctx.assertGrant(request, "scheduling:view");
    const row = await findSubscription(ctx.db, request.params.id);
    if (!row) throw errors.notFound();
    return row;
  });

  app.post("/subscriptions", hooks, async (request, reply) => {
    ctx.assertGrant(request, "scheduling:add");
    const actor = ctx.requireUser(request);
    const input = parseBody(createSubscriptionSchema, request.body);

    const customerRows = await ctx.db
      .select({ id: customers.id })
      .from(customers)
      .where(and(eq(customers.id, input.customerId), eq(customers.status, "active")))
      .limit(1);
    if (customerRows.length === 0) throw errors.invalid("Select an active customer.");

    const id = newId();
    await ctx.db.insert(subscriptions).values({
      id,
      customerId: input.customerId,
      planName: input.planName,
      status: input.status ?? "Active",
      gallonsPerDelivery: input.gallonsPerDelivery,
      frequency: input.frequency,
      priceCentavos: input.priceCentavos,
      startDate: input.startDate,
      nextBillingDate: input.nextBillingDate ?? null,
      assignedUserId: input.assignedUserId ?? null,
      notes: input.notes ?? "",
    });
    await ctx.audit({
      actorId: actor.id,
      event: "SUBSCRIPTION_CREATE",
      entityType: "subscription",
      entityId: id,
    });
    const row = await findSubscription(ctx.db, id);
    if (!row) throw errors.notFound();
    reply.code(201);
    return row;
  });

  app.patch<{ Params: { id: string } }>("/subscriptions/:id", hooks, async (request) => {
    ctx.assertGrant(request, "scheduling:edit");
    const actor = ctx.requireUser(request);
    const input = parseBody(updateSubscriptionSchema, request.body);
    const rows = await ctx.db.select().from(subscriptions).where(eq(subscriptions.id, request.params.id)).limit(1);
    const existing = rows[0];
    if (!existing) throw errors.notFound();
    if (existing.status === "Cancelled") throw errors.conflict("A cancelled subscription cannot be edited.");

    if (input.customerId) {
      const customerRows = await ctx.db
        .select({ id: customers.id })
        .from(customers)
        .where(and(eq(customers.id, input.customerId), eq(customers.status, "active")))
        .limit(1);
      if (customerRows.length === 0) throw errors.invalid("Select an active customer.");
    }

    const [result] = await ctx.db
      .update(subscriptions)
      .set({
        customerId: input.customerId ?? existing.customerId,
        planName: input.planName ?? existing.planName,
        status: input.status ?? existing.status,
        gallonsPerDelivery: input.gallonsPerDelivery ?? existing.gallonsPerDelivery,
        frequency: input.frequency ?? existing.frequency,
        priceCentavos: input.priceCentavos ?? existing.priceCentavos,
        startDate: input.startDate ?? existing.startDate,
        nextBillingDate: input.nextBillingDate !== undefined ? input.nextBillingDate : existing.nextBillingDate,
        assignedUserId: input.assignedUserId !== undefined ? input.assignedUserId : existing.assignedUserId,
        notes: input.notes ?? existing.notes,
        version: existing.version + 1,
      })
      .where(and(eq(subscriptions.id, existing.id), eq(subscriptions.version, input.version)));
    if (!result.affectedRows) throw errors.conflict();

    await ctx.audit({
      actorId: actor.id,
      event: "SUBSCRIPTION_UPDATE",
      entityType: "subscription",
      entityId: existing.id,
    });
    const row = await findSubscription(ctx.db, existing.id);
    if (!row) throw errors.notFound();
    return row;
  });

  app.post<{ Params: { id: string } }>("/subscriptions/:id/status", hooks, async (request) => {
    ctx.assertGrant(request, "scheduling:edit");
    const actor = ctx.requireUser(request);
    const input = parseBody(subscriptionStatusSchema, request.body);
    const rows = await ctx.db.select().from(subscriptions).where(eq(subscriptions.id, request.params.id)).limit(1);
    const existing = rows[0];
    if (!existing) throw errors.notFound();

    if (input.status === existing.status) throw errors.conflict("That is already the current status.");
    const allowed = SUBSCRIPTION_TRANSITIONS[existing.status] ?? [];
    if (!allowed.includes(input.status)) {
      throw errors.conflict(`Cannot move a ${existing.status} subscription to ${input.status}.`);
    }

    const [result] = await ctx.db
      .update(subscriptions)
      .set({ status: input.status, version: existing.version + 1 })
      .where(and(eq(subscriptions.id, existing.id), eq(subscriptions.version, input.version)));
    if (!result.affectedRows) throw errors.conflict();

    await ctx.audit({
      actorId: actor.id,
      event: "SUBSCRIPTION_UPDATE",
      entityType: "subscription",
      entityId: existing.id,
      detail: input.status,
    });
    const row = await findSubscription(ctx.db, existing.id);
    if (!row) throw errors.notFound();
    return row;
  });

  app.get("/subscriptions/export", hooks, async (request, reply) => {
    ctx.assertGrant(request, "scheduling:export");
    const actor = ctx.requireUser(request);
    const page = await querySubscriptions(ctx.db, { pageSize: 100 });
    await ctx.audit({
      actorId: actor.id,
      event: "SUBSCRIPTION_EXPORT",
      entityType: "subscription",
    });
    const header = "customer_code,plan_name,status,gallons_per_delivery,frequency,price_centavos,start_date,next_billing_date\n";
    const escape = (value: string) => `"${value.replaceAll('"', '""')}"`;
    const body = page.items
      .map(
        (sub) =>
          `${escape(sub.customerCode)},${escape(sub.planName)},${sub.status},${sub.gallonsPerDelivery},${sub.frequency},${sub.priceCentavos},${sub.startDate},${sub.nextBillingDate ?? ""}`,
      )
      .join("\n");
    reply.header("content-type", "text/csv; charset=utf-8");
    reply.header("content-disposition", "attachment; filename=subscriptions.csv");
    return `${header}${body}`;
  });
}
