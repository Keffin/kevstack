import { describe, expect, it } from "vitest";
import { generateSecret, renderEnv } from "../src/env.ts";

describe("renderEnv", () => {
  it("replaces listed secrets and keeps everything else", () => {
    // Arrange
    const example = "# comment\nDATABASE_URL=postgres://x\nAUTH_SECRET=change-me\n";

    // Act
    const env = renderEnv(example, ["AUTH_SECRET"], () => "generated");

    // Assert
    expect(env).toBe("# comment\nDATABASE_URL=postgres://x\nAUTH_SECRET=generated\n");
  });

  it("appends secrets missing from the example", () => {
    // Act
    const env = renderEnv("PORT=4000", ["AUTH_SECRET"], () => "generated");

    // Assert
    expect(env).toBe("PORT=4000\nAUTH_SECRET=generated");
  });

  it("ignores commented-out keys", () => {
    // Act
    const env = renderEnv("# AUTH_SECRET=old", ["AUTH_SECRET"], () => "generated");

    // Assert
    expect(env).toBe("# AUTH_SECRET=old\nAUTH_SECRET=generated");
  });
});

describe("generateSecret", () => {
  it("returns a long, unique, URL-safe value", () => {
    // Act
    const first = generateSecret();
    const second = generateSecret();

    // Assert
    expect(first).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(first).not.toBe(second);
  });
});
