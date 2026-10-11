import { createFileRoute, redirect } from "@tanstack/react-router";
import { sessionQueryOptions } from "@/features/auth/session.ts";

/** Pathless layout route: every route nested under `_authenticated/` requires a session. */
export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async ({ context, location }) => {
    const session = await context.queryClient.query(sessionQueryOptions);
    if (!session) {
      throw redirect({ to: "/login", search: { redirect: location.href } });
    }
    return { session };
  },
});
