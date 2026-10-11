import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryUserRepository } from "../../../../test/fakes/in-memory-user.repository.ts";
import { aUser } from "../../../../test/fakes/users.ts";
import { UserNotFoundError } from "../domain/index.ts";
import { GetCurrentUser } from "./get-current-user.ts";

describe("GetCurrentUser", () => {
  let repository: InMemoryUserRepository;
  let getCurrentUser: GetCurrentUser;

  beforeEach(() => {
    repository = new InMemoryUserRepository();
    getCurrentUser = new GetCurrentUser(repository);
  });

  it("returns the user", async () => {
    // Arrange
    const user = aUser("ada");
    await repository.save(user);

    // Act
    const found = await getCurrentUser.execute(user.id);

    // Assert
    expect(found).toBe(user);
  });

  it("throws when the user does not exist", async () => {
    // Act
    const result = getCurrentUser.execute("missing");

    // Assert
    await expect(result).rejects.toThrow(UserNotFoundError);
  });
});
