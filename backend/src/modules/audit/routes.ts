import type { FastifyInstance } from "fastify";
import { desc, eq, and } from "drizzle-orm";
import { z } from "zod";
import type { AppContext } from "../../context";
import { auditEvents } from "../../db/schema";
import { parseBody } from "../../lib/errors";
import { buildPage, decodeCursor } from "../../lib/pagination";

const querySchema = z.object({
  cursor: z.string().optional(),
  pageSize: z.number().int().min(1).max(100).optional(),
  event: z.string().trim().max(64).optional(),
});

export async function registerAuditRoutes(app: FastifyInstance, ctx: AppContext): Promise<void> {
  app.post("/audit/query", { preHandler: [ctx.authenticate] }, async (request) => {
    ctx.assertGrant(request, "audit:view");
    const input = parseBody(querySchema, request.body ?? {});
    const offset = decodeCursor(input.cursor);
    const pageSize = input.pageSize ?? 20;
    const rows = await ctx.db
      .select()
      .from(auditEvents)
      .where(input.event ? and(eq(auditEvents.event, input.event)) : undefined)
      .orderBy(desc(auditEvents.createdAt))
      .limit(pageSize + 1)
      .offset(offset);
    return buildPage(
      rows.map((row) => ({
        id: row.id,
        actorId: row.actorId,
        event: row.event,
        entityType: row.entityType,
        entityId: row.entityId,
        detail: row.detail,
        createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : null,
      })),
      offset,
      pageSize,
    );
  });
}
