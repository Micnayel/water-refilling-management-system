import { and, desc, eq, like, sql } from "drizzle-orm";
import type { Database } from "../../db/client";
import { customers, subscriptions, users } from "../../db/schema";
import { buildPage, decodeCursor, type Page } from "../../lib/pagination";
import { maskName } from "../customers/service";

export interface PublicSubscription {
  id: string;
  customerId: string;
  customerCode: string;
  customerName: string;
  planName: string;
  status: string;
  gallonsPerDelivery: number;
  frequency: string;
  priceCentavos: number;
  startDate: string;
  nextBillingDate: string | null;
  assignedUserId: string | null;
  assignedUserName: string;
  notes: string;
  version: number;
  createdAt: string | null;
}

type SubscriptionRow = typeof subscriptions.$inferSelect;

function serialize(
  row: SubscriptionRow,
  customer?: { code: string; name: string } | null,
  assigned?: { fullName: string } | null,
): PublicSubscription {
  return {
    id: row.id,
    customerId: row.customerId,
    customerCode: customer?.code ?? "",
    customerName: customer ? maskName(customer.name) : "Customer",
    planName: row.planName,
    status: row.status,
    gallonsPerDelivery: row.gallonsPerDelivery,
    frequency: row.frequency,
    priceCentavos: row.priceCentavos,
    startDate: row.startDate,
    nextBillingDate: row.nextBillingDate ?? null,
    assignedUserId: row.assignedUserId ?? null,
    assignedUserName: assigned?.fullName ?? "Unassigned",
    notes: row.notes,
    version: row.version,
    createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : null,
  };
}

export async function findSubscription(db: Database, id: string): Promise<PublicSubscription | null> {
  const rows = await db
    .select({ subscription: subscriptions, customer: customers, assigned: users })
    .from(subscriptions)
    .leftJoin(customers, eq(subscriptions.customerId, customers.id))
    .leftJoin(users, eq(subscriptions.assignedUserId, users.id))
    .where(eq(subscriptions.id, id))
    .limit(1);
  const row = rows[0];
  if (!row) return null;
  return serialize(row.subscription, row.customer, row.assigned);
}

export async function querySubscriptions(
  db: Database,
  input: { cursor?: string; pageSize?: number; status?: string; search?: string; customerId?: string },
): Promise<Page<PublicSubscription>> {
  const offset = decodeCursor(input.cursor);
  const pageSize = input.pageSize ?? 20;
  const filters = [];
  if (input.status) filters.push(eq(subscriptions.status, input.status));
  if (input.customerId) filters.push(eq(subscriptions.customerId, input.customerId));
  if (input.search) filters.push(like(customers.name, `%${input.search}%`));

  const rows = await db
    .select({ subscription: subscriptions, customer: customers, assigned: users })
    .from(subscriptions)
    .leftJoin(customers, eq(subscriptions.customerId, customers.id))
    .leftJoin(users, eq(subscriptions.assignedUserId, users.id))
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(desc(subscriptions.createdAt))
    .limit(pageSize + 1)
    .offset(offset);

  return buildPage(
    rows.map((row) => serialize(row.subscription, row.customer, row.assigned)),
    offset,
    pageSize,
  );
}

export async function countActiveSubscriptions(db: Database): Promise<number> {
  const rows = await db
    .select({ value: sql<number>`count(*)` })
    .from(subscriptions)
    .where(eq(subscriptions.status, "Active"));
  return Number(rows[0]?.value ?? 0);
}
