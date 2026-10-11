import { initTRPC, type TRPC_ERROR_CODE_KEY, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError, z } from "zod";
import { DomainError, type DomainErrorKind } from "../shared/domain-error.ts";
import type { Context } from "./context.ts";

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter: ({ shape, error }) => ({
    ...shape,
    data: {
      ...shape.data,
      zodError: error.cause instanceof ZodError ? z.flattenError(error.cause) : null,
    },
  }),
});

const domainErrorCodes = {
  validation: "BAD_REQUEST",
  not_found: "NOT_FOUND",
  conflict: "CONFLICT",
  forbidden: "FORBIDDEN",
} as const satisfies Record<DomainErrorKind, TRPC_ERROR_CODE_KEY>;

/**
 * Translates domain errors into tRPC errors so resolvers can stay free of transport concerns.
 */
const mapDomainErrors = t.middleware(async ({ next }) => {
  const result = await next();
  if (!result.ok && result.error.cause instanceof DomainError) {
    const cause = result.error.cause;
    throw new TRPCError({ code: domainErrorCodes[cause.kind], message: cause.message, cause });
  }
  return result;
});

export const router = t.router;
export const createCallerFactory = t.createCallerFactory;

export const publicProcedure = t.procedure.use(mapDomainErrors);

export const protectedProcedure = publicProcedure.use(({ ctx, next }) => {
  if (!ctx.session) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({ ctx: { ...ctx, session: ctx.session } });
});
