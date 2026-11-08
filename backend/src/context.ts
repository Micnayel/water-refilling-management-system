import type { FastifyReply, FastifyRequest } from "fastify";
import { eq } from "drizzle-orm";
import { env } from "./config/env";
import type { Database } from "./db/client";
import { auditEvents, users } from "./db/schema";
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

  return {
    db,
    sessions,
    config: env,
    audit,
    authenticate,
    requireSession,
    requireUser,
    assertGrant,
  };
}
