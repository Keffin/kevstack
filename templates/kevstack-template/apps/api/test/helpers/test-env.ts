import type { Env } from "../../src/env.ts";

export function createTestEnv(databaseUrl: string): Env {
  return {
    NODE_ENV: "test",
    PORT: 0,
    DATABASE_URL: databaseUrl,
    CLIENT_URL: "http://localhost:5173",
    BETTER_AUTH_URL: "http://localhost:4000",
    BETTER_AUTH_SECRET: "test-secret-that-is-at-least-32-characters-long",
  };
}
