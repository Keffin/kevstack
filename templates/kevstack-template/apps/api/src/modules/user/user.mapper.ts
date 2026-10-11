import type { ApiUserResponse } from "@repo/contracts";
import type { User } from "./domain/index.ts";

/** Maps between the User aggregate and its API representation. */
export const UserMapper = {
  toResponse(user: User): ApiUserResponse {
    return {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
    };
  },
};
