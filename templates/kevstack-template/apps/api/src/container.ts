import type { Database } from "@repo/db";
import { type Auth, createAuth } from "./auth.ts";
import type { Env } from "./env.ts";
import { HealthService } from "./modules/health/health.service.ts";
import { ChangeUsername } from "./modules/user/use-cases/change-username.ts";
import { GetCurrentUser } from "./modules/user/use-cases/get-current-user.ts";
import { DrizzleUserRepository } from "./modules/user/user.repository.drizzle.ts";

export interface UseCases {
  getCurrentUser: GetCurrentUser;
  changeUsername: ChangeUsername;
}

export interface Container {
  auth: Auth;
  health: HealthService;
  useCases: UseCases;
}

/** Composition root: the only place that knows which adapter backs each port. */
export function createContainer(deps: { db: Database; env: Env }): Container {
  const userRepository = new DrizzleUserRepository(deps.db);

  return {
    auth: createAuth(deps),
    health: new HealthService(deps.db),
    useCases: {
      getCurrentUser: new GetCurrentUser(userRepository),
      changeUsername: new ChangeUsername(userRepository),
    },
  };
}
