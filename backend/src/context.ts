import type { FastifyReply, FastifyRequest } from "fastify";
import { eq } from "drizzle-orm";
import { env } from "./config/env";
import type { Database } from "./db/client";
import { auditEvents, notifications, users } from "./db/schema";
import { ApiError, errors } from "./lib/errors";
import { newId } from "./lib/crypto";
import { parseGrants } from "./lib/grants";
import type { SessionData, SessionStore } from "./lib/sessions";
import type { AuthUser } from "./types";

export interface AuditInput {
  actorId: string | null;
  event: string;
  entityType: string;
  entityId?: string | null;
  detail?: string;
}

export interface AppContext {
  db: Database;
  sessions: SessionStore;
  config: typeof env;
  audit(input: AuditInput): Promise<void>;
  authenticate(request: FastifyRequest, reply: FastifyReply): Promise<void>;
  requireSession(request: FastifyRequest): SessionData;
  requireUser(request: FastifyRequest): AuthUser;
  assertGrant(request: FastifyRequest, grant: string): void;
  assertAnyGrant(request: FastifyRequest, grants: string[]): void;
}

export function toAuthUser(row: typeof users.$inferSelect): AuthUser {
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    fullName: row.fullName,
    roleId: row.roleId ?? null,
    status: row.status,
    grants: parseGrants(row.grants),
    template: row.template,
  };
}

export async function loadUserById(db: Database, id: string): Promise<AuthUser | null> {
  const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
  const row = rows[0];
  return row ? toAuthUser(row) : null;
}

const ENTITY_LABELS: Record<string, string> = {
  user: "user",
  role: "role",
  customer: "customer",
  inventory: "inventory item",
  inventory_item: "inventory item",
  schedule: "order",
  sale: "sale",
  subscription: "subscription",
  setting: "setting",
  notification: "notification",
};

const VERB_MAP: Record<string, string> = {
  create: "created",
  update: "updated",
  delete: "deleted",
  export: "exported",
  approve: "approved",
  reject: "rejected",
  reveal: "revealed",
  access: "accessed",
  read: "read",
};

// Explicit, non-sensitive phrasing for events that do not follow PREFIX_VERB.
const EVENT_OVERRIDES: Record<string, string> = {
  AUTH_LOGIN: "User signed in",
  AUTH_LOGOUT: "User signed out",
  AUTH_LOGIN_FAILED: "Failed sign-in attempt",
  AUTH_REGISTER: "Registration submitted",
  SETTINGS_UPDATE: "Setting updated",
};

export function notificationKind(event: string): string {
  const prefix = event.split("_")[0] ?? "info";
  return prefix.toLowerCase().slice(0, 32) || "info";
}

export function notificationMessage(event: string, entityType: string, detail?: string): string {
  const label = ENTITY_LABELS[entityType] ?? entityType.replaceAll("_", " ");
  const suffix = detail && detail.trim() ? ` (${detail.trim()})` : "";
  const override = EVENT_OVERRIDES[event];
  if (override) return `${override}${suffix}`.slice(0, 255);
  const words = event.toLowerCase().split("_");
  const verbWord = words[words.length - 1] ?? "";
  const action = event === "ACCESS" ? "accessed" : (VERB_MAP[verbWord] ?? verbWord);
  const heading = `${label} ${action}`;
  return `${heading.charAt(0).toUpperCase() + heading.slice(1)}${suffix}`.slice(0, 255);
}

export function createContext(db: Database, sessions: SessionStore): AppContext {
  const audit: AppContext["audit"] = async (input) => {
    await db.insert(auditEvents).values({
      id: newId(),
      actorId: input.actorId,
      event: input.event,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      detail: input.detail ?? "",
    });
    // Every audited transaction also surfaces as a non-sensitive notification.
    // Notification delivery is best-effort and never blocks the audited action.
    try {
      await db.insert(notifications).values({
        id: newId(),
        userId: null,
        kind: notificationKind(input.event),
        message: notificationMessage(input.event, input.entityType, input.detail),
      });
    } catch {
      // Notifications must not break the underlying transaction.
    }
  };

  const authenticate: AppContext["authenticate"] = async (request) => {
    request.authUser = null;
    request.sessionData = null;
    request.sessionToken = null;

    const token = request.cookies[env.sessionCookieName];
    if (!token) return;

    const session = await sessions.get(token);
    if (!session) return;

    const user = await loadUserById(db, session.userId);
    if (!user || user.status !== "active") {
      await sessions.destroy(token);
      return;
    }

    if (
      request.method !== "GET" &&
      request.method !== "HEAD" &&
      request.method !== "OPTIONS"
    ) {
      const header = request.headers["x-csrf-token"];
      const provided = Array.isArray(header) ? header[0] : header;
      if (!provided || provided !== session.csrf) {
        throw new ApiError(403, "csrf_failed", "Refresh the page and try again.");
      }
    }

    request.authUser = user;
    request.sessionData = session;
    request.sessionToken = token;
  };

  const requireSession = (request: FastifyRequest): SessionData => {
    if (!request.sessionData) throw errors.unauthenticated();
    return request.sessionData;
  };

  const requireUser = (request: FastifyRequest): AuthUser => {
    if (!request.authUser) throw errors.unauthenticated();
    return request.authUser;
  };

  const assertGrant = (request: FastifyRequest, grant: string): void => {
    const user = requireUser(request);
    if (!user.grants.includes(grant)) throw errors.forbidden();
  };

  const assertAnyGrant = (request: FastifyRequest, grants: string[]): void => {
    const user = requireUser(request);
    if (!grants.some((grant) => user.grants.includes(grant))) throw errors.forbidden();
  };

  return {
    db,
    sessions,
    config: env,
    audit,
    authenticate,
    requireSession,
    requireUser,
    assertGrant,
    assertAnyGrant,
  };
}
