import type { FastifyInstance } from "fastify";
import { eq, or } from "drizzle-orm";
import type { AppContext } from "../../context";
import { toAuthUser } from "../../context";
import { env } from "../../config/env";
import { users } from "../../db/schema";
import { hashPassword, newId, randomToken, verifyPassword } from "../../lib/crypto";
import { ApiError, errors, parseBody } from "../../lib/errors";
import { clientKey, rateLimit, verifyTurnstile } from "./service";
import { loginSchema, registerSchema } from "./schemas";

const DUMMY_HASH = hashPassword("not-a-real-password-value");

function sessionCookieOptions() {
  return {
    path: "/",
    httpOnly: true,
    sameSite: "lax" as const,
    secure: env.isProduction,
    maxAge: env.sessionTtlMinutes * 60,
  };
}

export async function registerAuthRoutes(app: FastifyInstance, ctx: AppContext): Promise<void> {
  app.get("/auth/turnstile", async () => ({ siteKey: env.turnstile.siteKey }));

  app.get(
    "/auth/session",
    { preHandler: [ctx.authenticate] },
    async (request) => {
      if (!request.authUser || !request.sessionData) throw errors.unauthenticated();
      return { user: request.authUser, csrfToken: request.sessionData.csrf };
    },
  );

  app.get(
    "/auth/csrf",
    { preHandler: [ctx.authenticate] },
    async (request) => {
      if (!request.sessionData) throw errors.unauthenticated();
      return { csrfToken: request.sessionData.csrf };
    },
  );

  app.post("/auth/register", async (request, reply) => {
    if (!rateLimit(clientKey(request.ip, "register"), 5, 15 * 60 * 1000)) {
      throw errors.invalid("Too many attempts. Try again later.");
    }
    const input = parseBody(registerSchema, request.body);
    const turnstileOk = await verifyTurnstile(input.turnstileToken, request.ip);
    if (!turnstileOk) throw errors.invalid("Complete the verification challenge.");

    const existing = await ctx.db
      .select({ id: users.id })
      .from(users)
      .where(or(eq(users.email, input.email.toLowerCase()), eq(users.username, input.username)))
      .limit(1);

    if (existing.length === 0) {
      const id = newId();
      await ctx.db.insert(users).values({
        id,
        email: input.email.toLowerCase(),
        username: input.username,
        fullName: input.fullName,
        passwordHash: hashPassword(input.password),
        status: "pending",
        grants: "[]",
      });
      await ctx.audit({
        actorId: null,
        event: "AUTH_REGISTER",
        entityType: "user",
        entityId: id,
      });
    }

    reply.code(201);
    return {
      message: "Registration received. An administrator will review your account.",
    };
  });

  app.post("/auth/login", async (request, reply) => {
    if (!rateLimit(clientKey(request.ip, "login"), 10, 15 * 60 * 1000)) {
      throw errors.invalid("Too many attempts. Try again later.");
    }
    const input = parseBody(loginSchema, request.body);
    const turnstileOk = await verifyTurnstile(input.turnstileToken, request.ip);
    if (!turnstileOk) throw errors.invalid("Complete the verification challenge.");

    const identifier = input.identifier.toLowerCase();
    const rows = await ctx.db
      .select()
      .from(users)
      .where(or(eq(users.email, identifier), eq(users.username, input.identifier)))
      .limit(1);
    const row = rows[0];
    const passwordOk = verifyPassword(input.password, row?.passwordHash ?? DUMMY_HASH);

    if (!row || !passwordOk || row.status !== "active") {
      await ctx.audit({
        actorId: row?.id ?? null,
        event: "AUTH_LOGIN_FAILED",
        entityType: "user",
        entityId: row?.id ?? null,
      });
      throw new ApiError(
        401,
        "invalid_credentials",
        "The username or password is incorrect.",
      );
    }

    const token = randomToken();
    const csrf = randomToken(24);
    await ctx.sessions.create(
      token,
      { userId: row.id, csrf },
      env.sessionTtlMinutes * 60,
    );
    reply.setCookie(env.sessionCookieName, token, sessionCookieOptions());
    await ctx.audit({
      actorId: row.id,
      event: "AUTH_LOGIN",
      entityType: "user",
      entityId: row.id,
    });
    return { user: toAuthUser(row), csrfToken: csrf };
  });

  app.post(
    "/auth/logout",
    { preHandler: [ctx.authenticate] },
    async (request, reply) => {
      if (request.sessionToken) await ctx.sessions.destroy(request.sessionToken);
      if (request.authUser) {
        await ctx.audit({
          actorId: request.authUser.id,
          event: "AUTH_LOGOUT",
          entityType: "user",
          entityId: request.authUser.id,
        });
      }
      reply.clearCookie(env.sessionCookieName, { path: "/" });
      return { ok: true };
    },
  );
}
