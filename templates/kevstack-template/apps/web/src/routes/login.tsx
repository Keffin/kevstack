import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { SignInForm } from "@/features/auth/components/SignInForm.tsx";
import { SignUpForm } from "@/features/auth/components/SignUpForm.tsx";
import { sessionQueryOptions } from "@/features/auth/session.ts";

const DEFAULT_REDIRECT = "/profile";

const loginSearchSchema = z.object({
  // Only allow same-origin paths to avoid open redirects.
  redirect: z
    .string()
    .refine((value) => value.startsWith("/") && !value.startsWith("//"))
    .optional()
    .catch(undefined),
});

export const Route = createFileRoute("/login")({
  validateSearch: loginSearchSchema,
  beforeLoad: async ({ context, search }) => {
    const session = await context.queryClient.query(sessionQueryOptions);
    if (session) throw redirect({ href: search.redirect ?? DEFAULT_REDIRECT });
  },
  component: LoginPage,
});

function LoginPage() {
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const search = Route.useSearch();
  const router = useRouter();
  const queryClient = useQueryClient();

  async function handleAuthenticated() {
    await queryClient.invalidateQueries(sessionQueryOptions);
    router.history.push(search.redirect ?? DEFAULT_REDIRECT);
  }

  const isSignIn = mode === "sign-in";

  return (
    <div className="stack">
      <h1>{isSignIn ? "Sign in" : "Create an account"}</h1>
      <div className="card">
        {isSignIn ? (
          <SignInForm onSuccess={handleAuthenticated} />
        ) : (
          <SignUpForm onSuccess={handleAuthenticated} />
        )}
      </div>
      <p className="muted">
        {isSignIn ? "No account yet? " : "Already have an account? "}
        <button
          type="button"
          className="link"
          onClick={() => setMode(isSignIn ? "sign-up" : "sign-in")}
        >
          {isSignIn ? "Sign up" : "Sign in"}
        </button>
      </p>
    </div>
  );
}
