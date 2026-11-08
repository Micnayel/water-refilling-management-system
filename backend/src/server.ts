import Fastify, { type FastifyInstance } from "fastify";
import cookie from "@fastify/cookie";
import { createContext } from "./context";
import { env } from "./config/env";
import { createDatabase, type Database } from "./db/client";
import { createSessionStore, type SessionStore } from "./lib/sessions";
import { ApiError } from "./lib/errors";
import { registerAuthRoutes } from "./modules/auth/routes";
import { registerDashboardRoutes } from "./modules/dashboard/routes";
import { registerHeatMapRoutes } from "./modules/heat-map/routes";
import { registerInventoryRoutes } from "./modules/inventory/routes";
import { registerCustomerRoutes } from "./modules/customers/routes";
import { registerSchedulingRoutes } from "./modules/scheduling/routes";
import { registerUserRoutes } from "./modules/users/routes";
import { registerSettingsRoutes } from "./modules/settings/routes";
import { registerReportRoutes } from "./modules/reports/routes";
import { registerAuditRoutes } from "./modules/audit/routes";
import { registerNotificationRoutes } from "./modules/notifications/routes";

export interface ServerOptions {
  db?: Database;
  sessions?: SessionStore;
  logger?: boolean;
}

export async function buildServer(options: ServerOptions = {}): Promise<FastifyInstance> {
  const app = Fastify({
    logger: options.logger ?? false,
    bodyLimit: 256 * 1024,
  });

  await app.register(cookie);

  const db = options.db ?? createDatabase();
  const sessions = options.sessions ?? createSessionStore(env.redis.sessionUrl);
  const ctx = createContext(db, sessions);

  app.setErrorHandler((error, request, reply) => {
    if (error instanceof ApiError) {
      reply.code(error.statusCode).send({
        error: { code: error.code, message: error.message },
      });
      return;
    }
    if (
      typeof error === "object" &&
      error !== null &&
      "statusCode" in error &&
      (error as { statusCode?: number }).statusCode === 400
    ) {
      reply.code(400).send({ error: { code: "invalid_request", message: "The request was not valid." } });
      return;
    }
    request.log.error({ err: error }, "unhandled_request_error");
    reply.code(500).send({
      error: { code: "server_error", message: "Something went wrong. Try again." },
    });
  });

  app.get("/health/live", async () => ({ status: "ok" }));
  app.get("/health/ready", async (_request, reply) => {
    try {
      await db.execute("select 1");
      return { status: "ready", revision: process.env.WRMS_REVISION ?? "dev" };
    } catch {
      reply.code(503);
      return { status: "unavailable" };
    }
  });

  await app.register(
    async (api) => {
      await registerAuthRoutes(api, ctx);
      await registerDashboardRoutes(api, ctx);
      await registerHeatMapRoutes(api, ctx);
      await registerInventoryRoutes(api, ctx);
      await registerCustomerRoutes(api, ctx);
      await registerSchedulingRoutes(api, ctx);
      await registerUserRoutes(api, ctx);
      await registerSettingsRoutes(api, ctx);
      await registerReportRoutes(api, ctx);
      await registerAuditRoutes(api, ctx);
      await registerNotificationRoutes(api, ctx);
    },
    { prefix: "/api/v1" },
  );

  app.setNotFoundHandler((_request, reply) => {
    reply.code(404).send({ error: { code: "not_found", message: "The requested resource was not found." } });
  });

  return app;
}
