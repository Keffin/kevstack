import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import type { DatabaseConnection } from "@repo/db";
import { createTRPCClient, httpLink, TRPCClientError } from "@trpc/client";
import superjson from "superjson";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../../src/app.ts";
import { createContainer } from "../../src/container.ts";
import type { AppRouter } from "../../src/trpc/router.ts";
import { connectTestDatabase, truncateAll } from "../helpers/test-database.ts";
import { createTestEnv } from "../helpers/test-env.ts";

describe("API (HTTP)", () => {
  const env = createTestEnv("unused");
  let connection: DatabaseConnection;
  let server: Server;
  let baseUrl: string;

  const trpcClient = (cookie?: string) =>
    createTRPCClient<AppRouter>({
      links: [
        httpLink({
          url: `${baseUrl}/api/trpc`,
          transformer: superjson,
          headers: cookie ? { cookie } : {},
        }),
      ],
    });

  /** Signs up through Better Auth and returns the session cookie. */
  const signUp = async (body: Record<string, string>) => {
    const response = await fetch(`${baseUrl}/api/auth/sign-up/email`, {
      method: "POST",
      headers: { "content-type": "application/json", origin: env.CLIENT_URL },
      body: JSON.stringify(body),
    });
    const cookie = response.headers
      .getSetCookie()
      .map((c) => c.split(";")[0])
      .join("; ");
    return { response, cookie };
  };

  const validSignUp = {
    name: "Ada Lovelace",
    username: "Ada",
    email: "ada@example.com",
    password: "correct horse battery",
  };

  beforeAll(async () => {
    connection = connectTestDatabase();
    const container = createContainer({ db: connection.db, env });
    const app = createApp({ container, env });
    server = app.listen(0);
    await new Promise<void>((resolve) => server.once("listening", resolve));
    baseUrl = `http://localhost:${(server.address() as AddressInfo).port}`;
  });

  beforeEach(() => truncateAll(connection));

  afterAll(async () => {
    await new Promise((resolve) => server.close(resolve));
    await connection.close();
  });

  it("greets anonymously", async () => {
    // Act
    const greeting = await trpcClient().hello.greet.query({ name: "Kev" });

    // Assert
    expect(greeting).toEqual({ message: "Hello, Kev!" });
  });

  it("rejects user.me without a session", async () => {
    // Act
    const error = await trpcClient()
      .user.me.query()
      .catch((e: unknown) => e);

    // Assert
    expect(error).toBeInstanceOf(TRPCClientError);
    expect((error as TRPCClientError<AppRouter>).data?.code).toBe("UNAUTHORIZED");
  });

  it("signs up and returns the current user", async () => {
    // Arrange
    const { response, cookie } = await signUp(validSignUp);

    // Act
    const me = await trpcClient(cookie).user.me.query();

    // Assert
    expect(response.status).toBe(200);
    expect(me).toMatchObject({
      name: "Ada Lovelace",
      username: "ada",
      email: "ada@example.com",
      emailVerified: false,
    });
    expect(me.createdAt).toBeInstanceOf(Date);
  });

  it("enforces domain rules on sign up", async () => {
    // Arrange
    const invalid = { ...validSignUp, username: "x" };

    // Act
    const { response } = await signUp(invalid);

    // Assert
    expect(response.status).toBe(400);
  });

  it("changes the username", async () => {
    // Arrange
    const { cookie } = await signUp(validSignUp);

    // Act
    const user = await trpcClient(cookie).user.changeUsername.mutate({ username: "countess" });

    // Assert
    expect(user.username).toBe("countess");
  });

  it("reports a conflict when the username is taken", async () => {
    // Arrange
    await signUp({ ...validSignUp, username: "grace", email: "grace@example.com" });
    const { cookie } = await signUp(validSignUp);

    // Act
    const error = await trpcClient(cookie)
      .user.changeUsername.mutate({ username: "grace" })
      .catch((e: unknown) => e);

    // Assert
    expect((error as TRPCClientError<AppRouter>).data?.code).toBe("CONFLICT");
  });
});
