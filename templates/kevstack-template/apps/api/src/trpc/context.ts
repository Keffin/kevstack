import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { fromNodeHeaders } from "better-auth/node";
import type { AuthSession } from "../auth.ts";
import type { Container, UseCases } from "../container.ts";

export interface Context {
  session: AuthSession | null;
  useCases: UseCases;
}

export function createContextFactory(container: Container) {
  return async ({ req }: CreateExpressContextOptions): Promise<Context> => {
    const session = await container.auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });
    return { session, useCases: container.useCases };
  };
}
