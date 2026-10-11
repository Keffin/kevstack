import { apiSignUpRequestSchema } from "@repo/contracts";
import { describe, expect, it } from "vitest";
import { parseForm } from "./forms.ts";

function formWith(values: Record<string, string>): HTMLFormElement {
  const form = document.createElement("form");
  for (const [name, value] of Object.entries(values)) {
    const input = document.createElement("input");
    input.name = name;
    input.value = value;
    form.append(input);
  }
  return form;
}

describe("parseForm", () => {
  it("returns parsed (normalised) data for a valid form", () => {
    // Arrange
    const form = formWith({
      name: "Ada",
      username: "Ada",
      email: "ADA@example.com",
      password: "long enough",
    });

    // Act
    const result = parseForm(apiSignUpRequestSchema, form);

    // Assert
    expect(result).toEqual({
      success: true,
      data: { name: "Ada", username: "ada", email: "ada@example.com", password: "long enough" },
    });
  });

  it("returns the first error per field", () => {
    // Arrange
    const form = formWith({ name: "", username: "x", email: "nope", password: "short" });

    // Act
    const result = parseForm(apiSignUpRequestSchema, form);

    // Assert
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(Object.keys(result.fieldErrors).toSorted()).toEqual([
      "email",
      "name",
      "password",
      "username",
    ]);
  });
});
