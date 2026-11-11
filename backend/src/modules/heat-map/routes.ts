import type { FastifyInstance } from "fastify";
import { and, eq, gte, isNotNull, lte, sql } from "drizzle-orm";
import { z } from "zod";
import type { AppContext } from "../../context";
import { customers, schedules } from "../../db/schema";
import { parseIsoDate } from "../../lib/dates";
import { errors, parseBody } from "../../lib/errors";
import { newId } from "../../lib/crypto";
import { toCsv, toPdf, toXlsx, type ExportFormat } from "./export";

const heatQuerySchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  metric: z.enum(["customer-density", "completed-deliveries"]),
  area: z.string().trim().max(120).optional(),
  format: z.enum(["csv", "xlsx", "pdf"]).optional(),
});

const MIN_CELL_SIZE = 3;

type HeatInput = z.infer<typeof heatQuerySchema>;

interface Cell {
  area: string;
  latitude: number;
  longitude: number;
  count: number;
}

/** Customer density counts customers registered inside the selected range. */
function registrationWindow(input: HeatInput): { start: Date; end: Date } {
  return {
    start: new Date(`${input.from}T00:00:00+08:00`),
    end: new Date(`${input.to}T23:59:59.999+08:00`),
  };
}

async function loadCells(ctx: AppContext, input: HeatInput): Promise<{ cells: Cell[]; suppressedCells: number }> {
  const filters = [
    isNotNull(customers.latitude),
    isNotNull(customers.longitude),
  ];
  if (input.area) filters.push(eq(customers.barangay, input.area));
  if (input.metric === "customer-density") {
    const window = registrationWindow(input);
    filters.push(eq(customers.status, "active"));
    filters.push(gte(customers.createdAt, window.start));
    filters.push(lte(customers.createdAt, window.end));
  }

  const base = ctx.db
    .select({
      area: customers.barangay,
      count:
        input.metric === "customer-density"
          ? sql<number>`count(*)`
          : sql<number>`count(${schedules.id})`,
      latitude: sql<number>`avg(cast(${customers.latitude} as decimal(10,6)))`,
      longitude: sql<number>`avg(cast(${customers.longitude} as decimal(10,6)))`,
    })
    .from(customers);

  const query =
    input.metric === "completed-deliveries"
      ? base
          .innerJoin(schedules, eq(schedules.customerId, customers.id))
          .where(
            and(
              ...filters,
              eq(schedules.status, "Completed"),
              gte(schedules.scheduledDate, input.from),
              lte(schedules.scheduledDate, input.to),
            ),
          )
      : base.where(and(...filters));

  const rows = await query.groupBy(customers.barangay);

  const cells: Cell[] = [];
  let suppressedCells = 0;
  for (const row of rows) {
    const count = Number(row.count);
    if (row.latitude === null || row.longitude === null) continue;
    if (count < MIN_CELL_SIZE) {
      suppressedCells += 1;
      continue;
    }
    cells.push({
      area: row.area || "General area",
      latitude: Math.round(Number(row.latitude) * 1000) / 1000,
      longitude: Math.round(Number(row.longitude) * 1000) / 1000,
      count,
    });
  }
  return { cells, suppressedCells };
}

export async function registerHeatMapRoutes(app: FastifyInstance, ctx: AppContext): Promise<void> {
  const hooks = { preHandler: [ctx.authenticate] };

  app.post("/heat-map/points", hooks, async (request) => {
    ctx.assertGrant(request, "heatmap:view");
    const input = parseBody(heatQuerySchema, request.body);
    if (parseIsoDate(input.from) > parseIsoDate(input.to)) {
      throw errors.invalid("The start date must be before the end date.");
    }
    const result = await loadCells(ctx, input);
    return {
      bucket: "barangay" as const,
      minCellSize: MIN_CELL_SIZE,
      cells: result.cells,
      suppressedCells: result.suppressedCells,
    };
  });

  app.post("/heat-map/export", hooks, async (request, reply) => {
    ctx.assertGrant(request, "heatmap:export");
    const actor = ctx.requireUser(request);
    const input = parseBody(heatQuerySchema, request.body);
    const format: ExportFormat = input.format ?? "csv";
    const result = await loadCells(ctx, input);
    await ctx.audit({
      actorId: actor.id,
      event: "HEATMAP_EXPORT",
      entityType: "heat_map",
      entityId: newId(),
      detail: `${input.metric}:${format}`,
    });

    const meta = {
      from: input.from,
      to: input.to,
      metric: input.metric,
      area: input.area,
      minCellSize: MIN_CELL_SIZE,
      suppressedCells: result.suppressedCells,
    };
    const filename = `heat-map-${input.from}-to-${input.to}.${format}`;
    reply.header("content-disposition", `attachment; filename=${filename}`);
    if (format === "xlsx") {
      reply.header(
        "content-type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
      return toXlsx(result.cells);
    }
    if (format === "pdf") {
      reply.header("content-type", "application/pdf");
      return toPdf(result.cells, meta);
    }
    reply.header("content-type", "text/csv; charset=utf-8");
    return toCsv(result.cells, meta);
  });
}
