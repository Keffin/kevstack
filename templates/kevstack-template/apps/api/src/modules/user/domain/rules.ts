import { InvalidValueError } from "../../../shared/domain-error.ts";

/** Validation and normalisation rules for user fields. Throw `InvalidValueError` on failure. */

export const USERNAME_RULES = { minLength: 3, maxLength: 30, pattern: /^[a-z0-9_.]+$/ } as const;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Trims and lowercases, then validates. */
export function parseUsername(raw: unknown): string {
  const value = requireString("username", raw).trim().toLowerCase();
  const { minLength, maxLength, pattern } = USERNAME_RULES;
  if (value.length < minLength || value.length > maxLength) {
    throw new InvalidValueError(
      "username",
      `Username must be between ${minLength} and ${maxLength} characters`,
    );
  }
  if (!pattern.test(value)) {
    throw new InvalidValueError(
      "username",
      "Username may only contain letters, numbers, underscores and dots",
    );
  }
  return value;
}

export function isValidUsername(raw: unknown): boolean {
  try {
    parseUsername(raw);
    return true;
  } catch {
    return false;
  }
}

/** Trims and lowercases, then validates. */
export function parseEmail(raw: unknown): string {
  const value = requireString("email", raw).trim().toLowerCase();
  if (!EMAIL_PATTERN.test(value)) {
    throw new InvalidValueError("email", "Invalid email address");
  }
  return value;
}

function requireString(field: string, raw: unknown): string {
  if (typeof raw !== "string") throw new InvalidValueError(field, `${field} must be a string`);
  return raw;
}
