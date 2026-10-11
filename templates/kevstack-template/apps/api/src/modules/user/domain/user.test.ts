import { describe, expect, it } from "vitest";
import { InvalidValueError } from "../../../shared/domain-error.ts";
import { User } from "./user.ts";

const createUser = () =>
  User.create({ name: "Ada Lovelace", username: "ada", email: "ada@example.com" });

describe("User", () => {
  it("creates an unverified user with a generated id", () => {
    // Act
    const user = createUser();

    // Assert
    expect(user.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(user.emailVerified).toBe(false);
    expect(user.createdAt).toEqual(user.updatedAt);
  });

  it("normalises fields on creation", () => {
    // Act
    const user = User.create({ name: "Ada", username: " ADA ", email: "Ada@Example.com" });

    // Assert
    expect(user.username).toBe("ada");
    expect(user.email).toBe("ada@example.com");
  });

  it("rejects an invalid username on creation", () => {
    // Act & Assert
    expect(() => User.create({ name: "Ada", username: "!!", email: "ada@example.com" })).toThrow(
      InvalidValueError,
    );
  });

  it("returns an updated copy when the username changes", () => {
    // Arrange
    const user = createUser();
    const later = new Date(user.updatedAt.getTime() + 1000);

    // Act
    const updated = user.changeUsername("Countess", later);

    // Assert
    expect(updated.username).toBe("countess");
    expect(updated.updatedAt).toEqual(later);
    expect(updated.id).toBe(user.id);
    expect(user.username).toBe("ada");
  });

  it("returns the same instance when the username is unchanged", () => {
    // Arrange
    const user = createUser();

    // Act
    const updated = user.changeUsername("ADA");

    // Assert
    expect(updated).toBe(user);
  });
});
