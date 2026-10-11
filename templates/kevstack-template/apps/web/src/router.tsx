import { createRouter } from "@tanstack/react-router";
import { queryClient } from "./lib/query-client.ts";
import { trpc } from "./lib/trpc.ts";
import { routeTree } from "./routeTree.gen.ts";

export const router = createRouter({
  routeTree,
  context: { queryClient, trpc },
  defaultPreload: "intent",
  // Let TanStack Query decide freshness: loaders call queryClient.query(), which honours staleTime.
  defaultPreloadStaleTime: 0,
  scrollRestoration: true,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
