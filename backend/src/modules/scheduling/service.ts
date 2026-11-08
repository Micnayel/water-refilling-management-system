import { and, desc, eq, sql } from "drizzle-orm";
import type { Database } from "../../db/client";
import { customers, inventoryItems, sales, schedules, users } from "../../db/schema";
import { newId } from "../../lib/crypto";
import { errors } from "../../lib/errors";
import { buildPage, decodeCursor, type Page } from "../../lib/pagination";
import { maskName } from "../customers/service";
import { applyMovement, firstItem, type Executor } from "../inventory/service";

export interface PublicSchedule {
  id: string;
  customerId: string;
  customerCode: string;
  customerName: string;
  assignedUserId: string;
  assignedUserName: string;
  type: string;
  recurrence: string;
  scheduledDate: string;
  scheduledTime: string;
  status: string;
  gallons: number;
  amountCentavos: number;
  notes: string;
  version: number;
  completedAt: string | null;
  createdAt: string | null;
}

type ScheduleRow = typeof schedules.$inferSelect;

function serialize(
  row: ScheduleRow,
  customer?: { code: string; name: string } | null,
  assigned?: { fullName: string } | null,
): PublicSchedule {
  return {
    id: row.id,
    customerId: row.customerId,
    customerCode: customer?.code ?? "",
    customerName: customer ? maskName(customer.name) : "Customer",
    assignedUserId: row.assignedUserId,
    assignedUserName: assigned?.fullName ?? "Unassigned",
    type: row.type,
    recurrence: row.recurrence,
    scheduledDate: row.scheduledDate,
    scheduledTime: row.scheduledTime,
    status: row.status,
    gallons: row.gallons,
    amountCentavos: row.amountCentavos,
    notes: row.notes,
    version: row.version,
    completedAt: row.completedAt ? new Date(row.completedAt).toISOString() : null,
    createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : null,
  };
}

export async function findSchedule(db: Executor, id: string): Promise<PublicSchedule | null> {
  const rows = await db
    .select({ schedule: schedules, customer: customers, assigned: users })
    .from(schedules)
    .leftJoin(customers, eq(schedules.customerId, customers.id))
    .leftJoin(users, eq(schedules.assignedUserId, users.id))
    .where(eq(schedules.id, id))
    .limit(1);
  const row = rows[0];
  if (!row) return null;
  return serialize(row.schedule, row.customer, row.assigned);
}

export async function querySchedules(
  db: Database,
  input: { cursor?: string; pageSize?: number; status?: string; date?: string },
): Promise<Page<PublicSchedule>> {
  const offset = decodeCursor(input.cursor);
  const pageSize = input.pageSize ?? 20;
  const filters = [];
  if (input.status) filters.push(eq(schedules.status, input.status));
  if (input.date) filters.push(eq(schedules.scheduledDate, input.date));

  const rows = await db
    .select({ schedule: schedules, customer: customers, assigned: users })
    .from(schedules)
    .leftJoin(customers, eq(schedules.customerId, customers.id))
    .leftJoin(users, eq(schedules.assignedUserId, users.id))
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(desc(schedules.scheduledDate), desc(schedules.createdAt))
    .limit(pageSize + 1)
    .offset(offset);

  return buildPage(
    rows.map((row) => serialize(row.schedule, row.customer, row.assigned)),
    offset,
    pageSize,
  );
}

export interface CompleteScheduleInput {
  scheduleId: string;
  actorId: string;
  itemId?: string;
}

export async function completeSchedule(
  db: Database,
  input: CompleteScheduleInput,
): Promise<PublicSchedule> {
  return db.transaction(async (tx) => {
    const rows = await tx
      .select()
      .from(schedules)
      .where(eq(schedules.id, input.scheduleId))
      .for("update")
      .limit(1);
    const schedule = rows[0];
    if (!schedule) throw errors.notFound();
    if (schedule.status === "Completed") throw errors.conflict("That schedule is already complete.");
    if (schedule.status === "Cancelled") throw errors.conflict("That schedule is cancelled.");

    const existingSale = await tx
      .select({ id: sales.id })
      .from(sales)
      .where(eq(sales.scheduleId, schedule.id))
      .limit(1);
    if (existingSale.length > 0) throw errors.conflict("That schedule is already complete.");

    const item = input.itemId
      ? (
          await tx
            .select()
            .from(inventoryItems)
            .where(eq(inventoryItems.id, input.itemId))
            .limit(1)
        )[0]
      : await firstItem(tx);

    if (!item) throw errors.conflict("Add an inventory item before completing schedules.");

    if (item.gallonsFull < schedule.gallons) {
      throw errors.conflict("Not enough full gallons in stock to complete this schedule.");
    }

    await applyMovement(tx, {
      itemId: item.id,
      type: "deliver",
      quantity: schedule.gallons,
      reason: "Schedule completion",
      actorId: input.actorId,
      scheduleId: schedule.id,
    });

    await tx
      .update(customers)
      .set({
        gallonsOnHand: sql`${customers.gallonsOnHand} + ${schedule.gallons}`,
        version: sql`${customers.version} + 1`,
      })
      .where(eq(customers.id, schedule.customerId));

    await tx.insert(sales).values({
      id: newId(),
      scheduleId: schedule.id,
      customerId: schedule.customerId,
      amountCentavos: schedule.amountCentavos,
      gallons: schedule.gallons,
    });

    await tx
      .update(schedules)
      .set({
        status: "Completed",
        completedAt: new Date(),
        version: schedule.version + 1,
      })
      .where(eq(schedules.id, schedule.id));

    const updated = await findSchedule(tx, schedule.id);
    if (!updated) throw errors.notFound();
    return updated;
  });
}
