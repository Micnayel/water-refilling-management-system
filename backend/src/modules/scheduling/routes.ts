import type { FastifyInstance } from "fastify";
import { and, eq } from "drizzle-orm";
import type { AppContext } from "../../context";
import { customers, schedules, users } from "../../db/schema";
import { newId } from "../../lib/crypto";
import { errors, parseBody } from "../../lib/errors";
import {
  createScheduleSchema,
  querySchedulesSchema,
  scheduleStatusSchema,
  updateScheduleSchema,
} from "./schemas";
import { completeSchedule, findSchedule, querySchedules } from "./service";

const TRANSITIONS: Record<string, string[]> = {
  Scheduled: ["Out for delivery", "Completed", "Cancelled"],
  "Out for delivery": ["Completed", "Cancelled"],
  Completed: [],
  Cancelled: [],
};

export async function registerSchedulingRoutes(app: FastifyInstance, ctx: AppContext): Promise<void> {
  const hooks = { preHandler: [ctx.authenticate] };

  app.post("/schedules/query", hooks, async (request) => {
    ctx.assertGrant(request, "scheduling:view");
    const input = parseBody(querySchedulesSchema, request.body ?? {});
    return querySchedules(ctx.db, input);
  });

  app.get("/schedules/assignees", hooks, async (request) => {
    ctx.assertGrant(request, "scheduling:view");
    const rows = await ctx.db
      .select({ id: users.id, fullName: users.fullName })
      .from(users)
      .where(eq(users.status, "active"))
      .orderBy(users.fullName);
    return { items: rows };
  });

  app.get<{ Params: { id: string } }>("/schedules/:id", hooks, async (request) => {
    ctx.assertGrant(request, "scheduling:view");
    const row = await findSchedule(ctx.db, request.params.id);
    if (!row) throw errors.notFound();
    return row;
  });

  app.post("/schedules", hooks, async (request, reply) => {
    ctx.assertGrant(request, "scheduling:add");
    const actor = ctx.requireUser(request);
    const input = parseBody(createScheduleSchema, request.body);

    const customerRows = await ctx.db
      .select({ id: customers.id })
      .from(customers)
      .where(and(eq(customers.id, input.customerId), eq(customers.status, "active")))
      .limit(1);
    if (customerRows.length === 0) throw errors.invalid("Select an active customer.");

    const assigneeRows = await ctx.db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.id, input.assignedUserId), eq(users.status, "active")))
      .limit(1);
    if (assigneeRows.length === 0) throw errors.invalid("Select an active staff member.");

    const id = newId();
    await ctx.db.insert(schedules).values({
      id,
      customerId: input.customerId,
      assignedUserId: input.assignedUserId,
      type: input.type,
      recurrence: input.recurrence,
      scheduledDate: input.scheduledDate,
      scheduledTime: input.scheduledTime,
      gallons: input.gallons,
      amountCentavos: input.amountCentavos,
      notes: input.notes,
      status: "Scheduled",
    });
    await ctx.audit({
      actorId: actor.id,
      event: "SCHEDULE_CREATE",
      entityType: "schedule",
      entityId: id,
    });
    const row = await findSchedule(ctx.db, id);
    if (!row) throw errors.notFound();
    reply.code(201);
    return row;
  });

  app.patch<{ Params: { id: string } }>("/schedules/:id", hooks, async (request) => {
    ctx.assertGrant(request, "scheduling:edit");
    const actor = ctx.requireUser(request);
    const input = parseBody(updateScheduleSchema, request.body);
    const existing = await findSchedule(ctx.db, request.params.id);
    if (!existing) throw errors.notFound();
    if (existing.status === "Completed" || existing.status === "Cancelled") {
      throw errors.conflict("Completed or cancelled schedules cannot be edited.");
    }

    const [result] = await ctx.db
      .update(schedules)
      .set({
        customerId: input.customerId ?? existing.customerId,
        assignedUserId: input.assignedUserId ?? existing.assignedUserId,
        type: input.type ?? existing.type,
        recurrence: input.recurrence ?? existing.recurrence,
        scheduledDate: input.scheduledDate ?? existing.scheduledDate,
        scheduledTime: input.scheduledTime ?? existing.scheduledTime,
        gallons: input.gallons ?? existing.gallons,
        amountCentavos: input.amountCentavos ?? existing.amountCentavos,
        notes: input.notes ?? existing.notes,
        version: existing.version + 1,
      })
      .where(and(eq(schedules.id, existing.id), eq(schedules.version, input.version)));
    if (!result.affectedRows) throw errors.conflict();

    await ctx.audit({
      actorId: actor.id,
      event: "SCHEDULE_UPDATE",
      entityType: "schedule",
      entityId: existing.id,
    });
    const row = await findSchedule(ctx.db, existing.id);
    if (!row) throw errors.notFound();
    return row;
  });

  app.post<{ Params: { id: string } }>("/schedules/:id/status", hooks, async (request) => {
    ctx.assertGrant(request, "scheduling:edit");
    const actor = ctx.requireUser(request);
    const input = parseBody(scheduleStatusSchema, request.body);
    const existing = await findSchedule(ctx.db, request.params.id);
    if (!existing) throw errors.notFound();

    if (input.status === existing.status) throw errors.conflict("That is already the current status.");
    const allowed = TRANSITIONS[existing.status] ?? [];
    if (!allowed.includes(input.status)) {
      throw errors.conflict(`Cannot move a ${existing.status} schedule to ${input.status}.`);
    }

    if (input.status === "Completed") {
      const completed = await completeSchedule(ctx.db, {
        scheduleId: existing.id,
        actorId: actor.id,
        itemId: input.itemId,
      });
      await ctx.audit({
        actorId: actor.id,
        event: "SCHEDULE_UPDATE",
        entityType: "schedule",
        entityId: existing.id,
        detail: "Completed",
      });
      return completed;
    }

    const [result] = await ctx.db
      .update(schedules)
      .set({ status: input.status, version: existing.version + 1 })
      .where(and(eq(schedules.id, existing.id), eq(schedules.version, input.version)));
    if (!result.affectedRows) throw errors.conflict();

    await ctx.audit({
      actorId: actor.id,
      event: "SCHEDULE_UPDATE",
      entityType: "schedule",
      entityId: existing.id,
      detail: input.status,
    });
    const row = await findSchedule(ctx.db, existing.id);
    if (!row) throw errors.notFound();
    return row;
  });

  app.get("/schedules/export", hooks, async (request, reply) => {
    ctx.assertGrant(request, "scheduling:export");
    const actor = ctx.requireUser(request);
    const page = await querySchedules(ctx.db, { pageSize: 100 });
    await ctx.audit({
      actorId: actor.id,
      event: "SCHEDULE_EXPORT",
      entityType: "schedule",
    });
    const header = "date,time,type,recurrence,status,gallons,amount_centavos\n";
    const body = page.items
      .map(
        (schedule) =>
          `${schedule.scheduledDate},${schedule.scheduledTime},${schedule.type},${schedule.recurrence},${schedule.status},${schedule.gallons},${schedule.amountCentavos}`,
      )
      .join("\n");
    reply.header("content-type", "text/csv; charset=utf-8");
    reply.header("content-disposition", "attachment; filename=schedules.csv");
    return `${header}${body}`;
  });
}
