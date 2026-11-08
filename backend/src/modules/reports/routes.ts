import type { FastifyInstance } from "fastify";
import { and, gte, lt, sql } from "drizzle-orm";
import { z } from "zod";
import type { AppContext } from "../../context";
import { customers, sales, schedules } from "../../db/schema";
import { parseIsoDate } from "../../lib/dates";
import { errors, parseBody } from "../../lib/errors";

const reportQuerySchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

type ReportInput = z.infer<typeof reportQuerySchema>;

async function buildReport(ctx: AppContext, input: ReportInput) {
  const end = new Date(parseIsoDate(input.to).getTime() + 24 * 60 * 60 * 1000);
  const start = parseIsoDate(input.from);
  if (start > end) throw errors.invalid("The start date must be before the end date.");

  const salesRows = await ctx.db
    .select({
      total: sql<number>`coalesce(sum(${sales.amountCentavos}), 0)`,
      count: sql<number>`count(*)`,
      gallons: sql<number>`coalesce(sum(${sales.gallons}), 0)`,
    })
    .from(sales)
    .where(and(gte(sales.createdAt, start), lt(sales.createdAt, end)));

  const scheduleRows = await ctx.db
    .select({
      status: schedules.status,
      count: sql<number>`count(*)`,
    })
    .from(schedules)
    .where(and(gte(schedules.scheduledDate, input.from), lt(schedules.scheduledDate, input.to)))
    .groupBy(schedules.status);

  const customerRows = await ctx.db
    .select({ count: sql<number>`count(*)` })
    .from(customers)
    .where(and(gte(customers.createdAt, start), lt(customers.createdAt, end)));

  return {
    from: input.from,
    to: input.to,
    salesCentavos: Number(salesRows[0]?.total ?? 0),
    salesCount: Number(salesRows[0]?.count ?? 0),
    gallonsDelivered: Number(salesRows[0]?.gallons ?? 0),
    newCustomers: Number(customerRows[0]?.count ?? 0),
    schedulesByStatus: scheduleRows.map((row) => ({
      status: row.status,
      count: Number(row.count),
    })),
  };
}

export async function registerReportRoutes(app: FastifyInstance, ctx: AppContext): Promise<void> {
  const hooks = { preHandler: [ctx.authenticate] };

  app.get("/reports/summary", hooks, async (request) => {
    ctx.assertGrant(request, "reports:view");
    const input = parseBody(reportQuerySchema, request.query);
    return buildReport(ctx, input);
  });

  app.get("/reports/export", hooks, async (request, reply) => {
    ctx.assertGrant(request, "reports:export");
    const actor = ctx.requireUser(request);
    const input = parseBody(reportQuerySchema, request.query);
    const report = await buildReport(ctx, input);
    await ctx.audit({
      actorId: actor.id,
      event: "REPORTS_EXPORT",
      entityType: "report",
    });
    const lines = [
      "metric,value",
      `period,${report.from} to ${report.to}`,
      `sales_centavos,${report.salesCentavos}`,
      `sales_count,${report.salesCount}`,
      `gallons_delivered,${report.gallonsDelivered}`,
      `new_customers,${report.newCustomers}`,
      ...report.schedulesByStatus.map((row) => `schedule_${row.status.replaceAll(" ", "_")},${row.count}`),
    ];
    reply.header("content-type", "text/csv; charset=utf-8");
    reply.header("content-disposition", "attachment; filename=report.csv");
    return lines.join("\n");
  });
}
