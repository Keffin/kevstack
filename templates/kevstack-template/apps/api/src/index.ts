import { createDatabase } from "@repo/db";
import { createApp } from "./app.ts";
import { loadEnv } from "./env.ts";
import { createContainer } from "./container.ts";

const env = loadEnv();
const database = createDatabase(env.DATABASE_URL);
const container = createContainer({ db: database.db, env });
const app = createApp({ container, env });

const server = app.listen(env.PORT, () => {
  console.info(`API listening on http://localhost:${env.PORT}`);
});

function shutdown(signal: NodeJS.Signals): void {
  console.info(`${signal} received, shutting down`);
  server.close(() => {
    void database.close().then(() => process.exit(0));
  });
}

process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);
