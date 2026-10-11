import { parseEmail, parseUsername } from "./rules.ts";

export interface UserProps {
  id: string;
  name: string;
  username: string;
  email: string;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserProps {
  name: string;
  username: string;
  email: string;
}

/**
 * User aggregate root. Immutable: behaviour methods return a new `User` rather than
 * mutating, so all fields can be public and readonly. Invariants are enforced on the way in.
 */
export class User {
  public readonly id: string;
  public readonly name: string;
  public readonly username: string;
  public readonly email: string;
  public readonly emailVerified: boolean;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;

  private constructor(props: UserProps) {
    this.id = props.id;
    this.name = props.name;
    this.username = props.username;
    this.email = props.email;
    this.emailVerified = props.emailVerified;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  /** Creates a brand-new user, validating and normalising its fields. */
  public static create(props: CreateUserProps, now: Date = new Date()): User {
    return new User({
      id: crypto.randomUUID(),
      name: props.name,
      username: parseUsername(props.username),
      email: parseEmail(props.email),
      emailVerified: false,
      createdAt: now,
      updatedAt: now,
    });
  }

  /** Rebuilds a user from persisted state. Trusts the data: it was valid when saved. */
  public static hydrate(props: UserProps): User {
    return new User(props);
  }

  public changeUsername(username: string, now: Date = new Date()): User {
    const next = parseUsername(username);
    if (next === this.username) return this;
    return new User({ ...this, username: next, updatedAt: now });
  }
}
