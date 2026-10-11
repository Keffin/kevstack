import { DomainError } from "../../../shared/domain-error.ts";

export class UserNotFoundError extends DomainError {
  public readonly kind = "not_found";

  public constructor(id: string) {
    super(`User ${id} not found`);
  }
}

export class UsernameTakenError extends DomainError {
  public readonly kind = "conflict";

  public constructor(username: string) {
    super(`Username "${username}" is already taken`);
  }
}
