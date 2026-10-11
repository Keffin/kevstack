import { createDatabase, type DatabaseConnection, schema } from "@repo/db";
import { getTableName, sql } from "drizzle-orm";
import { inject } from "vitest";

export function connectTestDatabase(): DatabaseConnection {
  return createDatabase(inject("databaseUrl"));
}

/** Wipes every table so each test starts from a clean slate. */
export async function truncateAll({ db }: DatabaseConnection): Promise<void> {
  const tables = [schema.verification, schema.session, schema.account, schema.user]
    .map((table) => `"${getTableName(table)}"`)
    .join(", ");
  await db.execute(sql.raw(`TRUNCATE ${tables} CASCADE`));
}
