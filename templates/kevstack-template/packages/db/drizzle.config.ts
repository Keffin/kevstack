import { defineConfig } from "drizzle-kit";

try {
  process.loadEnvFile(new URL("../../.env", import.meta.url));
} catch {
  // No .env file: rely on the environment (e.g. CI).
}

const databaseUrl = process.env["DATABASE_URL"];
if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set");
}

export default defineConfig({
  out: "./migrations",
  schema: "./src/schema/index.ts",
  dialect: "postgresql",
  casing: "snake_case",
  dbCredentials: { url: databaseUrl },
});
