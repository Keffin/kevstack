import { z } from "zod";

export type FieldErrors<T> = Partial<Record<keyof T, string>>;

export type FormParseResult<T> =
  | { success: true; data: T }
  | { success: false; fieldErrors: FieldErrors<T> };

/** Validates a submitted <form> against a Zod schema shared with the API. */
export function parseForm<TSchema extends z.ZodObject>(
  schema: TSchema,
  form: HTMLFormElement,
): FormParseResult<z.output<TSchema>> {
  const result = schema.safeParse(Object.fromEntries(new FormData(form)));
  if (result.success) return { success: true, data: result.data };

  const fieldErrors: FieldErrors<z.output<TSchema>> = {};
  for (const [field, messages] of Object.entries(z.flattenError(result.error).fieldErrors)) {
    const message = (messages as string[] | undefined)?.[0];
    if (message) fieldErrors[field as keyof z.output<TSchema>] = message;
  }
  return { success: false, fieldErrors };
}
