import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { createDatabase, type DatabaseConnection } from "@repo/db";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createApp } from "../../src/app.ts";
import { createContainer } from "../../src/container.ts";
import { connectTestDatabase } from "../helpers/test-database.ts";
import { createTestEnv } from "../helpers/test-env.ts";

describe("Health endpoints", () => {
  let connection: DatabaseConnection | undefined;
  let server: Server | undefined;

  /** Boots the app on a random port against the given database connection. */
  const startApp = async (db: DatabaseConnection) => {
    connection = db;
    const env = createTestEnv("unused");
    const app = createApp({ container: createContainer({ db: db.db, env }), env });
    server = app.listen(0);
    await new Promise<void>((resolve) => server?.once("listening", resolve));
    return `http://localhost:${(server.address() as AddressInfo).port}`;
  };

  afterEach(async () => {
    vi.restoreAllMocks();
    await new Promise((resolve) => server?.close(resolve));
    await connection?.close().catch(() => undefined);
  });

  it("reports liveness without touching dependencies", async () => {
    // Arrange
    const baseUrl = await startApp(connectTestDatabase());

    // Act
    const response = await fetch(`${baseUrl}/health`);

    // Assert
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "up" });
  });

  it("is ready when the database is reachable", async () => {
    // Arrange
    const baseUrl = await startApp(connectTestDatabase());

    // Act
    const response = await fetch(`${baseUrl}/health/ready`);

    // Assert
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      status: "up",
      checks: { database: { status: "up" } },
    });
  });

  it("is not ready when the database is unreachable", async () => {
    // Arrange
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const unreachable = createDatabase("postgres://postgres:postgres@localhost:1/nope");
    const baseUrl = await startApp(unreachable);

    // Act
    const response = await fetch(`${baseUrl}/health/ready`);

    // Assert
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({
      status: "down",
      checks: { database: { status: "down" } },
    });
  });
});
