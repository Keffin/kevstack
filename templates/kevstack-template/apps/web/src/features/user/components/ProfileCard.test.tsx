import type { ApiUserResponse } from "@repo/contracts";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ProfileCard } from "./ProfileCard.tsx";

describe("ProfileCard", () => {
  afterEach(cleanup);

  it("renders the user's details", () => {
    // Arrange
    const user: ApiUserResponse = {
      id: "1",
      name: "Ada Lovelace",
      username: "ada",
      email: "ada@example.com",
      emailVerified: false,
      createdAt: new Date("2026-01-01"),
    };

    // Act
    render(<ProfileCard user={user} />);

    // Assert
    expect(screen.getByText("Ada Lovelace")).toBeTruthy();
    expect(screen.getByText("@ada")).toBeTruthy();
    expect(screen.getByText("(unverified)")).toBeTruthy();
  });
});
