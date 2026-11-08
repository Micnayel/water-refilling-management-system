import type { FastifyInstance } from "fastify";
import { desc, eq, isNull, or } from "drizzle-orm";
import type { AppContext } from "../../context";
import { notifications } from "../../db/schema";
import { errors } from "../../lib/errors";

export async function registerNotificationRoutes(app: FastifyInstance, ctx: AppContext): Promise<void> {
  const hooks = { preHandler: [ctx.authenticate] };

  app.get("/notifications", hooks, async (request) => {
    ctx.assertGrant(request, "notifications:view");
    const actor = ctx.requireUser(request);
    const rows = await ctx.db
      .select()
      .from(notifications)
      .where(or(isNull(notifications.userId), eq(notifications.userId, actor.id)))
      .orderBy(desc(notifications.createdAt))
      .limit(50);
    return {
      items: rows.map((row) => ({
        id: row.id,
        kind: row.kind,
        message: row.message,
        readAt: row.readAt ? new Date(row.readAt).toISOString() : null,
        createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : null,
      })),
    };
  });

  app.post<{ Params: { id: string } }>("/notifications/:id/read", hooks, async (request) => {
    ctx.assertGrant(request, "notifications:view");
    const actor = ctx.requireUser(request);
    const rows = await ctx.db
      .select()
      .from(notifications)
      .where(eq(notifications.id, request.params.id))
      .limit(1);
    const row = rows[0];
    if (!row) throw errors.notFound();
    if (row.userId !== null && row.userId !== actor.id) throw errors.forbidden();
    await ctx.db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(eq(notifications.id, row.id));
    return { ok: true };
  });
}
