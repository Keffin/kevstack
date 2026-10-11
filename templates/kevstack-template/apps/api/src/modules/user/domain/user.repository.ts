import type { User } from "./user.ts";

/** Port: the domain's view of user persistence. Implemented by an adapter (e.g. Drizzle). */
export interface UserRepository {
  findById(id: string): Promise<User | null>;
  /** Expects a normalised username (see `parseUsername`). */
  findByUsername(username: string): Promise<User | null>;
  /** Inserts or updates the aggregate. */
  save(user: User): Promise<void>;
}
