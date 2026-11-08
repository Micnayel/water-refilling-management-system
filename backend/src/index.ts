import { buildServer } from "./server";
import { env } from "./config/env";

async function main(): Promise<void> {
  const app = await buildServer({ logger: true });
  try {
    await app.listen({ host: env.host, port: env.port });
  } catch (error) {
    app.log.error(error);
    process.exitCode = 1;
  }
}

void main();
