import type { FastifyInstance } from "fastify";
import { eq, inArray } from "drizzle-orm";
import { z } from "zod";
import type { AppContext } from "../../context";
import type { Database } from "../../db/client";
import { systemSettings, users } from "../../db/schema";
import { errors, parseBody } from "../../lib/errors";

const templateSchema = z.object({
  template: z.string().trim().regex(/^[a-z0-9-]{1,64}$/),
});

const systemSettingsSchema = z.object({
  sessionTimeoutMinutes: z.union([z.literal(15), z.literal(30), z.literal(60), z.literal(120)]),
  version: z.number().int().min(0).optional(),
});

const STATION_KEYS = ["stationLatitude", "stationLongitude", "stationLabel"] as const;

const DEFAULT_STATION = {
  label: "Quezon City station",
  latitude: 14.676,
  longitude: 121.0437,
} as const;

const stationLocationSchema = z.object({
  label: z.string().trim().max(120).optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  version: z.number().int().min(0).optional(),
});

/** Reads the configured dispatch origin, falling back to the documented default. */
async function readStationLocation(db: Database) {
  const rows = await db
    .select()
    .from(systemSettings)
    .where(inArray(systemSettings.settingKey, [...STATION_KEYS]));
  const byKey = new Map(rows.map((row) => [row.settingKey, row]));
  const latitude = Number(byKey.get("stationLatitude")?.value);
  const longitude = Number(byKey.get("stationLongitude")?.value);
  // Invalid or missing rows fall back together so a half-written pair never ships.
  const valid =
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    Math.abs(latitude) <= 90 &&
    Math.abs(longitude) <= 180;
  return {
    label: byKey.get("stationLabel")?.value || DEFAULT_STATION.label,
    latitude: valid ? latitude : DEFAULT_STATION.latitude,
    longitude: valid ? longitude : DEFAULT_STATION.longitude,
    version: byKey.get("stationLatitude")?.version ?? 0,
  };
}

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

  // The station origin is not personal data; Heat Map users and Settings users
  // may read it so driving directions start from the right place.
  app.get("/settings/station", hooks, async (request) => {
    ctx.assertAnyGrant(request, ["heatmap:view", "settings:view"]);
    return readStationLocation(ctx.db);
  });

  app.put("/settings/station", hooks, async (request) => {
    ctx.assertGrant(request, "settings:edit");
    const actor = ctx.requireUser(request);
    const input = parseBody(stationLocationSchema, request.body);
    const current = await readStationLocation(ctx.db);
    if (input.version !== undefined && current.version !== input.version) throw errors.conflict();

    const label = input.label?.trim() || current.label;
    const entries: Array<[string, string]> = [
      ["stationLatitude", String(input.latitude)],
      ["stationLongitude", String(input.longitude)],
      ["stationLabel", label],
    ];

    await ctx.db.transaction(async (tx) => {
      for (const [key, value] of entries) {
        const existing = await tx
          .select()
          .from(systemSettings)
          .where(eq(systemSettings.settingKey, key))
          .limit(1);
        const row = existing[0];
        if (row) {
          await tx
            .update(systemSettings)
            .set({ value, version: row.version + 1 })
            .where(eq(systemSettings.settingKey, key));
        } else {
          await tx.insert(systemSettings).values({ settingKey: key, value });
        }
      }
    });

    await ctx.audit({
      actorId: actor.id,
      event: "SETTINGS_UPDATE",
      entityType: "system_setting",
      entityId: "stationLocation",
    });
    return readStationLocation(ctx.db);
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
