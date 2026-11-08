import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadLocalEnv(): void {
  const file = resolve(__dirname, "../../.env");
  if (!existsSync(file)) return;
  for (const rawLine of readFileSync(file, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

loadLocalEnv();

function bool(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  return value.toLowerCase() === "true" || value === "1";
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.WRMS_API_PORT ?? process.env.PORT ?? 8080),
  host: process.env.WRMS_API_HOST ?? "127.0.0.1",
  sessionTtlMinutes: Number(process.env.WRMS_SESSION_TIMEOUT_MINUTES ?? 60),
  sessionCookieName: "wrms_session",
  db: {
    host: process.env.WRMS_DB_HOST ?? "127.0.0.1",
    port: Number(process.env.WRMS_DB_PORT ?? 3306),
    user: process.env.WRMS_DB_USER ?? "root",
    password: process.env.WRMS_DB_PASSWORD ?? "",
    database: process.env.WRMS_DB_NAME ?? "wrms",
  },
  redis: {
    sessionUrl: process.env.WRMS_REDIS_SESSION_URL ?? "",
    cacheUrl: process.env.WRMS_REDIS_CACHE_URL ?? "",
  },
  turnstile: {
    siteKey: process.env.WRMS_TURNSTILE_SITE_KEY ?? "1x00000000000000000000AA",
    secretKey: process.env.WRMS_TURNSTILE_SECRET_KEY ?? "1x0000000000000000000000000000000AA",
    localTestMode: bool(process.env.TURNSTILE_LOCAL_TEST_MODE, true),
  },
  google: {
    geocodeKey: process.env.WRMS_GOOGLE_GEOCODE_KEY ?? "",
  },
  isProduction: (process.env.NODE_ENV ?? "development") === "production",
} as const;
