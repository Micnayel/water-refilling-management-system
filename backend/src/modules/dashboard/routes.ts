import type { FastifyInstance } from "fastify";
import { and, eq, gte, isNotNull, lt, or, sql } from "drizzle-orm";
import type { AppContext } from "../../context";
import { customers, inventoryItems, sales, schedules } from "../../db/schema";
import { formatManilaDate, manilaDayRange, manilaMonthRange } from "../../lib/dates";
import { errors, parseBody } from "../../lib/errors";
import { inventoryTotals } from "../inventory/service";
import { findCustomer, maskName, revealCustomer } from "../customers/service";
import { querySchedules } from "../scheduling/service";
import { countActiveSubscriptions } from "../subscriptions/service";
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
    const todayIsoDate = formatManilaDate(day.start);
    const analyticsStart = new Date(day.start.getTime() - 13 * 24 * 60 * 60 * 1000);
    const [
      today,
      thisMonth,
      inventory,
      totalCustomerRows,
      clientRows,
      locationRows,
      activeSubscriptions,
      todaysOrderRows,
      pendingOrderRows,
      ongoingDeliveryRows,
      completedDeliveryRows,
      revenueTotalRows,
      recentCustomerRows,
      latestOrders,
      deliveryCountRows,
      inventoryItemRows,
      lowStockRows,
      analyticsSalesRows,
      analyticsOrderRows,
    ] = await Promise.all([
      salesTotal(ctx, day.start, day.end),
      salesTotal(ctx, month.start, month.end),
      inventoryTotals(ctx.db),
      ctx.db.select({ value: sql<number>`count(*)` }).from(customers),
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
      countActiveSubscriptions(ctx.db),
      ctx.db
        .select({ value: sql<number>`count(*)` })
        .from(schedules)
        .where(
          or(
            eq(schedules.scheduledDate, todayIsoDate),
            and(gte(schedules.createdAt, day.start), lt(schedules.createdAt, day.end)),
          ),
        ),
      ctx.db.select({ value: sql<number>`count(*)` }).from(schedules).where(eq(schedules.status, "Scheduled")),
      ctx.db
        .select({ value: sql<number>`count(*)` })
        .from(schedules)
        .where(eq(schedules.status, "Out for delivery")),
      ctx.db.select({ value: sql<number>`count(*)` }).from(schedules).where(eq(schedules.status, "Completed")),
      ctx.db.select({ value: sql<number>`coalesce(sum(${sales.amountCentavos}), 0)` }).from(sales),
      ctx.db
        .select({ id: customers.id, code: customers.code, name: customers.name, status: customers.status, createdAt: customers.createdAt })
        .from(customers)
        .orderBy(sql`${customers.createdAt} desc`)
        .limit(5),
      querySchedules(ctx.db, { pageSize: 5 }),
      ctx.db
        .select({ status: schedules.status, count: sql<number>`count(*)` })
        .from(schedules)
        .groupBy(schedules.status),
      ctx.db.select({ value: sql<number>`count(*)` }).from(inventoryItems),
      ctx.db
        .select({ name: inventoryItems.name, gallonsFull: inventoryItems.gallonsFull, reorderLevel: inventoryItems.reorderLevel })
        .from(inventoryItems)
        .where(sql`${inventoryItems.gallonsFull} <= ${inventoryItems.reorderLevel}`)
        .orderBy(inventoryItems.gallonsFull)
        .limit(5),
      ctx.db
        .select({ createdAt: sales.createdAt, amountCentavos: sales.amountCentavos })
        .from(sales)
        .where(gte(sales.createdAt, analyticsStart)),
      ctx.db
        .select({ createdAt: schedules.createdAt })
        .from(schedules)
        .where(gte(schedules.createdAt, analyticsStart)),
    ]);

    // 14-day daily analytics, bucketed in Asia/Manila.
    const series: Array<{ date: string; salesCentavos: number; orders: number }> = [];
    const seriesIndex = new Map<string, number>();
    for (let i = 13; i >= 0; i -= 1) {
      const bucketDate = formatManilaDate(new Date(day.start.getTime() - i * 24 * 60 * 60 * 1000));
      seriesIndex.set(bucketDate, series.length);
      series.push({ date: bucketDate, salesCentavos: 0, orders: 0 });
    }
    for (const row of analyticsSalesRows) {
      if (!row.createdAt) continue;
      const idx = seriesIndex.get(formatManilaDate(new Date(row.createdAt)));
      const bucket = idx !== undefined ? series[idx] : undefined;
      if (bucket) bucket.salesCentavos += Number(row.amountCentavos ?? 0);
    }
    for (const row of analyticsOrderRows) {
      if (!row.createdAt) continue;
      const idx = seriesIndex.get(formatManilaDate(new Date(row.createdAt)));
      const bucket = idx !== undefined ? series[idx] : undefined;
      if (bucket) bucket.orders += 1;
    }

    const scheduledCount = Number(deliveryCountRows.find((row) => row.status === "Scheduled")?.count ?? 0);
    const ongoingCount = Number(deliveryCountRows.find((row) => row.status === "Out for delivery")?.count ?? 0);
    const completedCount = Number(deliveryCountRows.find((row) => row.status === "Completed")?.count ?? 0);
    const cancelledCount = Number(deliveryCountRows.find((row) => row.status === "Cancelled")?.count ?? 0);

    return {
      salesTodayCentavos: today.totalCentavos,
      salesTodayCount: today.count,
      salesMonthCentavos: thisMonth.totalCentavos,
      salesMonthCount: thisMonth.count,
      clientCount: Number(clientRows[0]?.value ?? 0),
      totalCustomers: Number(totalCustomerRows[0]?.value ?? 0),
      inventoryFull: inventory.full,
      inventoryWithCustomer: inventory.withCustomer,
      lowStockCount: inventory.lowStockCount,
      activeSubscriptions,
      todaysOrders: Number(todaysOrderRows[0]?.value ?? 0),
      pendingOrders: Number(pendingOrderRows[0]?.value ?? 0),
      ongoingDeliveries: Number(ongoingDeliveryRows[0]?.value ?? 0),
      completedDeliveries: Number(completedDeliveryRows[0]?.value ?? 0),
      revenueTotalCentavos: Number(revenueTotalRows[0]?.value ?? 0),
      revenueTodayCentavos: today.totalCentavos,
      revenueMonthCentavos: thisMonth.totalCentavos,
      analyticsSeries: series,
      recentCustomers: recentCustomerRows.map((row) => ({
        id: row.id,
        code: row.code,
        name: maskName(row.name),
        status: row.status,
        createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : null,
      })),
      latestOrders: latestOrders.items,
      deliveryMonitoring: {
        scheduled: scheduledCount,
        ongoing: ongoingCount,
        completed: completedCount,
        cancelled: cancelledCount,
        total: scheduledCount + ongoingCount + completedCount + cancelledCount,
      },
      inventoryItemCount: Number(inventoryItemRows[0]?.value ?? 0),
      lowStockItems: lowStockRows.map((row) => ({
        name: row.name,
        gallonsFull: Number(row.gallonsFull),
        reorderLevel: Number(row.reorderLevel),
      })),
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
