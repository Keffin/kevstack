import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { toNodeHandler } from "better-auth/node";
import cors from "cors";
import express, { type Express } from "express";
import type { Env } from "./env.ts";
import type { Container } from "./container.ts";
import { errorHandler, notFoundHandler } from "./middleware/error-handler.ts";
import { requestLogger } from "./middleware/request-logger.ts";
import { AUTH_BASE_PATH } from "./auth.ts";
import { createHealthRouter } from "./modules/health/health.routes.ts";
import { createContextFactory } from "./trpc/context.ts";
import { appRouter } from "./trpc/router.ts";

export interface AppDeps {
  container: Container;
  env: Pick<Env, "CLIENT_URL" | "NODE_ENV">;
}

export function createApp({ container, env }: AppDeps): Express {
  const app = express();

  app.disable("x-powered-by");
  app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
  if (env.NODE_ENV !== "test") app.use(requestLogger);

  app.use("/health", createHealthRouter(container.health));

  // Better Auth must be mounted before any body-parsing middleware.
  app.all(`${AUTH_BASE_PATH}/{*any}`, toNodeHandler(container.auth));

  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext: createContextFactory(container),
      onError: ({ error, path }) => {
        if (error.code === "INTERNAL_SERVER_ERROR") {
          console.error(`tRPC error on "${path ?? "<no-path>"}":`, error);
        }
      },
    }),
  );

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
