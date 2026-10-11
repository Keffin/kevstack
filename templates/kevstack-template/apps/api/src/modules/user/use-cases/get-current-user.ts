import { type User, UserNotFoundError, type UserRepository } from "../domain/index.ts";

export class GetCurrentUser {
  private readonly users: UserRepository;

  public constructor(users: UserRepository) {
    this.users = users;
  }

  public async execute(userId: string): Promise<User> {
    const user = await this.users.findById(userId);
    if (!user) throw new UserNotFoundError(userId);
    return user;
  }
}
