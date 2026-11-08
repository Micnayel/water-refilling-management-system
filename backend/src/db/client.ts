import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import { env } from "../config/env";
import * as schema from "./schema";

export type Database = ReturnType<typeof createDatabase>;

export function createDatabase(overrides?: Partial<typeof env.db>) {
  const config = { ...env.db, ...overrides };
  const pool = mysql.createPool({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: config.database,
    waitForConnections: true,
    connectionLimit: 10,
    timezone: "+08:00",
    dateStrings: true,
  });
  return drizzle(pool, { schema, mode: "default" });
}

export { schema };
