import { describe, expect, it } from "vitest";
import { toOriginalPath, toPackagedPath } from "../src/dotfiles.ts";

describe("dotfile mapping", () => {
  it.each([
    [".gitignore", "_gitignore"],
    ["apps/web/.gitignore", "apps/web/_gitignore"],
    [".npmrc", "_npmrc"],
  ])("round-trips %j", (original, packaged) => {
    // Act
    const stored = toPackagedPath(original);
    const restored = toOriginalPath(stored);

    // Assert
    expect(stored).toBe(packaged);
    expect(restored).toBe(original);
  });

  it("leaves other files alone", () => {
    // Act
    const path = toPackagedPath("apps/.env.example");

    // Assert
    expect(path).toBe("apps/.env.example");
  });
});
