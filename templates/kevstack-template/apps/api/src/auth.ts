import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "@repo/contracts";
import { type Database, schema } from "@repo/db";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { username } from "better-auth/plugins";
import type { Env } from "./env.ts";
import { isValidUsername, parseEmail, parseUsername } from "./modules/user/domain/index.ts";
import { InvalidValueError } from "./shared/domain-error.ts";

export const AUTH_BASE_PATH = "/api/auth";

export interface AuthDeps {
  db: Database;
  env: Pick<Env, "BETTER_AUTH_URL" | "BETTER_AUTH_SECRET" | "CLIENT_URL">;
}

export function createAuth({ db, env }: AuthDeps) {
  return betterAuth({
    baseURL: env.BETTER_AUTH_URL,
    basePath: AUTH_BASE_PATH,
    secret: env.BETTER_AUTH_SECRET,
    trustedOrigins: [env.CLIENT_URL],
    database: drizzleAdapter(db, { provider: "pg", schema }),
    emailAndPassword: {
      enabled: true,
      minPasswordLength: PASSWORD_MIN_LENGTH,
      maxPasswordLength: PASSWORD_MAX_LENGTH,
    },
    plugins: [username({ usernameValidator: (value) => isValidUsername(value) })],
    hooks: {
      // Registration must satisfy the User domain's invariants (username is required here).
      before: createAuthMiddleware(async (ctx) => {
        if (ctx.path !== "/sign-up/email") return;
        const body: Record<string, unknown> = ctx.body ?? {};
        try {
          parseUsername(body["username"]);
          parseEmail(body["email"]);
        } catch (error) {
          if (error instanceof InvalidValueError) {
            throw new APIError("BAD_REQUEST", { message: error.message });
          }
          throw error;
        }
      }),
    },
  });
}

export type Auth = ReturnType<typeof createAuth>;
export type AuthSession = Auth["$Infer"]["Session"];
