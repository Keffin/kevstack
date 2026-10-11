import type { DatabaseConnection } from "@repo/db";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { UsernameTakenError } from "../../src/modules/user/domain/index.ts";
import { DrizzleUserRepository } from "../../src/modules/user/user.repository.drizzle.ts";
import { aUser } from "../fakes/users.ts";
import { connectTestDatabase, truncateAll } from "../helpers/test-database.ts";

describe("DrizzleUserRepository", () => {
  let connection: DatabaseConnection;
  let repository: DrizzleUserRepository;

  beforeAll(() => {
    connection = connectTestDatabase();
    repository = new DrizzleUserRepository(connection.db);
  });

  beforeEach(() => truncateAll(connection));

  afterAll(() => connection.close());

  it("round-trips a user", async () => {
    // Arrange
    const user = aUser("ada");

    // Act
    await repository.save(user);
    const found = await repository.findById(user.id);

    // Assert
    expect(found?.id).toBe(user.id);
    expect(found?.username).toBe("ada");
    expect(found?.email).toBe("ada@example.com");
  });

  it("finds a user by username", async () => {
    // Arrange
    const user = aUser("ada");
    await repository.save(user);

    // Act
    const found = await repository.findByUsername("ada");

    // Assert
    expect(found?.id).toBe(user.id);
  });

  it("returns null when nothing matches", async () => {
    // Act
    const found = await repository.findById("missing");

    // Assert
    expect(found).toBeNull();
  });

  it("updates an existing user on save", async () => {
    // Arrange
    const user = aUser("ada");
    await repository.save(user);
    const updated = user.changeUsername("countess");

    // Act
    await repository.save(updated);

    // Assert
    const found = await repository.findById(user.id);
    expect(found?.username).toBe("countess");
  });

  it("maps the unique constraint to a domain error", async () => {
    // Arrange
    await repository.save(aUser("ada"));
    const grace = aUser("grace");
    await repository.save(grace);
    const conflicting = grace.changeUsername("ada");

    // Act
    const result = repository.save(conflicting);

    // Assert
    await expect(result).rejects.toThrow(UsernameTakenError);
  });
});
