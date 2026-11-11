import { and, desc, eq, like, or } from "drizzle-orm";
import type { Database } from "../../db/client";
import { customers } from "../../db/schema";
import { buildPage, decodeCursor, type Page } from "../../lib/pagination";
import type { QueryCustomersInput } from "./schemas";

export interface MaskedCustomer {
  id: string;
  code: string;
  name: string;
  contact: string;
  email: string;
  address: string;
  barangay: string;
  latitude: null;
  longitude: null;
  gallonsOnHand: number;
  status: string;
  version: number;
  createdAt: string | null;
  masked: boolean;
}

export interface RevealedCustomer extends Omit<MaskedCustomer, "masked" | "latitude" | "longitude"> {
  latitude: number | null;
  longitude: number | null;
  masked: false;
}

export function maskName(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${"*".repeat(Math.max(2, part.length - 1))}`)
    .join(" ");
}

export function maskContact(contact: string): string {
  if (!contact) return "";
  const digits = contact.replace(/\D/g, "");
  if (digits.length < 4) return "••••";
  return `••• ••• ${digits.slice(-2)}`;
}

export function maskEmail(email: string): string {
  if (!email) return "";
  const [local] = email.split("@");
  return `${local?.charAt(0) ?? "•"}***@***`;
}

export function maskCustomer(row: typeof customers.$inferSelect): MaskedCustomer {
  return {
    id: row.id,
    code: row.code,
    name: maskName(row.name),
    contact: maskContact(row.contact),
    email: maskEmail(row.email),
    address: row.barangay ? `Barangay ${row.barangay}` : "Address hidden",
    barangay: row.barangay,
    latitude: null,
    longitude: null,
    gallonsOnHand: row.gallonsOnHand,
    status: row.status,
    version: row.version,
    createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : null,
    masked: true,
  };
}

export function revealCustomer(row: typeof customers.$inferSelect): RevealedCustomer {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    contact: row.contact,
    email: row.email,
    address: row.address,
    barangay: row.barangay,
    latitude: row.latitude === null ? null : Number(row.latitude),
    longitude: row.longitude === null ? null : Number(row.longitude),
    gallonsOnHand: row.gallonsOnHand,
    status: row.status,
    version: row.version,
    createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : null,
    masked: false,
  };
}

export async function findCustomer(db: Database, id: string) {
  const rows = await db.select().from(customers).where(eq(customers.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function queryCustomers(
  db: Database,
  input: QueryCustomersInput,
): Promise<Page<MaskedCustomer>> {
  const offset = decodeCursor(input.cursor);
  const pageSize = input.pageSize ?? 20;
  const filters = [];
  if (input.status) filters.push(eq(customers.status, input.status));
  if (input.barangay) filters.push(eq(customers.barangay, input.barangay));
  if (input.search) {
    const term = `%${input.search.replaceAll("%", "")}%`;
    filters.push(
      or(
        like(customers.name, term),
        like(customers.code, term),
        like(customers.barangay, term),
      ),
    );
  }
  const rows = await db
    .select()
    .from(customers)
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(desc(customers.createdAt))
    .limit(pageSize + 1)
    .offset(offset);
  return buildPage(rows.map(maskCustomer), offset, pageSize);
}

export function nextCustomerCode(sequence: number): string {
  return `CUS-${String(sequence).padStart(6, "0")}`;
}
