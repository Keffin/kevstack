import { describe, expect, it } from "vitest";
import { MAX_NAME_LENGTH, ProjectName, slugify, validateProjectName } from "../src/project-name.ts";

describe("ProjectName", () => {
  it.each([
    ["daniels-project", "daniels-project", "daniels_project"],
    ["Daniels Project", "daniels-project", "daniels_project"],
    ["  my__app!! ", "my-app", "my_app"],
    ["app2", "app2", "app2"],
  ])("parses %j", (raw, kebab, snake) => {
    // Act
    const name = ProjectName.parse(raw);

    // Assert
    expect(name.kebab).toBe(kebab);
    expect(name.snake).toBe(snake);
  });

  it.each(["", "!!!", "1app", "a".repeat(MAX_NAME_LENGTH + 1)])("rejects %j", (raw) => {
    // Act & Assert
    expect(() => ProjectName.parse(raw)).toThrow(/Invalid project name/);
  });
});

describe("validateProjectName", () => {
  it("accepts input that slugifies to a valid name", () => {
    // Act
    const error = validateProjectName("Daniels Project");

    // Assert
    expect(error).toBeUndefined();
  });

  it("explains why a name is invalid", () => {
    // Act
    const error = validateProjectName("1app");

    // Assert
    expect(error).toMatch(/starting with a letter/);
  });
});

describe("slugify", () => {
  it("collapses separators and trims hyphens", () => {
    // Act
    const slug = slugify("--Hello,  World--");

    // Assert
    expect(slug).toBe("hello-world");
  });
});
