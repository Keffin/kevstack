import { fileURLToPath } from "node:url";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import type { Database } from "./client.ts";

const migrationsFolder = fileURLToPath(new URL("../migrations", import.meta.url));

/**
 * Applies all pending SQL migrations. Used by integration tests and deploy scripts.
 */
export async function runMigrations(db: Database): Promise<void> {
  await migrate(db, { migrationsFolder });
}
