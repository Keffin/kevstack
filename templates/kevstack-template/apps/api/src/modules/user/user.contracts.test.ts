import { emailSchema, usernameSchema } from "@repo/contracts";
import { describe, expect, it } from "vitest";
import { parseEmail, parseUsername } from "./domain/index.ts";

/**
 * The domain is dependency-free, so its rules are duplicated in the Zod contracts the web app
 * uses for form validation. This guards against the two drifting apart.
 */
const accepts = (parse: (raw: unknown) => unknown, raw: unknown) => {
  try {
    parse(raw);
    return true;
  } catch {
    return false;
  }
};

describe("domain rules agree with @repo/contracts", () => {
  it.each(["ada", "Ada_99", " a.b.c ", "ab", "has space", "a".repeat(30), "a".repeat(31), "émile"])(
    "username %j",
    (raw) => {
      // Act
      const domain = accepts(parseUsername, raw);
      const contract = usernameSchema.safeParse(raw).success;

      // Assert
      expect(domain).toBe(contract);
    },
  );

  it.each(["ada@example.com", " ADA@Example.com ", "not-an-email", "a@b", "@example.com"])(
    "email %j",
    (raw) => {
      // Act
      const domain = accepts(parseEmail, raw);
      const contract = emailSchema.safeParse(raw).success;

      // Assert
      expect(domain).toBe(contract);
    },
  );
});
