import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { ChangeUsernameForm } from "@/features/user/components/ChangeUsernameForm.tsx";
import { ProfileCard } from "@/features/user/components/ProfileCard.tsx";
import { trpc } from "@/lib/trpc.ts";

export const Route = createFileRoute("/_authenticated/profile")({
  loader: ({ context }) => context.queryClient.query(context.trpc.user.me.queryOptions()),
  component: ProfilePage,
});

function ProfilePage() {
  const { data: user } = useSuspenseQuery(trpc.user.me.queryOptions());

  return (
    <div className="stack">
      <h1>Profile</h1>
      <ProfileCard user={user} />
      <ChangeUsernameForm key={user.username} currentUsername={user.username} />
    </div>
  );
}
