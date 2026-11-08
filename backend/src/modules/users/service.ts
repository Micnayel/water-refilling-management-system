import { and, desc, eq, like, or, sql } from "drizzle-orm";
import type { Database } from "../../db/client";
import { roles, users } from "../../db/schema";
import { parseGrants } from "../../lib/grants";
import { buildPage, decodeCursor, type Page } from "../../lib/pagination";

export interface PublicUser {
  id: string;
  username: string;
  email: string;
  fullName: string;
  roleId: string | null;
  status: string;
  grants: string[];
  template: string;
  version: number;
  createdAt: string | null;
}

export function serializeUser(row: typeof users.$inferSelect): PublicUser {
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    fullName: row.fullName,
    roleId: row.roleId ?? null,
    status: row.status,
    grants: parseGrants(row.grants),
    template: row.template,
    version: row.version,
    createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : null,
  };
}

export interface QueryUsersInput {
  cursor?: string;
  pageSize?: number;
  search?: string;
  status?: "active" | "pending" | "inactive";
}

export async function queryUsers(
  db: Database,
  input: QueryUsersInput,
): Promise<Page<PublicUser>> {
  const offset = decodeCursor(input.cursor);
  const pageSize = input.pageSize ?? 20;
  const filters = [];
  if (input.status) filters.push(eq(users.status, input.status));
  if (input.search) {
    const term = `%${input.search.replaceAll("%", "")}%`;
    filters.push(or(like(users.fullName, term), like(users.email, term), like(users.username, term)));
  }

  const rows = await db
    .select()
    .from(users)
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(desc(users.createdAt))
    .limit(pageSize + 1)
    .offset(offset);

  return buildPage(rows.map(serializeUser), offset, pageSize);
}

export async function countActiveAdministrators(db: Database): Promise<number> {
  const rows = await db
    .select({ grants: users.grants })
    .from(users)
    .where(eq(users.status, "active"));
  return rows.filter((row) => parseGrants(row.grants).includes("admin:view")).length;
}

export interface PublicRole {
  id: string;
  name: string;
  description: string;
  grants: string[];
  isSystem: boolean;
  version: number;
}

export function serializeRole(row: typeof roles.$inferSelect): PublicRole {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    grants: parseGrants(row.grants),
    isSystem: row.isSystem,
    version: row.version,
  };
}

export async function listRoles(db: Database): Promise<PublicRole[]> {
  const rows = await db.select().from(roles).orderBy(roles.name);
  return rows.map(serializeRole);
}

export async function findUser(db: Database, id: string) {
  const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function countUsers(db: Database): Promise<number> {
  const rows = await db.select({ value: sql<number>`count(*)` }).from(users);
  return Number(rows[0]?.value ?? 0);
}
