import type { FastifyInstance } from "fastify";
import { and, eq, gte, isNotNull, lt, sql } from "drizzle-orm";
import type { AppContext } from "../../context";
import { customers, sales } from "../../db/schema";
import { manilaDayRange, manilaMonthRange } from "../../lib/dates";
import { errors, parseBody } from "../../lib/errors";
import { inventoryTotals } from "../inventory/service";
import { findCustomer, revealCustomer } from "../customers/service";
import { z } from "zod";

const revealSchema = z.object({
  customerId: z.string().uuid(),
  field: z.enum(["name", "location"]).default("location"),
});

async function salesTotal(ctx: AppContext, start: Date, end: Date) {
  const rows = await ctx.db
    .select({
      total: sql<number>`coalesce(sum(${sales.amountCentavos}), 0)`,
      count: sql<number>`count(*)`,
      gallons: sql<number>`coalesce(sum(${sales.gallons}), 0)`,
    })
    .from(sales)
    .where(and(gte(sales.createdAt, start), lt(sales.createdAt, end)));
  return {
    totalCentavos: Number(rows[0]?.total ?? 0),
    count: Number(rows[0]?.count ?? 0),
    gallons: Number(rows[0]?.gallons ?? 0),
  };
}

export async function registerDashboardRoutes(app: FastifyInstance, ctx: AppContext): Promise<void> {
  const hooks = { preHandler: [ctx.authenticate] };

  app.get("/dashboard/summary", hooks, async (request) => {
    ctx.assertGrant(request, "dashboard:view");
    const day = manilaDayRange();
    const month = manilaMonthRange();
    const [today, thisMonth, inventory, clientRows, locationRows] = await Promise.all([
      salesTotal(ctx, day.start, day.end),
      salesTotal(ctx, month.start, month.end),
      inventoryTotals(ctx.db),
      ctx.db
        .select({ value: sql<number>`count(*)` })
        .from(customers)
        .where(eq(customers.status, "active")),
      ctx.db
        .select({
          barangay: customers.barangay,
          count: sql<number>`count(*)`,
        })
        .from(customers)
        .where(eq(customers.status, "active"))
        .groupBy(customers.barangay),
    ]);

    return {
      salesTodayCentavos: today.totalCentavos,
      salesTodayCount: today.count,
      salesMonthCentavos: thisMonth.totalCentavos,
      salesMonthCount: thisMonth.count,
      clientCount: Number(clientRows[0]?.value ?? 0),
      inventoryFull: inventory.full,
      inventoryWithCustomer: inventory.withCustomer,
      lowStockCount: inventory.lowStockCount,
      clientLocationStats: locationRows.map((row) => ({
        area: row.barangay || "Unassigned",
        count: Number(row.count),
      })),
    };
  });

  app.get("/dashboard/map", hooks, async (request) => {
    ctx.assertGrant(request, "dashboard:view");
    const rows = await ctx.db
      .select({
        barangay: customers.barangay,
        count: sql<number>`count(*)`,
        latitude: sql<number>`avg(cast(${customers.latitude} as decimal(10,6)))`,
        longitude: sql<number>`avg(cast(${customers.longitude} as decimal(10,6)))`,
      })
      .from(customers)
      .where(
        and(
          eq(customers.status, "active"),
          isNotNull(customers.latitude),
          isNotNull(customers.longitude),
        ),
      )
      .groupBy(customers.barangay);

    return {
      masked: true,
      points: rows
        .filter((row) => row.latitude !== null && row.longitude !== null)
        .map((row) => ({
          label: row.barangay || "General area",
          latitude: Math.round(Number(row.latitude) * 100) / 100,
          longitude: Math.round(Number(row.longitude) * 100) / 100,
          count: Number(row.count),
        })),
    };
  });

  app.post("/dashboard/reveal", hooks, async (request) => {
    ctx.assertGrant(request, "customers:reveal");
    const actor = ctx.requireUser(request);
    const input = parseBody(revealSchema, request.body);
    const row = await findCustomer(ctx.db, input.customerId);
    if (!row) throw errors.notFound();
    await ctx.audit({
      actorId: actor.id,
      event: "ACCESS",
      entityType: "customer",
      entityId: row.id,
      detail: `dashboard_${input.field}_reveal`,
    });
    const revealed = revealCustomer(row);
    return input.field === "name"
      ? { id: revealed.id, name: revealed.name }
      : {
          id: revealed.id,
          name: revealed.name,
          latitude: revealed.latitude,
          longitude: revealed.longitude,
        };
  });
}
