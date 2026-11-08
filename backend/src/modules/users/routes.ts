import type { FastifyInstance, FastifyRequest } from "fastify";
import { and, eq, sql } from "drizzle-orm";
import type { AppContext } from "../../context";
import { users, roles } from "../../db/schema";
import { hashPassword, newId } from "../../lib/crypto";
import { errors, parseBody } from "../../lib/errors";
import { parseGrants } from "../../lib/grants";
import {
  approveUserSchema,
  createUserSchema,
  queryUsersSchema,
  roleSchema,
  updateRoleSchema,
  updateUserSchema,
} from "./schemas";
import {
  countActiveAdministrators,
  findUser,
  listRoles,
  queryUsers,
  serializeRole,
  serializeUser,
} from "./service";

async function findRole(ctx: AppContext, roleId: string) {
  const rows = await ctx.db.select().from(roles).where(eq(roles.id, roleId)).limit(1);
  return rows[0] ?? null;
}

export async function registerUserRoutes(app: FastifyInstance, ctx: AppContext): Promise<void> {
  const adminView = { preHandler: [ctx.authenticate] };

  app.post("/users/query", adminView, async (request) => {
    ctx.assertGrant(request, "admin:view");
    ctx.assertGrant(request, "admin:edit");
    const input = parseBody(queryUsersSchema, request.body ?? {});
    return queryUsers(ctx.db, input);
  });

  app.get("/users/pending", adminView, async (request) => {
    ctx.assertGrant(request, "admin:view");
    ctx.assertGrant(request, "admin:edit");
    return queryUsers(ctx.db, { status: "pending", pageSize: 100 });
  });

  app.get<{ Params: { id: string } }>("/users/:id", adminView, async (request) => {
    ctx.assertGrant(request, "admin:view");
    ctx.assertGrant(request, "admin:edit");
    const row = await findUser(ctx.db, request.params.id);
    if (!row) throw errors.notFound();
    return serializeUser(row);
  });

  app.post("/users", adminView, async (request, reply) => {
    ctx.assertGrant(request, "admin:add");
    const input = parseBody(createUserSchema, request.body);
    const actor = ctx.requireUser(request);

    const duplicate = await ctx.db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, input.email.toLowerCase()))
      .limit(1);
    if (duplicate.length > 0) throw errors.conflict("That email is already in use.");

    let grants = input.grants ?? [];
    if (input.roleId) {
      const role = await findRole(ctx, input.roleId);
      if (!role) throw errors.invalid("Select a valid role.");
      if (!input.grants) grants = parseGrants(role.grants);
    }

    const id = newId();
    await ctx.db.insert(users).values({
      id,
      email: input.email.toLowerCase(),
      username: input.username,
      fullName: input.fullName,
      passwordHash: hashPassword(input.password),
      roleId: input.roleId ?? null,
      status: input.status ?? "active",
      grants: JSON.stringify(grants),
    });
    await ctx.audit({
      actorId: actor.id,
      event: "USER_CREATE",
      entityType: "user",
      entityId: id,
    });
    const row = await findUser(ctx.db, id);
    if (!row) throw errors.notFound();
    reply.code(201);
    return serializeUser(row);
  });

  app.patch<{ Params: { id: string } }>("/users/:id", adminView, async (request) => {
    ctx.assertGrant(request, "admin:edit");
    const actor = ctx.requireUser(request);
    const input = parseBody(updateUserSchema, request.body);
    const existing = await findUser(ctx.db, request.params.id);
    if (!existing) throw errors.notFound();

    if (actor.id === existing.id) {
      const currentGrants = parseGrants(existing.grants);
      if (input.grants && JSON.stringify([...input.grants].sort()) !== JSON.stringify(currentGrants.sort())) {
        throw errors.forbidden();
      }
      if (input.status && input.status !== "active") {
        throw errors.forbidden();
      }
    }

    if (input.status === "inactive" || input.status === "pending") {
      const isAdmin = parseGrants(existing.grants).includes("admin:view");
      if (isAdmin && existing.status === "active") {
        const count = await countActiveAdministrators(ctx.db);
        if (count <= 1) throw errors.conflict("The last active administrator cannot be deactivated.");
      }
    }

    let grants: string | undefined;
    if (input.grants) grants = JSON.stringify(input.grants);
    if (input.roleId && !input.grants) {
      const role = await findRole(ctx, input.roleId);
      if (!role) throw errors.invalid("Select a valid role.");
      grants = role.grants;
    }

    const [result] = await ctx.db
      .update(users)
      .set({
        fullName: input.fullName ?? existing.fullName,
        roleId: input.roleId !== undefined ? input.roleId : existing.roleId,
        grants: grants ?? existing.grants,
        status: input.status ?? existing.status,
        template: input.template ?? existing.template,
        version: existing.version + 1,
      })
      .where(and(eq(users.id, existing.id), eq(users.version, input.version)));

    if (!result.affectedRows) throw errors.conflict();

    await ctx.audit({
      actorId: actor.id,
      event: "USER_UPDATE",
      entityType: "user",
      entityId: existing.id,
    });
    const row = await findUser(ctx.db, existing.id);
    if (!row) throw errors.notFound();
    return serializeUser(row);
  });

  app.post<{ Params: { id: string } }>("/users/:id/approve", adminView, async (request) => {
    ctx.assertGrant(request, "admin:edit");
    const actor = ctx.requireUser(request);
    const input = parseBody(approveUserSchema, request.body ?? {});
    const existing = await findUser(ctx.db, request.params.id);
    if (!existing) throw errors.notFound();
    if (existing.status === "active") throw errors.conflict("That account is already active.");

    let grants = input.grants ?? [];
    if (input.roleId) {
      const role = await findRole(ctx, input.roleId);
      if (!role) throw errors.invalid("Select a valid role.");
      if (!input.grants) grants = parseGrants(role.grants);
    }

    await ctx.db
      .update(users)
      .set({
        status: "active",
        roleId: input.roleId !== undefined ? input.roleId : existing.roleId,
        grants: JSON.stringify(grants),
        version: existing.version + 1,
      })
      .where(eq(users.id, existing.id));

    await ctx.audit({
      actorId: actor.id,
      event: "AUTH_APPROVE",
      entityType: "user",
      entityId: existing.id,
    });
    const row = await findUser(ctx.db, existing.id);
    if (!row) throw errors.notFound();
    return serializeUser(row);
  });

  app.post<{ Params: { id: string } }>("/users/:id/reject", adminView, async (request) => {
    ctx.assertGrant(request, "admin:edit");
    const actor = ctx.requireUser(request);
    const existing = await findUser(ctx.db, request.params.id);
    if (!existing) throw errors.notFound();
    await ctx.db
      .update(users)
      .set({ status: "inactive", version: existing.version + 1 })
      .where(eq(users.id, existing.id));
    await ctx.audit({
      actorId: actor.id,
      event: "AUTH_APPROVE",
      entityType: "user",
      entityId: existing.id,
      detail: "rejected",
    });
    const row = await findUser(ctx.db, existing.id);
    if (!row) throw errors.notFound();
    return serializeUser(row);
  });

  const setStatus = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    status: "active" | "inactive",
  ) => {
    ctx.assertGrant(request, "admin:delete");
    const actor = ctx.requireUser(request);
    const existing = await findUser(ctx.db, request.params.id);
    if (!existing) throw errors.notFound();
    if (status === "inactive" && parseGrants(existing.grants).includes("admin:view")) {
      const count = await countActiveAdministrators(ctx.db);
      if (existing.status === "active" && count <= 1) {
        throw errors.conflict("The last active administrator cannot be deactivated.");
      }
    }
    await ctx.db
      .update(users)
      .set({ status, version: existing.version + 1 })
      .where(eq(users.id, existing.id));
    await ctx.audit({
      actorId: actor.id,
      event: "USER_UPDATE",
      entityType: "user",
      entityId: existing.id,
      detail: status,
    });
    const row = await findUser(ctx.db, existing.id);
    if (!row) throw errors.notFound();
    return serializeUser(row);
  };

  app.post<{ Params: { id: string } }>("/users/:id/deactivate", adminView, (request) =>
    setStatus(request, "inactive"),
  );
  app.post<{ Params: { id: string } }>("/users/:id/reactivate", adminView, (request) =>
    setStatus(request, "active"),
  );

  app.get("/roles", adminView, async (request) => {
    ctx.assertGrant(request, "admin:view");
    return { items: await listRoles(ctx.db) };
  });

  app.post("/roles", adminView, async (request, reply) => {
    ctx.assertGrant(request, "admin:add");
    const actor = ctx.requireUser(request);
    const input = parseBody(roleSchema, request.body);
    const duplicate = await ctx.db
      .select({ id: roles.id })
      .from(roles)
      .where(eq(roles.name, input.name))
      .limit(1);
    if (duplicate.length > 0) throw errors.conflict("A role with that name already exists.");
    const id = newId();
    await ctx.db.insert(roles).values({
      id,
      name: input.name,
      description: input.description ?? "",
      grants: JSON.stringify(input.grants),
      isSystem: false,
    });
    await ctx.audit({
      actorId: actor.id,
      event: "USER_CREATE",
      entityType: "role",
      entityId: id,
    });
    const rows = await ctx.db.select().from(roles).where(eq(roles.id, id)).limit(1);
    const row = rows[0];
    if (!row) throw errors.notFound();
    reply.code(201);
    return serializeRole(row);
  });

  app.patch<{ Params: { id: string } }>("/roles/:id", adminView, async (request) => {
    ctx.assertGrant(request, "admin:edit");
    const actor = ctx.requireUser(request);
    const input = parseBody(updateRoleSchema, request.body);
    const rows = await ctx.db.select().from(roles).where(eq(roles.id, request.params.id)).limit(1);
    const existing = rows[0];
    if (!existing) throw errors.notFound();
    if (existing.isSystem && input.name) throw errors.forbidden();

    const grants = input.grants ? JSON.stringify(input.grants) : existing.grants;
    const [result] = await ctx.db
      .update(roles)
      .set({
        name: input.name ?? existing.name,
        description: input.description ?? existing.description,
        grants,
        version: existing.version + 1,
      })
      .where(and(eq(roles.id, existing.id), eq(roles.version, input.version)));
    if (!result.affectedRows) throw errors.conflict();

    if (input.applyToAssigned && input.grants) {
      await ctx.db
        .update(users)
        .set({ grants, version: sql`${users.version} + 1` })
        .where(eq(users.roleId, existing.id));
    }

    await ctx.audit({
      actorId: actor.id,
      event: "USER_UPDATE",
      entityType: "role",
      entityId: existing.id,
    });
    const updated = await ctx.db.select().from(roles).where(eq(roles.id, existing.id)).limit(1);
    const row = updated[0];
    if (!row) throw errors.notFound();
    return serializeRole(row);
  });

  app.delete<{ Params: { id: string } }>("/roles/:id", adminView, async (request) => {
    ctx.assertGrant(request, "admin:delete");
    const actor = ctx.requireUser(request);
    const rows = await ctx.db.select().from(roles).where(eq(roles.id, request.params.id)).limit(1);
    const existing = rows[0];
    if (!existing) throw errors.notFound();
    if (existing.isSystem) throw errors.forbidden();
    const assigned = await ctx.db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.roleId, existing.id))
      .limit(1);
    if (assigned.length > 0) throw errors.conflict("Reassign users before deleting this role.");
    await ctx.db.delete(roles).where(eq(roles.id, existing.id));
    await ctx.audit({
      actorId: actor.id,
      event: "USER_DELETE",
      entityType: "role",
      entityId: existing.id,
    });
    return { ok: true };
  });

  app.get("/users/export", adminView, async (request, reply) => {
    ctx.assertGrant(request, "admin:export");
    const actor = ctx.requireUser(request);
    const result = await queryUsers(ctx.db, { pageSize: 100 });
    await ctx.audit({
      actorId: actor.id,
      event: "USER_EXPORT",
      entityType: "user",
    });
    const header = "username,full_name,status\n";
    const body = result.items
      .map((user) => `${user.username},"${user.fullName.replaceAll('"', '""')}",${user.status}`)
      .join("\n");
    reply.header("content-type", "text/csv; charset=utf-8");
    reply.header("content-disposition", "attachment; filename=users.csv");
    return `${header}${body}`;
  });
}
