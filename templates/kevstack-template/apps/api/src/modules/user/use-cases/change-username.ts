import {
  type User,
  UsernameTakenError,
  UserNotFoundError,
  type UserRepository,
} from "../domain/index.ts";

export class ChangeUsername {
  private readonly users: UserRepository;

  public constructor(users: UserRepository) {
    this.users = users;
  }

  public async execute(userId: string, username: string): Promise<User> {
    const user = await this.users.findById(userId);
    if (!user) throw new UserNotFoundError(userId);

    const updated = user.changeUsername(username);
    if (updated === user) return user;

    if (await this.users.findByUsername(updated.username)) {
      throw new UsernameTakenError(updated.username);
    }

    await this.users.save(updated);
    return updated;
  }
}
