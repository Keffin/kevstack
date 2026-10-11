import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryUserRepository } from "../../../../test/fakes/in-memory-user.repository.ts";
import { aUser } from "../../../../test/fakes/users.ts";
import { InvalidValueError } from "../../../shared/domain-error.ts";
import { UsernameTakenError, UserNotFoundError } from "../domain/index.ts";
import { ChangeUsername } from "./change-username.ts";

describe("ChangeUsername", () => {
  let repository: InMemoryUserRepository;
  let changeUsername: ChangeUsername;

  beforeEach(() => {
    repository = new InMemoryUserRepository();
    changeUsername = new ChangeUsername(repository);
  });

  it("persists the new username", async () => {
    // Arrange
    const user = aUser("ada");
    await repository.save(user);

    // Act
    await changeUsername.execute(user.id, "countess");

    // Assert
    const stored = await repository.findById(user.id);
    expect(stored?.username).toBe("countess");
  });

  it("rejects a username owned by someone else", async () => {
    // Arrange
    const ada = aUser("ada");
    await repository.save(ada);
    await repository.save(aUser("grace"));

    // Act
    const result = changeUsername.execute(ada.id, "Grace");

    // Assert
    await expect(result).rejects.toThrow(UsernameTakenError);
  });

  it("rejects an invalid username", async () => {
    // Arrange
    const user = aUser("ada");
    await repository.save(user);

    // Act
    const result = changeUsername.execute(user.id, "!!");

    // Assert
    await expect(result).rejects.toThrow(InvalidValueError);
  });

  it("throws when the user does not exist", async () => {
    // Act
    const result = changeUsername.execute("missing", "countess");

    // Assert
    await expect(result).rejects.toThrow(UserNotFoundError);
  });
});
