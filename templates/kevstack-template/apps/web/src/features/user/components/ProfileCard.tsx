import type { ApiUserResponse } from "@repo/contracts";

const dateFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" });

export function ProfileCard({ user }: { user: ApiUserResponse }) {
  return (
    <section className="card">
      <dl>
        <dt>Name</dt>
        <dd>{user.name}</dd>
        <dt>Username</dt>
        <dd>@{user.username}</dd>
        <dt>Email</dt>
        <dd>
          {user.email} {!user.emailVerified && <span className="muted">(unverified)</span>}
        </dd>
        <dt>Joined</dt>
        <dd>{dateFormatter.format(user.createdAt)}</dd>
      </dl>
    </section>
  );
}
