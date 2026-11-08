import type { FastifyInstance } from "fastify";
import { eq } from "drizzle-orm";
import { z } from "zod";
import type { AppContext } from "../../context";
import { systemSettings, users } from "../../db/schema";
import { errors, parseBody } from "../../lib/errors";

const templateSchema = z.object({
  template: z.string().trim().regex(/^[a-z0-9-]{1,64}$/),
});

const systemSettingsSchema = z.object({
  sessionTimeoutMinutes: z.union([z.literal(15), z.literal(30), z.literal(60), z.literal(120)]),
  version: z.number().int().min(0).optional(),
});

export async function registerSettingsRoutes(app: FastifyInstance, ctx: AppContext): Promise<void> {
  const hooks = { preHandler: [ctx.authenticate] };

  app.get("/settings/preferences", hooks, async (request) => {
    ctx.assertGrant(request, "settings:view");
    const actor = ctx.requireUser(request);
    return { template: actor.template };
  });

  app.put("/settings/preferences", hooks, async (request) => {
    ctx.assertGrant(request, "settings:view");
    const actor = ctx.requireUser(request);
    const input = parseBody(templateSchema, request.body);
    await ctx.db.update(users).set({ template: input.template }).where(eq(users.id, actor.id));
    await ctx.audit({
      actorId: actor.id,
      event: "SETTINGS_UPDATE",
      entityType: "user",
      entityId: actor.id,
      detail: "template",
    });
    return { template: input.template };
  });

  app.get("/settings/system", hooks, async (request) => {
    ctx.assertGrant(request, "settings:edit");
    const rows = await ctx.db.select().from(systemSettings).orderBy(systemSettings.settingKey);
    return {
      items: rows.map((row) => ({
        key: row.settingKey,
        value: row.value,
        version: row.version,
        updatedAt: row.updatedAt ? new Date(row.updatedAt).toISOString() : null,
      })),
    };
  });

  app.put("/settings/system", hooks, async (request) => {
    ctx.assertGrant(request, "settings:edit");
    const actor = ctx.requireUser(request);
    const input = parseBody(systemSettingsSchema, request.body);
    const key = "sessionTimeoutMinutes";
    const existing = await ctx.db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.settingKey, key))
      .limit(1);
    const current = existing[0];

    if (current) {
      if (input.version !== undefined && current.version !== input.version) throw errors.conflict();
      await ctx.db
        .update(systemSettings)
        .set({ value: String(input.sessionTimeoutMinutes), version: current.version + 1 })
        .where(eq(systemSettings.settingKey, key));
    } else {
      await ctx.db.insert(systemSettings).values({
        settingKey: key,
        value: String(input.sessionTimeoutMinutes),
      });
    }

    await ctx.audit({
      actorId: actor.id,
      event: "SETTINGS_UPDATE",
      entityType: "system_setting",
      entityId: key,
    });
    return { key, value: String(input.sessionTimeoutMinutes) };
  });
}
