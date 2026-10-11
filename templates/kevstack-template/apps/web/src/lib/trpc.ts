import type { AppRouter } from "@repo/api/router";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import superjson from "superjson";
import { queryClient } from "./query-client.ts";

export const trpcClient = createTRPCClient<AppRouter>({
  links: [httpBatchLink({ url: "/api/trpc", transformer: superjson })],
});

/**
 * Type-safe factory for TanStack Query options, e.g.
 * `useQuery(trpc.hello.greet.queryOptions({ name }))`.
 * Usable both in components and in route loaders.
 */
export const trpc = createTRPCOptionsProxy<AppRouter>({ client: trpcClient, queryClient });
