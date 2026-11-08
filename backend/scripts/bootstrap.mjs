import { existsSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { randomBytes, randomUUID, scryptSync } from "node:crypto";
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

const ALL_GRANTS = [
  "dashboard:view",
  "dashboard:export",
  "heatmap:view",
  "heatmap:export",
  "inventory:view",
  "inventory:add",
  "inventory:edit",
  "inventory:delete",
  "inventory:export",
  "customers:view",
  "customers:add",
  "customers:edit",
  "customers:delete",
  "customers:export",
  "customers:reveal",
  "scheduling:view",
  "scheduling:add",
  "scheduling:edit",
  "scheduling:delete",
  "scheduling:export",
  "admin:view",
  "admin:add",
  "admin:edit",
  "admin:delete",
  "admin:export",
  "reports:view",
  "reports:export",
  "audit:view",
  "notifications:view",
  "settings:view",
  "settings:edit",
];

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${derived}`;
}

const email = process.env.WRMS_BOOTSTRAP_EMAIL;
const username = process.env.WRMS_BOOTSTRAP_USERNAME;
const password = process.env.WRMS_BOOTSTRAP_PASSWORD;
const fullName = process.env.WRMS_BOOTSTRAP_FULL_NAME ?? "System Administrator";

if (!email || !username || !password) {
  console.error(
    "Set WRMS_BOOTSTRAP_EMAIL, WRMS_BOOTSTRAP_USERNAME, and WRMS_BOOTSTRAP_PASSWORD before running the bootstrap.",
  );
  process.exit(1);
}
if (password.length < 12) {
  console.error("WRMS_BOOTSTRAP_PASSWORD must be at least 12 characters.");
  process.exit(1);
}

async function main() {
  const connection = await mysql.createConnection({
    host: process.env.WRMS_DB_HOST ?? "127.0.0.1",
    port: Number(process.env.WRMS_DB_PORT ?? 3306),
    user: process.env.WRMS_DB_USER ?? "root",
    password: process.env.WRMS_DB_PASSWORD ?? "",
    database: process.env.WRMS_DB_NAME ?? "wrms",
    ssl:
      (process.env.WRMS_DB_SSL ?? "").toLowerCase() === "true"
        ? { minVersion: "TLSv1.2" }
        : undefined,
  });

  const [existing] = await connection.query(
    "SELECT id FROM users WHERE email = ? OR username = ? LIMIT 1",
    [email.toLowerCase(), username],
  );
  if (existing.length > 0) {
    console.log("An account with that email or username already exists. Bootstrap skipped.");
    await connection.end();
    return;
  }

  const [roleRows] = await connection.query("SELECT id FROM roles WHERE name = 'Administrator' LIMIT 1");
  let roleId = roleRows[0]?.id;
  if (!roleId) {
    roleId = randomUUID();
    await connection.query(
      "INSERT INTO roles (id, name, description, grants, is_system) VALUES (?, ?, ?, ?, TRUE)",
      [roleId, "Administrator", "Full access to every module.", JSON.stringify(ALL_GRANTS)],
    );
  }

  await connection.query(
    "INSERT INTO users (id, username, email, password_hash, full_name, role_id, status, grants) VALUES (?, ?, ?, ?, ?, ?, 'active', ?)",
    [
      randomUUID(),
      username,
      email.toLowerCase(),
      hashPassword(password),
      fullName,
      roleId,
      JSON.stringify(ALL_GRANTS),
    ],
  );

  await connection.end();
  console.log("Administrator account created. Sign in and change the password policy as needed.");
}

main().catch((error) => {
  console.error("Bootstrap failed:", error.message);
  process.exit(1);
});
