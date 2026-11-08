import type { IncomingMessage, ServerResponse } from "node:http";

/**
 * Vercel serverless entrypoint.
 *
 * Vercel routes every `/api/*` request here, and the same Fastify app that runs
 * locally handles it. The compiled backend is imported at runtime so this
 * function stays a thin adapter. `bodyParser` is disabled because Fastify reads
 * the raw request stream itself.
 */
export const config = {
  api: {
    bodyParser: false,
  },
};

interface InjectedApp {
  ready(): Promise<unknown>;
  routing(req: IncomingMessage, res: ServerResponse): void;
}

type BackendModule = {
  buildServer(options: { logger: boolean }): Promise<InjectedApp>;
};

let appPromise: Promise<InjectedApp> | null = null;

async function getApp(): Promise<InjectedApp> {
  if (!appPromise) {
    const backend = (await import("../backend/dist/server.js")) as unknown as BackendModule;
    appPromise = backend.buildServer({ logger: true });
  }
  return appPromise;
}

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const app = await getApp();
  await app.ready();
  app.routing(req, res);
}
