import { type Database, schema } from "@repo/db";
import { eq } from "drizzle-orm";
import { User, UsernameTakenError, type UserRepository } from "./domain/index.ts";

type UserRow = typeof schema.user.$inferSelect;
type UserInsert = typeof schema.user.$inferInsert;

const PG_UNIQUE_VIOLATION = "23505";

export class DrizzleUserRepository implements UserRepository {
  private readonly db: Database;

  public constructor(db: Database) {
    this.db = db;
  }

  public async findById(id: string): Promise<User | null> {
    const [row] = await this.db.select().from(schema.user).where(eq(schema.user.id, id)).limit(1);
    return row ? toDomain(row) : null;
  }

  public async findByUsername(username: string): Promise<User | null> {
    const [row] = await this.db
      .select()
      .from(schema.user)
      .where(eq(schema.user.username, username))
      .limit(1);
    return row ? toDomain(row) : null;
  }

  public async save(user: User): Promise<void> {
    const row = toDatabase(user);
    try {
      await this.db
        .insert(schema.user)
        .values(row)
        .onConflictDoUpdate({
          target: schema.user.id,
          set: {
            name: row.name,
            username: row.username,
            displayUsername: row.displayUsername,
            email: row.email,
            emailVerified: row.emailVerified,
            updatedAt: row.updatedAt,
          },
        });
    } catch (error) {
      if (isUniqueViolation(error, "user_username_unique")) {
        throw new UsernameTakenError(user.username);
      }
      throw error;
    }
  }
}

function toDomain(row: UserRow): User {
  return User.hydrate({
    id: row.id,
    name: row.name,
    username: row.username,
    email: row.email,
    emailVerified: row.emailVerified,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}

function toDatabase(user: User): UserInsert {
  return {
    id: user.id,
    name: user.name,
    username: user.username,
    displayUsername: user.username,
    email: user.email,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function isUniqueViolation(error: unknown, constraint: string): boolean {
  // Drizzle wraps driver errors; the pg error is available as `cause`.
  const pgError = error instanceof Error && error.cause ? error.cause : error;
  return (
    typeof pgError === "object" &&
    pgError !== null &&
    "code" in pgError &&
    pgError.code === PG_UNIQUE_VIOLATION &&
    "constraint" in pgError &&
    pgError.constraint === constraint
  );
}
