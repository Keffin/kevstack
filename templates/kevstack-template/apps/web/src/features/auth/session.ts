import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { authClient } from "@/lib/auth-client.ts";

export const sessionQueryOptions = queryOptions({
  queryKey: ["auth", "session"],
  queryFn: async () => {
    const { data, error } = await authClient.getSession();
    if (error) throw new Error(error.message ?? "Failed to load session");
    return data;
  },
  staleTime: 60_000,
});

export type Session = NonNullable<Awaited<ReturnType<typeof authClient.getSession>>["data"]>;

export function useSignOut() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: () => authClient.signOut(),
    onSuccess: async () => {
      // Drop all cached server state that belonged to the previous user.
      queryClient.clear();
      await navigate({ to: "/login" });
    },
  });
}
