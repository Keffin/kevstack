import { createDatabase, runMigrations } from "@repo/db";
import { PostgreSqlContainer } from "@testcontainers/postgresql";
import type { TestProject } from "vitest/node";

declare module "vitest" {
  export interface ProvidedContext {
    databaseUrl: string;
  }
}

/** Starts one throwaway Postgres for the whole integration run and applies migrations. */
export default async function setup(project: TestProject) {
  const container = await new PostgreSqlContainer("postgres:17-alpine").start();
  const databaseUrl = container.getConnectionUri();

  const { db, close } = createDatabase(databaseUrl);
  await runMigrations(db);
  await close();

  project.provide("databaseUrl", databaseUrl);

  return async () => {
    await container.stop();
  };
}
