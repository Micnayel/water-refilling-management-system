import { defineConfig } from "drizzle-kit";

const host = process.env.WRMS_DB_HOST ?? "127.0.0.1";
const port = Number(process.env.WRMS_DB_PORT ?? 3306);
const user = process.env.WRMS_DB_USER ?? "root";
const password = process.env.WRMS_DB_PASSWORD ?? "";
const database = process.env.WRMS_DB_NAME ?? "wrms";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "mysql",
  dbCredentials: {
    host,
    port,
    user,
    password,
    database,
  },
});
