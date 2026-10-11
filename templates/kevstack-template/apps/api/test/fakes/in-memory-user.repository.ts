import type { User, UserRepository } from "../../src/modules/user/domain/index.ts";

export class InMemoryUserRepository implements UserRepository {
  public readonly users = new Map<string, User>();

  public async findById(id: string): Promise<User | null> {
    return this.users.get(id) ?? null;
  }

  public async findByUsername(username: string): Promise<User | null> {
    return [...this.users.values()].find((user) => user.username === username) ?? null;
  }

  public async save(user: User): Promise<void> {
    this.users.set(user.id, user);
  }
}
