import { describe, expect, it } from "vitest";
import { InvalidValueError } from "../../../shared/domain-error.ts";
import { parseEmail, parseUsername } from "./rules.ts";

describe("parseUsername", () => {
  it("normalises to trimmed lowercase", () => {
    // Arrange
    const raw = "  Ada_99 ";

    // Act
    const username = parseUsername(raw);

    // Assert
    expect(username).toBe("ada_99");
  });

  it.each(["ab", "has space", "a".repeat(31), "émile", 42])("rejects %j", (raw) => {
    // Act & Assert
    expect(() => parseUsername(raw)).toThrow(InvalidValueError);
  });
});

describe("parseEmail", () => {
  it("normalises to trimmed lowercase", () => {
    // Arrange
    const raw = " Ada@Example.COM ";

    // Act
    const email = parseEmail(raw);

    // Assert
    expect(email).toBe("ada@example.com");
  });

  it("rejects malformed emails", () => {
    // Act & Assert
    expect(() => parseEmail("not-an-email")).toThrow(InvalidValueError);
  });
});
