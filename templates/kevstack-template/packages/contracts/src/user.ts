import { z } from "zod";

/**
 * Primitive validation rules shared by the API (domain value objects, tRPC inputs)
 * and the web app (form validation). Single source of truth for "what is a valid X".
 */
export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 30;
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(USERNAME_MIN_LENGTH, `Username must be at least ${USERNAME_MIN_LENGTH} characters`)
  .max(USERNAME_MAX_LENGTH, `Username must be at most ${USERNAME_MAX_LENGTH} characters`)
  .regex(/^[a-z0-9_.]+$/, "Username may only contain letters, numbers, underscores and dots");

export const emailSchema = z.string().trim().toLowerCase().pipe(z.email("Invalid email address"));

export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`)
  .max(PASSWORD_MAX_LENGTH, `Password must be at most ${PASSWORD_MAX_LENGTH} characters`);

export const displayNameSchema = z.string().trim().min(1, "Name is required").max(100);

/** What the API exposes about a user. Never includes credentials. */
export const apiUserResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  username: z.string(),
  email: z.string(),
  emailVerified: z.boolean(),
  createdAt: z.date(),
});
export type ApiUserResponse = z.infer<typeof apiUserResponseSchema>;

export const apiSignUpRequestSchema = z.object({
  name: displayNameSchema,
  username: usernameSchema,
  email: emailSchema,
  password: passwordSchema,
});
export type ApiSignUpRequest = z.infer<typeof apiSignUpRequestSchema>;

export const apiSignInRequestSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});
export type ApiSignInRequest = z.infer<typeof apiSignInRequestSchema>;

export const apiChangeUsernameRequestSchema = z.object({
  username: usernameSchema,
});
export type ApiChangeUsernameRequest = z.infer<typeof apiChangeUsernameRequestSchema>;
