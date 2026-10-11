import { User } from "../../src/modules/user/domain/index.ts";

/** Builds a valid user whose email is derived from the username. */
export function aUser(username: string): User {
  return User.create({ name: username, username, email: `${username}@example.com` });
}
