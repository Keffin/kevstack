import { type ApiSignInRequest, apiSignInRequestSchema } from "@repo/contracts";
import { useMutation } from "@tanstack/react-query";
import { type FormEvent, useState } from "react";
import { Field } from "@/components/ui/Field.tsx";
import { authClient } from "@/lib/auth-client.ts";
import { type FieldErrors, parseForm } from "@/lib/forms.ts";

interface SignInFormProps {
  onSuccess: () => void;
}

export function SignInForm({ onSuccess }: SignInFormProps) {
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<ApiSignInRequest>>({});

  const signIn = useMutation({
    mutationFn: async (input: ApiSignInRequest) => {
      const { error } = await authClient.signIn.email(input);
      if (error) throw new Error(error.message ?? "Sign in failed");
    },
    onSuccess,
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = parseForm(apiSignInRequestSchema, event.currentTarget);
    if (!result.success) {
      setFieldErrors(result.fieldErrors);
      return;
    }
    setFieldErrors({});
    signIn.mutate(result.data);
  }

  return (
    <form className="stack" onSubmit={handleSubmit} noValidate>
      <Field
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        error={fieldErrors.email}
      />
      <Field
        label="Password"
        name="password"
        type="password"
        autoComplete="current-password"
        error={fieldErrors.password}
      />
      {signIn.error && <p className="error">{signIn.error.message}</p>}
      <button type="submit" disabled={signIn.isPending}>
        {signIn.isPending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
