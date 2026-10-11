import type { QueryClient } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { createRootRouteWithContext, Link, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { sessionQueryOptions, useSignOut } from "@/features/auth/session.ts";
import type { trpc } from "@/lib/trpc.ts";

export interface RouterContext {
  queryClient: QueryClient;
  trpc: typeof trpc;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
  notFoundComponent: () => <p>Page not found.</p>,
});

function RootLayout() {
  return (
    <div className="layout">
      <Nav />
      <main>
        <Outlet />
      </main>
      <ReactQueryDevtools buttonPosition="bottom-left" />
      <TanStackRouterDevtools position="bottom-right" />
    </div>
  );
}

function Nav() {
  const { data: session } = useQuery(sessionQueryOptions);
  const signOut = useSignOut();

  return (
    <nav className="nav">
      <Link to="/" activeProps={{ className: "active" }} activeOptions={{ exact: true }}>
        Home
      </Link>
      <Link to="/profile" activeProps={{ className: "active" }}>
        Profile
      </Link>
      <span className="spacer" />
      {session ? (
        <>
          <span className="muted">@{session.user.username}</span>
          <button
            type="button"
            className="link"
            onClick={() => signOut.mutate()}
            disabled={signOut.isPending}
          >
            Sign out
          </button>
        </>
      ) : (
        <Link to="/login">Sign in</Link>
      )}
    </nav>
  );
}
