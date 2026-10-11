import { createFileRoute } from "@tanstack/react-router";
import { Greeting } from "@/features/hello/components/Greeting.tsx";

export const Route = createFileRoute("/")({
  loader: ({ context: { queryClient, trpc } }) =>
    queryClient.query(trpc.hello.greet.queryOptions({})),
  component: HomePage,
});

function HomePage() {
  return (
    <div className="stack">
      <h1>kevstack-template</h1>
      <p className="muted">React · TanStack Router & Query · tRPC · Drizzle · Better Auth</p>
      <Greeting />
    </div>
  );
}
