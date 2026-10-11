import { type ApiSignUpRequest, apiSignUpRequestSchema } from "@repo/contracts";
import { useMutation } from "@tanstack/react-query";
import { type FormEvent, useState } from "react";
import { Field } from "@/components/ui/Field.tsx";
import { authClient } from "@/lib/auth-client.ts";
import { type FieldErrors, parseForm } from "@/lib/forms.ts";

interface SignUpFormProps {
  onSuccess: () => void;
}

export function SignUpForm({ onSuccess }: SignUpFormProps) {
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<ApiSignUpRequest>>({});

  const signUp = useMutation({
    mutationFn: async (input: ApiSignUpRequest) => {
      const { error } = await authClient.signUp.email(input);
      if (error) throw new Error(error.message ?? "Sign up failed");
    },
    onSuccess,
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = parseForm(apiSignUpRequestSchema, event.currentTarget);
    if (!result.success) {
      setFieldErrors(result.fieldErrors);
      return;
    }
    setFieldErrors({});
    signUp.mutate(result.data);
  }

  return (
    <form className="stack" onSubmit={handleSubmit} noValidate>
      <Field label="Name" name="name" autoComplete="name" error={fieldErrors.name} />
      <Field
        label="Username"
        name="username"
        autoComplete="username"
        error={fieldErrors.username}
      />
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
        autoComplete="new-password"
        error={fieldErrors.password}
      />
      {signUp.error && <p className="error">{signUp.error.message}</p>}
      <button type="submit" disabled={signUp.isPending}>
        {signUp.isPending ? "Creating account…" : "Create account"}
      </button>
    </form>
  );
}
