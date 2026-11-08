import { existsSync, readdirSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import mysql from "mysql2/promise";

const here = dirname(fileURLToPath(import.meta.url));
const backendDir = resolve(here, "..");

function loadEnv() {
  const file = resolve(backendDir, ".env");
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

loadEnv();

const config = {
  host: process.env.WRMS_DB_HOST ?? "127.0.0.1",
  port: Number(process.env.WRMS_DB_PORT ?? 3306),
  user: process.env.WRMS_DB_USER ?? "root",
  password: process.env.WRMS_DB_PASSWORD ?? "",
  database: process.env.WRMS_DB_NAME ?? "wrms",
};

if (!/^[A-Za-z0-9_]+$/.test(config.database)) {
  console.error("WRMS_DB_NAME must contain only letters, numbers, and underscores.");
  process.exit(1);
}

async function main() {
  const server = await mysql.createConnection({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    multipleStatements: true,
  });
  await server.query(
    `CREATE DATABASE IF NOT EXISTS \`${config.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
  );
  await server.end();

  const connection = await mysql.createConnection({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: config.database,
    multipleStatements: true,
  });

  await connection.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name VARCHAR(160) NOT NULL PRIMARY KEY,
      applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  const migrationsDir = resolve(backendDir, "drizzle");
  const files = readdirSync(migrationsDir)
    .filter((file) => file.endsWith(".sql"))
    .sort();

  const [appliedRows] = await connection.query("SELECT name FROM schema_migrations");
  const applied = new Set(appliedRows.map((row) => row.name));

  let count = 0;
  for (const file of files) {
    if (applied.has(file)) continue;
    const sql = readFileSync(resolve(migrationsDir, file), "utf8");
    await connection.query(sql);
    await connection.query("INSERT INTO schema_migrations (name) VALUES (?)", [file]);
    console.log(`Applied migration ${file}`);
    count += 1;
  }

  await connection.end();
  console.log(
    count === 0
      ? "Database is up to date. No pending migrations."
      : `Database ready. Applied ${count} migration(s).`,
  );
  console.log("Next: run the one-time administrator bootstrap described in BACKEND.md.");
}

main().catch((error) => {
  console.error("Database setup failed:", error.message);
  process.exit(1);
});
