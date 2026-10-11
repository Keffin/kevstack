import { type ApiChangeUsernameRequest, apiChangeUsernameRequestSchema } from "@repo/contracts";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type FormEvent, useState } from "react";
import { Field } from "@/components/ui/Field.tsx";
import { sessionQueryOptions } from "@/features/auth/session.ts";
import { type FieldErrors, parseForm } from "@/lib/forms.ts";
import { trpc } from "@/lib/trpc.ts";

export function ChangeUsernameForm({ currentUsername }: { currentUsername: string }) {
  const queryClient = useQueryClient();
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<ApiChangeUsernameRequest>>({});

  const changeUsername = useMutation(
    trpc.user.changeUsername.mutationOptions({
      onSuccess: async (user) => {
        queryClient.setQueryData(trpc.user.me.queryKey(), user);
        await queryClient.invalidateQueries(sessionQueryOptions);
      },
    }),
  );

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = parseForm(apiChangeUsernameRequestSchema, event.currentTarget);
    if (!result.success) {
      setFieldErrors(result.fieldErrors);
      return;
    }
    setFieldErrors({});
    changeUsername.mutate(result.data);
  }

  return (
    <form className="card stack" onSubmit={handleSubmit} noValidate>
      <Field
        label="New username"
        name="username"
        defaultValue={currentUsername}
        error={fieldErrors.username}
      />
      {changeUsername.error && <p className="error">{changeUsername.error.message}</p>}
      {changeUsername.isSuccess && <p className="muted">Username updated.</p>}
      <button type="submit" disabled={changeUsername.isPending}>
        {changeUsername.isPending ? "Saving…" : "Change username"}
      </button>
    </form>
  );
}
