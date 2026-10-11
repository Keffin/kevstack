import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema/index.ts";

export type Database = NodePgDatabase<typeof schema>;

export interface DatabaseConnection {
  db: Database;
  close: () => Promise<void>;
}

/**
 * Creates a Drizzle client backed by a pg connection pool.
 * The caller owns the connection and must call `close()` on shutdown.
 */
export function createDatabase(connectionString: string): DatabaseConnection {
  const pool = new Pool({ connectionString });
  const db = drizzle({ client: pool, schema, casing: "snake_case" });

  return {
    db,
    close: () => pool.end(),
  };
}
